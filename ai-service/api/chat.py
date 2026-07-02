"""
Chat API route — POST /chat endpoint.

Returns an SSE stream of LLM tokens. No business logic lives here;
everything is delegated to the orchestrator.

SSE event format:
  data: {"type": "token", "data": "..."}\n\n
  data: {"type": "metadata", "citations": [...], "sources": [...], "emergency": false}\n\n
  data: {"type": "done"}\n\n
  data: {"type": "error", "message": "..."}\n\n
"""

import json
import logging
from typing import Iterator, List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from orchestrator.orchestrator import orchestrate_chat
from schemas.chat import ChatRequest

logger = logging.getLogger(__name__)

router = APIRouter()


def build_contextual_next_steps(
    programs: List[Dict[str, Any]],
    user_message: str,
) -> List[Dict[str, str]]:
    """
    Generate contextual next steps based on program eligibility and user situation.
    
    Heuristics:
    - If eligible programs: include application action with specific document requirements
    - If partial-match programs: guide information gathering for missing fields
    - If no eligible programs: suggest related programs or information gathering
    
    Args:
        programs: List of program dicts with 'name', 'id', 'eligibilityStatus' fields
        user_message: The user's original message for context
    
    Returns:
        List of next step dicts with 'text', 'action', and 'target' fields
    """
    steps = []
    
    # Group programs by eligibility
    eligible = [p for p in programs if p.get("eligibilityStatus") == "eligible"]
    partial = [p for p in programs if p.get("eligibilityStatus") == "partial"]
    ineligible = [p for p in programs if p.get("eligibilityStatus") == "ineligible"]
    
    # Eligible programs: encourage application
    for program in eligible[:2]:  # Max 2 eligible programs
        program_name = program.get("name", "program ini")
        program_id = program.get("id", "")
        steps.append({
            "text": f"Ajukan {program_name} - Anda memenuhi syarat",
            "action": "apply",
            "target": program_id
        })
        # Add document preparation step for first eligible program
        if len(steps) == 1:
            steps.append({
                "text": "Siapkan dokumen: KTP, Kartu Keluarga, Surat Keterangan Penghasilan",
                "action": "prepare_documents",
                "target": program_id
            })
    
    # Partial match: guide information gathering
    for program in partial[:1]:  # Max 1 partial program
        program_name = program.get("name", "program ini")
        missing_fields = program.get("missingFields", [])
        if missing_fields:
            missing_str = ", ".join(missing_fields[:2])  # Max 2 fields
            steps.append({
                "text": f"Lengkapi informasi untuk {program_name}: {missing_str}",
                "action": "gather_info",
                "target": program.get("id", "")
            })
        else:
            steps.append({
                "text": f"Lengkapi informasi untuk verifikasi kelayakan {program_name}",
                "action": "gather_info",
                "target": program.get("id", "")
            })
    
    # If no eligible or partial, suggest exploring all programs
    if not eligible and not partial:
        steps.append({
            "text": "Lihat semua program bantuan sosial yang tersedia",
            "action": "view",
            "target": "/programs"
        })
        # Suggest information gathering if user message is vague
        if len(user_message.split()) < 10:
            steps.append({
                "text": "Ceritakan lebih detail tentang situasi Anda untuk rekomendasi yang lebih tepat",
                "action": "gather_info",
                "target": "user_situation"
            })
    
    # Add view details step if we have eligible programs
    if eligible and len(steps) < 4:
        steps.append({
            "text": f"Lihat detail lengkap {eligible[0].get('name', 'program')}",
            "action": "view",
            "target": eligible[0].get("id", "")
        })
    
    return steps[:4]  # Max 4 steps for clarity


@router.post("")
async def chat(request: ChatRequest):
    """Handle a chat request with streaming SSE response.

    The route contains NO business logic — it delegates entirely to the
    orchestrator and formats the output as SSE events.
    """
    import time
    
    request_id = f"{int(time.time() * 1000)}"
    start_time = time.time()
    
    logger.info("\n" + "=" * 80)
    logger.info(f"📨 API: New chat request received (ID: {request_id})")
    logger.info(f"   Message: {request.message[:100]}{'...' if len(request.message) > 100 else ''}")
    logger.info(f"   Conversation: {len(request.conversation)} messages")
    logger.info(f"   User context: {request.user_context if request.user_context else 'None'}")
    logger.info("=" * 80)
    
    try:
        logger.info("🚀 Calling orchestrator...")
        orchestrator_start = time.time()
        
        token_stream, citations, sources, programs, actions, next_steps = orchestrate_chat(
            message=request.message,
            conversation=[
                {"role": m.role, "content": m.content}
                for m in request.conversation
            ],
            user_context=request.user_context,
        )
        
        orchestrator_time = time.time() - orchestrator_start
        logger.info(f"✅ Orchestrator setup completed in {orchestrator_time:.3f}s")
        logger.info(f"   Citations: {len(citations)}, Sources: {len(sources)}")
        logger.info(f"   Programs: {len(programs)}, Actions: {len(actions)}")
        logger.info(f"   Next steps: {len(next_steps)}")
        
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"❌ Orchestrator error after {elapsed:.3f}s: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat memproses permintaan Anda.",
        )

    def sse_stream() -> Iterator[str]:
        """Generate SSE events from the orchestrator's token stream."""
        accumulated = []
        token_count = 0
        stream_start = time.time()
        first_token_time = None
        in_json_block = False
        json_buffer = ""
        brace_count = 0
        text_buffer = ""  # Buffer for detecting inline program markers
        
        try:
            logger.info("📡 Starting SSE stream...")
            
            for token in token_stream:
                if first_token_time is None:
                    first_token_time = time.time()
                    ttft = first_token_time - stream_start
                    logger.info(f"   ⚡ First token streamed to client in {ttft:.3f}s")
                
                accumulated.append(token)
                token_count += 1
                
                # Detect JSON block start (either ```json or plain json {)
                if not in_json_block:
                    # Check for JSON block with various formats
                    token_lower = token.lower().strip()
                    
                    # Detect start of markdown JSON block (```json)
                    if "```json" in token_lower or token.strip() == "```":
                        in_json_block = True
                        json_buffer = token
                        brace_count = 0
                        logger.info("   🔒 Detected markdown JSON block start, filtering from stream...")
                        continue
                    # Handle "json {" in single token (common LLM output)
                    elif "json" in token_lower and "{" in token and token_count <= 5:
                        in_json_block = True
                        json_buffer = token
                        brace_count = token.count("{") - token.count("}")
                        logger.info("   🔒 Detected 'json {' pattern, filtering from stream...")
                        continue
                    # Handle multi-line token with "json\n{\n..." pattern
                    elif "json\n{" in token.lower() and token_count <= 5:
                        in_json_block = True
                        json_buffer = token
                        brace_count = token.count("{") - token.count("}")
                        logger.info("   🔒 Detected 'json\\n{' multi-line pattern, filtering from stream...")
                        continue
                    # Filter standalone "json" word at very start of response
                    elif token_lower == "json" and token_count <= 3:
                        # LLM is outputting "json" followed by {
                        in_json_block = True
                        json_buffer = token
                        brace_count = 0
                        logger.info("   🔒 Detected 'json' keyword at start, filtering from stream...")
                        continue
                    # Filter "json" variations
                    elif token_lower in ["json\n", "\njson", "\njson\n", "json ", " json"] and token_count <= 5:
                        in_json_block = True
                        json_buffer = json_buffer + token if json_buffer else token
                        logger.info("   🔒 Filtering 'json' keyword variation...")
                        continue
                    # Detect { after "json" was filtered (part of json { pattern)
                    elif token.strip().startswith("{") and len(json_buffer) > 0 and token_count <= 6:
                        # This is the { right after "json" was filtered
                        json_buffer += token
                        brace_count = token.count("{") - token.count("}")
                        logger.info("   🔒 Detected { after 'json', continuing filter...")
                        continue
                    # Detect plain { at start (fallback for plain JSON)
                    elif token.strip() == "{" and not text_buffer and token_count <= 3:
                        in_json_block = True
                        json_buffer = token
                        brace_count = 1
                        logger.info("   🔒 Detected plain { at start, filtering from stream...")
                        continue
                
                # If in JSON block, buffer and check for end
                if in_json_block:
                    json_buffer += token
                    brace_count += token.count("{") - token.count("}")
                    
                    # Check if JSON block ended (markdown or plain JSON)
                    if "```" in token and len(json_buffer) > 10:  # Closing ``` after some content
                        in_json_block = False
                        logger.info(f"   ✅ Filtered complete JSON block ({len(json_buffer)} chars)")
                        json_buffer = ""
                        brace_count = 0
                        continue
                    elif "{" in json_buffer and brace_count == 0 and len(json_buffer) > 20:
                        # Plain JSON object closed
                        in_json_block = False
                        logger.info(f"   ✅ Filtered complete JSON block ({len(json_buffer)} chars)")
                        json_buffer = ""
                        brace_count = 0
                        continue
                    else:
                        # Still inside JSON block, keep filtering
                        continue
                
                # Buffer tokens to detect inline markers [PROGRAM:id] or [ACTION:type]
                text_buffer += token
                
                # Check for complete inline program marker
                import re
                program_marker_pattern = r'\[PROGRAM:([a-z0-9\-]+)\]'
                program_match = re.search(program_marker_pattern, text_buffer)
                
                # Check for complete inline action marker
                action_marker_pattern = r'\[ACTION:([a-z0-9\-]+)\]'
                action_match = re.search(action_marker_pattern, text_buffer)
                
                # Process program marker if found
                if program_match:
                    # Found a complete program marker
                    program_id = program_match.group(1)
                    before_marker = text_buffer[:program_match.start()]
                    after_marker = text_buffer[program_match.end():]
                    
                    # Stream text before marker
                    if before_marker:
                        event = {"type": "token", "data": before_marker}
                        yield f"data: {json.dumps(event)}\n\n"
                    
                    # Find program data from the programs list
                    program_data = None
                    for prog in programs:
                        if prog.get("id") == program_id:
                            program_data = prog
                            break
                    
                    # Emit inline program card event with full program data
                    logger.info(f"   💡 Detected inline program marker: {program_id}")
                    if program_data:
                        logger.info(f"      ✅ Found program data: {program_data.get('name', 'Unknown')}")
                        inline_event = {
                            "type": "inline-program",
                            "program_id": program_id,
                            "program": program_data  # Send full program data
                        }
                    else:
                        logger.info(f"      ⚠️  Program data not found, sending ID only")
                        inline_event = {
                            "type": "inline-program",
                            "program_id": program_id
                        }
                    yield f"data: {json.dumps(inline_event)}\n\n"
                    
                    # Keep the rest in buffer
                    text_buffer = after_marker
                
                # Process action marker if found (and no program marker in same position)
                elif action_match:
                    # Found a complete action marker
                    action_type = action_match.group(1)
                    before_marker = text_buffer[:action_match.start()]
                    after_marker = text_buffer[action_match.end():]
                    
                    # Stream text before marker
                    if before_marker:
                        event = {"type": "token", "data": before_marker}
                        yield f"data: {json.dumps(event)}\n\n"
                    
                    # Emit inline action button event
                    logger.info(f"   💡 Detected inline action marker: {action_type}")
                    action_event = {
                        "type": "inline-action",
                        "action_type": action_type
                    }
                    yield f"data: {json.dumps(action_event)}\n\n"
                    
                    # Keep the rest in buffer
                    text_buffer = after_marker
                
                else:
                    # No complete marker yet, check if we should flush some text
                    # Flush if buffer is getting long and no potential marker
                    if len(text_buffer) > 100 and '[PROGRAM:' not in text_buffer[-20:] and '[ACTION:' not in text_buffer[-20:]:
                        # Flush most of buffer, keep last 20 chars in case marker is split
                        to_flush = text_buffer[:-20]
                        text_buffer = text_buffer[-20:]
                        event = {"type": "token", "data": to_flush}
                        yield f"data: {json.dumps(event)}\n\n"
            
            # Flush remaining text buffer
            if text_buffer:
                event = {"type": "token", "data": text_buffer}
                yield f"data: {json.dumps(event)}\n\n"

            stream_time = time.time() - stream_start
            logger.info(f"   ✅ Finished streaming {token_count} tokens in {stream_time:.3f}s")

            # Extract intent classification from LLM response
            logger.info("🧠 Extracting intent classification from response...")
            from orchestrator.intent_parser import extract_intent_from_response, apply_intent_to_metadata, filter_programs_by_intent
            
            full_response = "".join(accumulated)
            intent_classification, cleaned_response = extract_intent_from_response(full_response)
            
            # Override metadata based on LLM's intent classification
            final_programs = filter_programs_by_intent(intent_classification, programs)
            final_actions, final_next_steps = apply_intent_to_metadata(
                intent_classification,
                final_programs,
                request.message,
            )
            
            # Generate contextual next steps based on programs and situation
            contextual_next_steps = build_contextual_next_steps(
                programs=final_programs,
                user_message=request.message,
            )
            
            # Use contextual next steps if generated, otherwise fall back to intent-based
            if contextual_next_steps:
                final_next_steps = contextual_next_steps
                logger.info(f"   ✅ Generated {len(contextual_next_steps)} contextual next steps")
            
            logger.info(f"   Intent-based override:")
            logger.info(f"      - Programs: {len(programs)} → {len(final_programs)}")
            logger.info(f"      - Actions: {len(actions)} → {len(final_actions)}")
            logger.info(f"      - Next steps: {len(next_steps)} → {len(final_next_steps)}")

            # Emit metadata.
            # Note: the post-LLM tone/Indonesian transformation that
            # previously ran here was relocated to the frontend (see Bug 1
            # + Bug 3 fix: src/lib/streamed-text-cleanup.ts). The streamed-
            # text cleanup runs on render so the response delivered to the
            # user matches the streamed one.
            metadata = {
                "type": "metadata",
                "citations": citations,
                "sources": sources,
                "programs": final_programs,  # Use intent-filtered programs
                "actions": final_actions,  # Use intent-based actions
                "next_steps": final_next_steps,  # Use intent-based next steps
            }
            
            # Assertion: Ensure intent_classification is NEVER included in client-facing metadata
            assert "intent_classification" not in metadata, "intent_classification must not be exposed to client"
            logger.info("   ✅ Verified: intent_classification not in metadata (internal use only)")
            
            yield f"data: {json.dumps(metadata)}\n\n"
            logger.info("   📤 Metadata sent to client")
            logger.info(f"      - Programs: {len(final_programs)}")
            logger.info(f"      - Actions: {len(final_actions)}")
            logger.info(f"      - Next steps: {len(final_next_steps)}")

            # End event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
            total_time = time.time() - start_time
            logger.info(f"\n✅ REQUEST COMPLETED (ID: {request_id})")
            logger.info(f"   📊 Final Metrics:")
            logger.info(f"      - Total tokens: {token_count}")
            logger.info(f"      - Total time: {total_time:.3f}s")
            logger.info(f"      - Orchestrator setup: {orchestrator_time:.3f}s")
            logger.info(f"      - Streaming time: {stream_time:.3f}s")
            if token_count > 0 and stream_time > 0:
                logger.info(f"      - Tokens/second: {token_count / stream_time:.2f}")
            if intent_classification:
                logger.info(f"      - Intent: {intent_classification.get('primary_intent', 'unknown')} (confidence: {intent_classification.get('confidence', 0)})")
            logger.info("=" * 80 + "\n")

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"❌ Streaming error after {elapsed:.3f}s: {type(e).__name__}: {str(e)}", exc_info=True)
            logger.error(f"   Tokens streamed before error: {token_count}")
            error_event = {
                "type": "error",
                "message": "Terjadi kesalahan saat menghasilkan respons.",
            }
            yield f"data: {json.dumps(error_event)}\n\n"
            logger.info("=" * 80 + "\n")

    return StreamingResponse(
        sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

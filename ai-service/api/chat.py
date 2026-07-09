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

import re as _re

_PROGRAM_MARKER_RE = _re.compile(r'\[PROGRAM:([a-z0-9\-]+)\]')
_ACTION_MARKER_RE = _re.compile(r'\[ACTION:([a-z0-9\-]+)\]')


def _could_be_partial_marker(text: str) -> bool:
    """Check if the end of *text* could be the beginning of an
    ``[PROGRAM:...]`` or ``[ACTION:...]`` marker that hasn't finished yet.

    Finds the last ``[`` that is **not** followed by ``]`` and checks
    whether the text from that ``[`` onward is a prefix of
    ``[PROGRAM:`` or ``[ACTION:`` — or already starts with one of those
    (meaning the payload is still growing).

    Returns ``True`` when we should hold the buffer back; ``False`` when
    it is safe to emit.
    """
    last_open = text.rfind('[')
    if last_open < 0:
        return False
    # If a ] appears after the last [, the bracket pair is complete —
    # either it matched a marker (handled by the regex) or it's regular
    # prose (e.g. markdown link).  Either way, not a partial marker.
    if ']' in text[last_open:]:
        return False
    tail = text[last_open:].upper()
    for prefix in ("[PROGRAM:", "[ACTION:"):
        # prefix.startswith(tail) → tail is a partial prefix (e.g. "[PRO")
        # tail.startswith(prefix) → prefix complete, payload growing (e.g. "[PROGRAM:bp")
        # tail == prefix           → prefix complete, no payload yet
        if prefix.startswith(tail) or tail.startswith(prefix):
            return True
    return False


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
        """Generate SSE events from the orchestrator's token stream.

        Tracks whether any prose token has already been flushed to the
        client (`text_flushed`). Once true, the JSON-preamble detector is
        permanently disabled because we're past the start of the response
        and prose has already been delivered — so any further JSON would
        be the LLM transitioning into something else (markers, summary,
        etc.) and stripping it would corrupt the user-facing message.

        This replaces the prior brittle `token_count <= N` guards, which
        would permanently disable JSON detection the moment the LLM
        emitted a few preamble tokens (e.g. a chatty "Baik, ..." intro
        before the JSON block). With those guards active, the regex
        never engaged and the entire JSON block leaked through to the
        frontend. Defense-in-depth still applies: if a malformed JSON
        preamble slips past this filter, the frontend's
        `cleanupStreamedText` is the second-line safety net.
        """
        accumulated = []
        token_count = 0
        stream_start = time.time()
        first_token_time = None
        in_json_block = False
        json_buffer = ""
        brace_count = 0
        text_buffer = ""  # Buffer for detecting inline program markers
        text_flushed = False  # True once any prose has been yielded to the client
        skip_closing_fence = False  # Consume the ``` fence after a plain-JSON close
        
        try:
            logger.info("📡 Starting SSE stream...")
            
            for token in token_stream:
                if first_token_time is None:
                    first_token_time = time.time()
                    ttft = first_token_time - stream_start
                    logger.info(f"   ⚡ First token streamed to client in {ttft:.3f}s")
                
                accumulated.append(token)
                token_count += 1
                
                # Debug: log every token and JSON state
                if token_count <= 10 or token_count % 50 == 0:
                    logger.info(f"   🔢 Token {token_count}: in_json_block={in_json_block}, text_flushed={text_flushed}, token={repr(token[:50])}")
                
                # If we just closed a JSON block via brace-counting, the
                # next token may be the closing ``` fence.  Consume it
                # silently so it never reaches the client.  If the fence
                # shares a chunk with prose, carry the prose forward.
                if skip_closing_fence:
                    skip_closing_fence = False
                    if "```" in token:
                        idx = token.rfind("```")
                        after = token[idx + 3:].lstrip() if idx >= 0 else ""
                        logger.info("   🪟 Consumed closing ``` fence after plain JSON close")
                        if after:
                            text_buffer += after  # APPEND to any text from }} extraction
                            logger.info(f"   📝 Carried forward text after fence: {after[:50]}...")
                        continue  # Always continue — fence consumed, skip text_buffer += token
                    # else: not a fence token, process normally
                
                # Detect JSON block start (either ```json or plain json {)
                # BUT: Only if we haven't already flushed text AND we're not already in a JSON block
                # Once we close the first JSON block and process tokens after it, we should never
                # re-enter JSON filtering mode because any subsequent { or ``` is actual content
                if not in_json_block:
                    # Only attempt JSON detection BEFORE any prose has
                    # been flushed to the client. Once text_flushed is
                    # true, we're past the preamble region of the
                    # response and any further ` { ... } ` is intentional
                    # prose that must NOT be stripped.
                    if not text_flushed:
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
                        elif "json" in token_lower and "{" in token:
                            in_json_block = True
                            json_buffer = token
                            brace_count = token.count("{") - token.count("}")
                            logger.info("   🔒 Detected 'json {' pattern, filtering from stream...")
                            continue
                        # Handle multi-line token with "json\n{\n..." pattern
                        elif "json\n{" in token.lower():
                            in_json_block = True
                            json_buffer = token
                            brace_count = token.count("{") - token.count("}")
                            logger.info("   🔒 Detected 'json\\n{' multi-line pattern, filtering from stream...")
                            continue
                        # Filter standalone "json" word at the very start of response
                        elif token_lower == "json":
                            # LLM is outputting "json" followed by {
                            in_json_block = True
                            json_buffer = token
                            brace_count = 0
                            logger.info("   🔒 Detected 'json' keyword at start, filtering from stream...")
                            continue
                        # Filter "json" variations / whitespace-only "json" tokens
                        elif token_lower in ["json\n", "\njson", "\njson\n", "json ", " json"]:
                            in_json_block = True
                            json_buffer = json_buffer + token if json_buffer else token
                            logger.info("   🔒 Filtering 'json' keyword variation...")
                            continue
                        # Detect { after "json" was filtered (part of json { pattern)
                        elif token.strip().startswith("{") and len(json_buffer) > 0:
                            # This is the { right after "json" was filtered
                            json_buffer += token
                            brace_count = token.count("{") - token.count("}")
                            logger.info("   🔒 Detected { after 'json', continuing filter...")
                            continue
                        # Detect plain { at start (fallback for plain JSON, also schema-drift fallback
                        # for cases where the LLM starts with `{ "primary_intent": ... }` without the
                        # usual `json` keyword preamble)
                        elif token.strip() == "{" and not text_buffer:
                            in_json_block = True
                            json_buffer = token
                            brace_count = 1
                            logger.info("   🔒 Detected plain { at start, filtering from stream...")
                            continue
                
                # If in JSON block, buffer and check for end
                if in_json_block:
                    json_buffer += token
                    brace_count += token.count("{") - token.count("}")
                    logger.info(f"   🔍 In JSON block: buffer_len={len(json_buffer)}, brace_count={brace_count}, token={repr(token[:30])}")
                    
                    # Check if JSON block ended (markdown or plain JSON)
                    if "```" in token and len(json_buffer) > 10:  # Closing ``` after some content
                        in_json_block = False
                        text_flushed = True  # PERMANENTLY disable JSON detection
                        logger.info(f"   ✅ Filtered complete JSON block ({len(json_buffer)} chars)")
                        logger.info(f"   🚫 Permanently disabled JSON detection (text_flushed=True)")
                        # Extract text after the closing ``` fence so prose that
                        # shares a chunk with the closing marker is not lost.
                        idx = token.rfind("```")
                        after = token[idx + 3:] if idx >= 0 else ""
                        after = after.lstrip()
                        if after:
                            text_buffer = after
                            logger.info(f"   📝 Carried forward text after fence: {after[:50]}...")
                        json_buffer = ""
                        brace_count = 0
                        continue  # Token consumed — text_buffer carries any prose after fence
                    elif "{" in json_buffer and brace_count == 0 and len(json_buffer) > 20:
                        # Plain JSON object closed (brace-counting, no ``` fence in this token)
                        in_json_block = False
                        text_flushed = True  # FIX: permanently disable JSON re-detection
                        skip_closing_fence = True  # Next ``` token is the closing fence
                        logger.info(f"   ✅ Filtered complete JSON block ({len(json_buffer)} chars)")
                        logger.info(f"   🚫 Permanently disabled JSON detection (text_flushed=True)")
                        # Extract text after the closing } so prose that shares
                        # a chunk with the brace is not lost.
                        idx = token.rfind("}")
                        if idx >= 0:
                            after = token[idx + 1:]
                            if after.strip():
                                text_buffer = after
                                logger.info(f"   📝 Carried forward text after brace: {after[:50]}...")
                        json_buffer = ""
                        brace_count = 0
                        continue  # Token consumed — skip to closing fence or next prose
                    else:
                        # Still inside JSON block, keep filtering
                        continue
                
                # Add token to text_buffer for inline marker detection
                text_buffer += token
                
                # Check if text_buffer has content that should be emitted
                # We emit immediately unless we're potentially in the middle of a marker
                if text_buffer and not in_json_block:
                    # Check if we might be in the middle of a marker pattern.
                    # If the buffer's tail could be a partial [PROGRAM:...] or
                    # [ACTION:...] marker, hold back until the ] arrives.
                    if _could_be_partial_marker(text_buffer):
                        logger.info(f"   ⏸️  Holding text (potential marker): '{text_buffer[-20:]}'")
                    else:
                        # Safe to emit - check for complete markers first
                        program_match = _PROGRAM_MARKER_RE.search(text_buffer)
                        action_match = _ACTION_MARKER_RE.search(text_buffer)
                        
                        # Process program marker if found
                        if program_match:
                            logger.info(f"   🎯 Program marker found: {program_match.group(0)}")
                            program_id = program_match.group(1)
                            before_marker = text_buffer[:program_match.start()]
                            after_marker = text_buffer[program_match.end():]
                            
                            if before_marker:
                                event = {"type": "token", "data": before_marker}
                                yield f"data: {json.dumps(event)}\n\n"
                                text_flushed = True
                            
                            program_data = None
                            for prog in programs:
                                if prog.get("id") == program_id:
                                    program_data = prog
                                    break
                            
                            logger.info(f"   💡 Detected inline program marker: {program_id}")
                            if program_data:
                                logger.info(f"      ✅ Found program data: {program_data.get('name', 'Unknown')}")
                                inline_event = {
                                    "type": "inline-program",
                                    "program_id": program_id,
                                    "program": program_data
                                }
                            else:
                                logger.info(f"      ⚠️  Program data not found, sending ID only")
                                inline_event = {
                                    "type": "inline-program",
                                    "program_id": program_id
                                }
                            yield f"data: {json.dumps(inline_event)}\n\n"
                            
                            text_buffer = after_marker
                        
                        # Process action marker if found (and no program marker)
                        elif action_match:
                            logger.info(f"   🎯 Action marker found: {action_match.group(0)}")
                            action_type = action_match.group(1)
                            before_marker = text_buffer[:action_match.start()]
                            after_marker = text_buffer[action_match.end():]
                            
                            if before_marker:
                                event = {"type": "token", "data": before_marker}
                                yield f"data: {json.dumps(event)}\n\n"
                                text_flushed = True
                            
                            logger.info(f"   💡 Detected inline action marker: {action_type}")
                            action_event = {
                                "type": "inline-action",
                                "action_type": action_type
                            }
                            yield f"data: {json.dumps(action_event)}\n\n"
                            
                            text_buffer = after_marker
                        
                        else:
                            # No marker found - emit the text immediately
                            logger.info(f"   ➡️  Emitting text (no marker): '{text_buffer[:50]}...'")
                            event = {"type": "token", "data": text_buffer}
                            yield f"data: {json.dumps(event)}\n\n"
                            text_buffer = ""
                            text_flushed = True
            
            # Flush remaining text buffer
            if text_buffer:
                event = {"type": "token", "data": text_buffer}
                yield f"data: {json.dumps(event)}\n\n"
                text_flushed = True

            stream_time = time.time() - stream_start
            logger.info(f"   ✅ Finished streaming {token_count} tokens in {stream_time:.3f}s")

            # Extract intent classification from LLM response
            logger.info("🧠 Extracting intent classification from response...")
            from orchestrator.intent_parser import extract_intent_from_response, apply_intent_to_metadata, filter_programs_by_intent
            
            full_response = "".join(accumulated)
            # Log the raw response for debugging — truncated to avoid
            # blowing up log files on very long generations.
            logger.info(f"   📝 Raw LLM response ({len(full_response)} chars):")
            logger.info(f"      {full_response[:500]}{'...' if len(full_response) > 500 else ''}")
            if len(full_response) > 500:
                logger.info(f"      ... (truncated, {len(full_response) - 500} more chars)")
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

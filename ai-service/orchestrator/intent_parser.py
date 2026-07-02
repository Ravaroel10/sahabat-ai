"""
Intent Parser — Extract intent classification from LLM response

The LLM is instructed to output a JSON block at the start of its response
containing intent classification metadata. This module parses that JSON
and provides it to the orchestrator for decision-making.
"""

import json
import logging
import re
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


def extract_intent_from_response(response_text: str) -> Tuple[Optional[Dict[str, Any]], str]:
    """Extract intent classification JSON from LLM response.
    
    The LLM is instructed to output a JSON code block at the start:
    ```json
    {
      "intent_classification": {
        "primary_intent": "question",
        "confidence": 0.95,
        "show_program_cards": false,
        ...
      }
    }
    ```
    
    Args:
        response_text: The raw LLM response text
        
    Returns:
        Tuple of (intent_dict, cleaned_response_text)
        - intent_dict: Parsed classification or None if not found/invalid
        - cleaned_response_text: Response with JSON block removed
    """
    # Look for JSON code block anywhere in the response (not just at start)
    # Pattern: ```json ... ``` (with flexible whitespace and newlines)
    json_pattern = r'```json\s*\n?(.*?)\n?```'
    match = re.search(json_pattern, response_text, re.DOTALL | re.MULTILINE)
    
    if not match:
        logger.warning("⚠️  No intent classification JSON found in LLM response")
        return None, response_text
    
    json_str = match.group(1).strip()
    
    try:
        intent_data = json.loads(json_str)
        
        # Validate structure
        if "intent_classification" not in intent_data:
            logger.warning("⚠️  JSON found but missing 'intent_classification' key")
            return None, response_text
        
        classification = intent_data["intent_classification"]
        
        # Validate required fields
        required_fields = ["primary_intent", "confidence", "show_program_cards", "show_action_buttons", "show_next_steps"]
        for field in required_fields:
            if field not in classification:
                logger.warning(f"⚠️  Missing required field: {field}")
                return None, response_text
        
        # Remove the JSON block from the response (including any surrounding whitespace)
        cleaned_response = re.sub(r'\s*```json\s*\n?.*?\n?```\s*', '\n', response_text, count=1, flags=re.DOTALL | re.MULTILINE).strip()
        
        # Also remove any wrapping markdown code blocks (```) that aren't JSON
        # Some LLMs wrap the entire response in ```markdown or just ```
        if cleaned_response.startswith('```'):
            # Remove opening ```[language]
            cleaned_response = re.sub(r'^```[a-z]*\s*\n?', '', cleaned_response, flags=re.MULTILINE)
            # Remove closing ```
            cleaned_response = re.sub(r'\n?```\s*$', '', cleaned_response, flags=re.MULTILINE)
            cleaned_response = cleaned_response.strip()
            logger.info("   🔧 Removed markdown code block wrapper from response")
        
        logger.info("✅ Intent classification extracted successfully")
        logger.info(f"   Primary intent: {classification['primary_intent']}")
        logger.info(f"   Confidence: {classification['confidence']}")
        logger.info(f"   Show cards: {classification['show_program_cards']}")
        logger.info(f"   Show actions: {classification['show_action_buttons']}")
        logger.info(f"   Show steps: {classification['show_next_steps']}")
        if "reasoning" in classification:
            logger.info(f"   Reasoning: {classification['reasoning']}")
        
        return classification, cleaned_response
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Failed to parse intent JSON: {e}")
        logger.debug(f"   JSON string: {json_str[:200]}...")
        return None, response_text
    except Exception as e:
        logger.error(f"❌ Error extracting intent: {e}")
        return None, response_text


def apply_intent_to_metadata(
    intent: Optional[Dict[str, Any]],
    programs: list,
    message: str,
) -> Tuple[list, list]:
    """Apply LLM's intent classification to determine actions and next steps.
    
    If intent classification was successful, use LLM's decisions.
    Otherwise, fall back to heuristic-based approach.
    
    Args:
        intent: Parsed intent classification from LLM (or None)
        programs: List of programs extracted from RAG
        message: Original user message
        
    Returns:
        Tuple of (actions, next_steps)
    """
    # FALLBACK: If no intent classification, use heuristic approach
    if intent is None:
        logger.info("⚠️  Using fallback heuristic approach for actions/steps")
        from orchestrator.orchestrator import _generate_actions, _generate_next_steps
        actions = _generate_actions(programs, message)
        next_steps = _generate_next_steps(programs, message)
        return actions, next_steps
    
    # LLM DECISION: Use the AI's classification
    logger.info("🤖 Using LLM's intent classification for actions/steps")
    
    actions = []
    next_steps = []
    message_lower = message.lower()
    
    # Generate actions based on LLM's decision
    if intent.get("show_action_buttons", False):
        # Document request: Direct Auto-Birokrasi
        if intent.get("primary_intent") == "document_request":
            doc_type = 'sktm' if 'sktm' in message_lower else 'surat-permohonan'
            program_id = programs[0]['id'] if programs else 'general'
            
            actions.append({
                "type": "auto-birokrasi",
                "label": "📄 Buat Dokumen Sekarang",
                "href": f"/auto-birokrasi?documents={doc_type}&program={program_id}",
                "description": "Generate dokumen otomatis dengan AI",
                "documentType": doc_type,
                "programId": program_id,
            })
        
        # Application/General help: Full actions
        elif intent.get("primary_intent") in ["application", "general_help"]:
            if programs:
                primary_program = programs[0]
                
                actions.append({
                    "type": "auto-birokrasi",
                    "label": "📄 Siapkan Dokumen Otomatis",
                    "href": f"/auto-birokrasi?documents=sktm,surat-permohonan,kk&program={primary_program['id']}",
                    "description": "Generate dokumen persyaratan secara otomatis",
                    "documentType": "multiple",
                    "programId": primary_program['id'],
                })
                
                actions.append({
                    "type": "marketplace",
                    "label": "📋 Lihat Semua Program",
                    "href": "/marketplace",
                    "description": "Jelajahi program bantuan sosial lainnya",
                })
            else:
                # No programs but LLM wants to show actions
                actions.append({
                    "type": "marketplace",
                    "label": "📋 Jelajahi Program Bantuan",
                    "href": "/marketplace",
                    "description": "Temukan program yang sesuai dengan situasi Anda",
                })
    
    # Generate next steps based on LLM's decision
    if intent.get("show_next_steps", False):
        # For application/general_help: DON'T show generic steps
        # Let the LLM provide specific steps in its response text instead
        # Generic steps like "Datang ke Dinas Sosial" are not helpful
        # Only show steps if they're specific to the user's situation
        
        # If programs exist but steps would be generic, skip them
        if programs and intent.get("primary_intent") in ["application", "general_help"]:
            # Skip generic steps - let the LLM text provide context-specific guidance
            pass
    
    logger.info(f"   Generated actions: {len(actions)}")
    logger.info(f"   Generated next steps: {len(next_steps)}")
    
    return actions, next_steps


def filter_programs_by_intent(
    intent: Optional[Dict[str, Any]],
    programs: list,
) -> list:
    """Filter programs based on LLM's intent classification.
    
    If LLM says not to show program cards, return empty list.
    
    Args:
        intent: Parsed intent classification from LLM
        programs: List of programs extracted from RAG
        
    Returns:
        Filtered list of programs (empty if LLM says don't show)
    """
    if intent is None:
        # No classification: show programs if found
        return programs
    
    if not intent.get("show_program_cards", False):
        logger.info("🤖 LLM decision: Don't show program cards")
        return []
    
    logger.info(f"🤖 LLM decision: Show {len(programs)} program cards")
    return programs

"""
Orchestrator — deterministic routing for chat requests.

Flow:
1. Receive user message
2. Query RAG knowledge base
3. If no RAG context: fall back to official web search
4. Build prompt with context + conversation + user_context
5. Make exactly ONE LLM generation call (streaming)
6. Apply content transformation to output
7. Return answer + citations + sources

This is NOT a multi-agent system. There is one orchestrator, one final LLM call.
"""

import json
import logging
from typing import Any, Dict, Iterator, List, Optional, Tuple

from orchestrator.intent_parser import extract_intent_from_response, apply_intent_to_metadata, filter_programs_by_intent
from tools.rag import search_rag
from tools.official_search import search_official_web
from services.llm import get_llm_service
from prompts.system_prompt import BANTUARAH_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def orchestrate_chat(
    message: str,
    conversation: Optional[List[Dict[str, Any]]] = None,
    user_context: Optional[Dict[str, Any]] = None,
) -> Tuple[Iterator[str], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[str]]:
    """Orchestrate a chat request through the deterministic pipeline.

    Returns:
        Tuple of (token_stream, citations, sources, programs, actions, next_steps).
        - token_stream: iterator yielding LLM output tokens (transformed)
        - citations: list of regulation citation dicts
        - sources: list of web source dicts
        - programs: list of recommended program dicts
        - actions: list of action suggestion dicts
        - next_steps: list of next step strings
    """
    import time
    start_time = time.time()
    
    conversation = conversation or []
    user_context = user_context or {}

    logger.info("=" * 80)
    logger.info("🚀 ORCHESTRATOR: Starting new chat request")
    logger.info(f"📝 Message: {message[:100]}{'...' if len(message) > 100 else ''}")
    logger.info(f"💬 Conversation history: {len(conversation)} messages")
    logger.info(f"👤 User context: {user_context if user_context else 'None'}")
    logger.info("=" * 80)

    # Step 1: RAG retrieval
    logger.info("\n🔍 STEP 1: RAG knowledge base search...")
    rag_start = time.time()
    rag_results = search_rag(message)
    rag_time = time.time() - rag_start
    
    context_text = ""
    citations: List[Dict[str, Any]] = []
    sources: List[Dict[str, Any]] = []
    programs: List[Dict[str, Any]] = []

    if rag_results:
        context_text = _build_rag_context(rag_results)
        citations = _extract_citations(rag_results)
        programs = _extract_programs(rag_results)
        
        logger.info(f"✅ RAG returned {len(rag_results)} results")
        logger.info(f"📚 Citations extracted: {len(citations)}")
        logger.info(f"📋 Programs extracted: {len(programs)}")
        for i, result in enumerate(rag_results[:3], 1):
            score = result.get('score', 0)
            source = result.get('metadata', {}).get('source', 'unknown')
            record_type = result.get('metadata', {}).get('record_type', 'unknown')
            logger.info(f"   Result {i}: score={score:.3f}, source={source}, type={record_type}")
        logger.info(f"⏱️  RAG search took: {rag_time:.3f}s")
    else:
        # Step 2: Fallback to official web search
        logger.info("❌ RAG returned no results")
        logger.info("\n🌐 STEP 2: Falling back to web search (Exa API)...")
        web_start = time.time()
        web_results = search_official_web(message)
        web_time = time.time() - web_start
        
        if web_results:
            context_text = _build_web_context(web_results)
            sources = web_results
            logger.info(f"✅ Web search returned {len(web_results)} results")
            for i, result in enumerate(web_results[:3], 1):
                logger.info(f"   Result {i}: {result['title'][:60]}...")
                logger.info(f"             URL: {result['url']}")
            logger.info(f"⏱️  Web search took: {web_time:.3f}s")
        else:
            logger.warning("⚠️  Web search also returned no results")
            logger.info(f"⏱️  Web search took: {web_time:.3f}s")

    # Step 3: Build context string including conversation and user_context
    logger.info("\n🔧 STEP 3: Building full context...")
    context_start = time.time()
    full_context = _compose_context(
        context_text, conversation, user_context
    )
    context_time = time.time() - context_start
    
    logger.info(f"📄 Context size: {len(full_context)} characters")
    logger.info(f"⏱️  Context building took: {context_time:.3f}s")

    # Step 4: Stream LLM generation (exactly ONE call)
    logger.info("\n🤖 STEP 4: Calling LLM service...")
    logger.info(f"   Model: Will be determined by LLMService")
    logger.info(f"   Context provided: {'Yes' if full_context else 'No'}")
    logger.info(f"   System prompt: {'Yes' if BANTUARAH_SYSTEM_PROMPT else 'No'}")
    
    llm = get_llm_service()
    token_stream = llm.generate_stream(
        prompt=message,
        system_prompt=BANTUARAH_SYSTEM_PROMPT,
        context=full_context,
    )

    # Step 5: Generate action buttons and next steps using fallback (keyword-based for now)
    # The intent-based approach will be handled in the API layer after streaming
    logger.info("\n🎯 STEP 5: Generating actions and next steps (fallback)...")
    actions = _generate_actions(programs, message)
    next_steps = _generate_next_steps(programs, message)
    
    logger.info(f"   Actions generated: {len(actions)}")
    logger.info(f"   Next steps generated: {len(next_steps)}")

    total_time = time.time() - start_time
    logger.info(f"\n⏱️  Total orchestration setup took: {total_time:.3f}s")
    logger.info(f"🎯 Returning:")
    logger.info(f"   - Citations: {len(citations)}")
    logger.info(f"   - Sources: {len(sources)}")
    logger.info(f"   - Programs: {len(programs)}")
    logger.info(f"   - Actions: {len(actions)}")
    logger.info(f"   - Next steps: {len(next_steps)}")
    logger.info("=" * 80)

    return token_stream, citations, sources, programs, actions, next_steps


def orchestrate_chat_non_streaming(
    message: str,
    conversation: Optional[List[Dict[str, Any]]] = None,
    user_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Non-streaming orchestration. Returns the full response dict.

    Note: the post-LLM tone/Indonesian transformation that previously ran
    here was relocated to the frontend (see Bug 1 + Bug 3 fix: src/lib/
    streamed-text-cleanup.ts). The streamed-text cleanup runs on render
    so the response delivered to the user matches the streamed one.
    """
    token_stream, citations, sources, programs, actions, next_steps = orchestrate_chat(
        message, conversation, user_context
    )

    # Consume the stream to get the full text (transformation happens at
    # render time in the frontend, not here).
    answer = "".join(token_stream)

    return {
        "answer": answer,
        "citations": citations,
        "sources": sources,
        "programs": programs,
        "actions": actions,
        "next_steps": next_steps,
    }


def _build_rag_context(rag_results: List[Dict[str, Any]]) -> str:
    """Build context text from RAG retrieval results."""
    parts = []
    for i, result in enumerate(rag_results, 1):
        metadata = result.get("metadata", {})
        source = metadata.get("source", "unknown")
        legal_basis = metadata.get("legal_basis", "")
        text = result.get("text", "")

        parts.append(f"### Dokumen {i}\nSumber: {source}")
        if legal_basis:
            parts.append(f"Dasar Hukum: {legal_basis}")
        parts.append(f"Isi: {text}\n")

    return "\n".join(parts)


def _build_web_context(web_results: List[Dict[str, Any]]) -> str:
    """Build context text from web search results."""
    parts = ["### Hasil Pencarian Web (Sumber Resmi Pemerintah)"]
    for i, result in enumerate(web_results, 1):
        parts.append(f"\n#### {i}. {result['title']}")
        parts.append(f"URL: {result['url']}")
        parts.append(f"Ringkasan: {result['snippet']}\n")

    parts.append(
        "\nCATATAN: Informasi di atas berasal dari pencarian web. "
        "JANGAN sitasi sebagai peraturan resmi. "
        "Gunakan format: 'berdasarkan informasi dari [URL]...'"
    )

    return "\n".join(parts)


def _extract_citations(rag_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract regulation citations from RAG result metadata."""
    citations = []
    seen = set()

    for result in rag_results:
        metadata = result.get("metadata", {})
        legal_basis = metadata.get("legal_basis", "")
        if legal_basis and legal_basis not in seen:
            seen.add(legal_basis)
            citations.append(
                {
                    "regulation": legal_basis,
                    "article": None,
                    "verse": None,
                    "full_citation": legal_basis,
                }
            )

    return citations


def _extract_programs(rag_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract program details from RAG results."""
    programs = []
    seen_ids = set()

    for result in rag_results:
        metadata = result.get("metadata", {})
        
        # Only process program-type records
        if metadata.get("record_type") != "program":
            continue
        
        program_id = metadata.get("record_id", "")
        if program_id in seen_ids:
            continue
        seen_ids.add(program_id)
        
        # Build program object
        program = {
            "id": program_id,
            "name": metadata.get("name", "Program Bantuan"),
            "description": result.get("text", "")[:300],
            "benefits": metadata.get("benefits", "Informasi manfaat tidak tersedia"),
            "regulations": [metadata.get("legal_basis", "")] if metadata.get("legal_basis") else [],
            "eligibility_criteria": [],
        }
        
        programs.append(program)

    return programs


def _generate_actions(
    programs: List[Dict[str, Any]], 
    message: str,
) -> List[Dict[str, Any]]:
    """FALLBACK: Generate action suggestions using keyword heuristics.
    
    This is only used when LLM fails to provide intent classification.
    The primary method is now LLM-based intent classification.
    """
    actions = []
    message_lower = message.lower()
    
    # Check if this is a document request
    document_keywords = ['sktm', 'surat', 'dokumen', 'persyaratan', 'berkas', 'formulir', 'template']
    is_document_request = any(kw in message_lower for kw in document_keywords)
    
    # Check if this is just a question
    question_keywords = ['apa itu', 'bagaimana', 'berapa', 'kapan', 'dimana', 'siapa', 'kenapa', 'apakah']
    is_simple_question = any(message_lower.startswith(kw) for kw in question_keywords)
    
    # Direct Auto-Birokrasi link if asking for documents
    if is_document_request:
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
        return actions
    
    # If simple question, NO ACTIONS
    if is_simple_question and not programs:
        return []
    
    # If programs found, suggest next steps
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
    
    # FALLBACK: marketplace
    if not actions and not is_simple_question:
        actions.append({
            "type": "marketplace",
            "label": "📋 Jelajahi Program Bantuan",
            "href": "/marketplace",
            "description": "Temukan program yang sesuai dengan situasi Anda",
        })
    
    return actions


def _generate_next_steps(
    programs: List[Dict[str, Any]], 
    message: str,
) -> List[str]:
    """FALLBACK: Generate next steps using keyword heuristics.
    
    This is only used when LLM fails to provide intent classification.
    The primary method is now LLM-based intent classification.
    """
    steps = []
    message_lower = message.lower()
    
    # Check if this is just a question
    question_keywords = ['apa itu', 'bagaimana', 'berapa', 'kapan', 'dimana', 'siapa', 'kenapa', 'apakah', 'jelaskan', 'info']
    is_simple_question = any(kw in message_lower for kw in question_keywords)
    
    # If just asking for information, NO STEPS
    if is_simple_question and not programs:
        return []
    
    # PROGRAMS FOUND: Application steps
    if programs:
        steps.append("📄 Gunakan fitur Auto-Birokrasi untuk menyiapkan dokumen (tombol di atas)")
        steps.append("Atau siapkan manual: KTP, Kartu Keluarga (KK), SKTM")
        steps.append("Datang ke Dinas Sosial terdekat dengan dokumen lengkap")
        steps.append("Isi formulir pendaftaran dan serahkan ke petugas")
        steps.append("Tunggu proses verifikasi 7-14 hari kerja")
        return steps
    
    return []


def _compose_context(
    rag_or_web_context: str,
    conversation: List[Dict[str, Any]],
    user_context: Dict[str, Any],
) -> str:
    """Compose the full context string for the LLM prompt."""
    parts = []

    # RAG or web search context
    if rag_or_web_context:
        parts.append(rag_or_web_context)

    # User context (criteria for eligibility tailoring)
    if user_context:
        context_lines = []
        for key, value in user_context.items():
            if value is not None:
                context_lines.append(f"- {key}: {value}")
        if context_lines:
            parts.append(f"### Profil Pengguna\n" + "\n".join(context_lines))

    # Conversation history (last few messages)
    if conversation:
        history_lines = []
        for msg in conversation[-10:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            history_lines.append(f"[{role}]: {content}")
        parts.append("### Riwayat Percakapan\n" + "\n".join(history_lines))

    return "\n\n".join(parts)

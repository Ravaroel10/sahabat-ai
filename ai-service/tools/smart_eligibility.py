"""
Smart eligibility search tool — Hybrid AI approach combining rules, RAG, and LLM.

This tool provides intelligent program matching using three tiers:
1. Rule-based filtering (fast, deterministic)
2. Semantic RAG search (context-aware)
3. LLM reasoning and ranking (personalized explanations)

This is an INTERNAL orchestrator tool. It composes existing tools (eligibility.py, rag.py)
and adds LLM-powered ranking on top.
"""

import logging
from typing import Any, Dict, List, Optional
import json
import time

from tools.eligibility import calculate_eligibility, calculate_all_eligibilities
from tools.rag import search_rag
from services.llm import get_llm_service

logger = logging.getLogger(__name__)


def smart_eligibility_search(
    programs: List[Dict[str, Any]],
    structured_criteria: Dict[str, Any],
    additional_context: Optional[str] = None,
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    """
    Three-tier eligibility search combining rules, RAG, and LLM.
    
    Args:
        programs: List of all available programs to search
        structured_criteria: Structured user criteria (income, age, etc.)
        additional_context: Free-form text describing user situation
        top_k: Maximum number of programs to return
    
    Returns:
        List of program dicts with:
        - program: Original program data
        - eligibility: Eligibility calculation from tier 1
        - semanticScore: Semantic similarity score from tier 2 (if applicable)
        - aiReasoning: LLM-generated explanation from tier 3
        - finalScore: Combined score (0-1) for ranking
        - recommendation: "highly_recommended" | "recommended" | "consider"
    """
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info("🔍 SMART ELIGIBILITY SEARCH: Starting three-tier search")
    logger.info(f"   Total programs: {len(programs)}")
    logger.info(f"   Structured criteria: {structured_criteria}")
    logger.info(f"   Additional context: {additional_context[:100] if additional_context else 'None'}...")
    logger.info(f"   Top K requested: {top_k}")
    logger.info("=" * 80)
    
    # TIER 1: Rule-based filtering (fast path)
    logger.info("\n🎯 TIER 1: Rule-based filtering...")
    tier1_start = time.time()
    
    eligibility_results = calculate_all_eligibilities(programs, structured_criteria)
    
    # Separate by eligibility status
    eligible = [r for r in eligibility_results if r['eligibility']['status'] == 'eligible']
    partial = [r for r in eligibility_results if r['eligibility']['status'] == 'partial']
    ineligible = [r for r in eligibility_results if r['eligibility']['status'] == 'ineligible']
    
    tier1_time = time.time() - tier1_start
    logger.info(f"   ✅ Rule-based filtering completed in {tier1_time:.3f}s")
    logger.info(f"   Results: {len(eligible)} eligible, {len(partial)} partial, {len(ineligible)} ineligible")
    
    # Focus on eligible and partial matches
    candidates = eligible + partial
    
    if not candidates:
        logger.warning("   ⚠️  No eligible or partial matches found!")
        logger.info(f"⏱️  Total search time: {time.time() - start_time:.3f}s")
        logger.info("=" * 80)
        return []
    
    # TIER 2: Semantic RAG search (if additional context provided)
    semantic_scores = {}
    if additional_context and additional_context.strip():
        logger.info("\n🔍 TIER 2: Semantic RAG search...")
        tier2_start = time.time()
        
        try:
            # Build search query combining structured criteria and free-form text
            search_query = _build_search_query(structured_criteria, additional_context)
            logger.info(f"   Search query: {search_query[:150]}...")
            
            # Search RAG knowledge base
            rag_results = search_rag(search_query, k=top_k * 2)
            
            # Extract program IDs and scores from RAG results
            for result in rag_results:
                metadata = result.get('metadata', {})
                if metadata.get('record_type') == 'program':
                    program_id = metadata.get('record_id', '')
                    score = result.get('score', 0)
                    if program_id:
                        # Average scores if program appears multiple times
                        if program_id in semantic_scores:
                            semantic_scores[program_id] = (semantic_scores[program_id] + score) / 2
                        else:
                            semantic_scores[program_id] = score
            
            tier2_time = time.time() - tier2_start
            logger.info(f"   ✅ Semantic search completed in {tier2_time:.3f}s")
            logger.info(f"   Found semantic matches for {len(semantic_scores)} programs")
            
        except Exception as e:
            logger.error(f"   ❌ Semantic search failed: {str(e)}", exc_info=True)
            # Continue without semantic scores (graceful degradation)
    else:
        logger.info("\n⏭️  TIER 2: Skipped (no additional context provided)")
    
    # TIER 3: LLM ranking and reasoning (for top candidates)
    logger.info("\n🧠 TIER 3: LLM ranking and reasoning...")
    tier3_start = time.time()
    
    # Combine rule-based and semantic scores
    enriched_candidates = []
    for result in candidates:
        program = result['program']
        program_id = program.get('id', '')
        
        # Base score from eligibility status
        if result['eligibility']['status'] == 'eligible':
            base_score = 1.0
        elif result['eligibility']['status'] == 'partial':
            # Score based on how much is matched
            matched = len(result['eligibility']['matchedRequirements'])
            missing = len(result['eligibility']['missingInformation'])
            unmatched = len(result['eligibility']['unmatchedRequirements'])
            total = matched + missing + unmatched
            base_score = matched / total if total > 0 else 0.5
        else:
            base_score = 0.0
        
        # Semantic score (if available)
        semantic_score = semantic_scores.get(program_id, 0.0)
        
        # Combined score (weighted average)
        # 70% rule-based, 30% semantic
        combined_score = (base_score * 0.7) + (semantic_score * 0.3)
        
        enriched_candidates.append({
            'program': program,
            'eligibility': result['eligibility'],
            'baseScore': base_score,
            'semanticScore': semantic_score,
            'combinedScore': combined_score,
        })
    
    # Sort by combined score
    enriched_candidates.sort(key=lambda x: x['combinedScore'], reverse=True)
    
    # Take top candidates for LLM reasoning
    top_candidates = enriched_candidates[:top_k]
    
    logger.info(f"   Selected {len(top_candidates)} top candidates for LLM reasoning")
    
    # Generate LLM reasoning for top candidates
    try:
        ranked_programs = _llm_rank_and_explain(
            candidates=top_candidates,
            structured_criteria=structured_criteria,
            additional_context=additional_context,
        )
        
        tier3_time = time.time() - tier3_start
        logger.info(f"   ✅ LLM reasoning completed in {tier3_time:.3f}s")
        
    except Exception as e:
        logger.error(f"   ❌ LLM reasoning failed: {str(e)}", exc_info=True)
        # Fallback: return candidates without LLM reasoning
        ranked_programs = []
        for candidate in top_candidates:
            ranked_programs.append({
                'program': candidate['program'],
                'eligibility': candidate['eligibility'],
                'semanticScore': candidate['semanticScore'],
                'aiReasoning': 'Rekomendasi berdasarkan kecocokan persyaratan program.',
                'finalScore': candidate['combinedScore'],
                'recommendation': _determine_recommendation(candidate['combinedScore']),
            })
        tier3_time = time.time() - tier3_start
        logger.info(f"   ⚠️  Using fallback ranking in {tier3_time:.3f}s")
    
    total_time = time.time() - start_time
    logger.info(f"\n✅ SMART SEARCH COMPLETED")
    logger.info(f"   Total time: {total_time:.3f}s")
    logger.info(f"   Tier 1 (rules): {tier1_time:.3f}s")
    if semantic_scores:
        logger.info(f"   Tier 2 (semantic): {tier2_time:.3f}s")
    logger.info(f"   Tier 3 (LLM): {tier3_time:.3f}s")
    logger.info(f"   Returned: {len(ranked_programs)} programs")
    logger.info("=" * 80)
    
    return ranked_programs


def _build_search_query(
    structured_criteria: Dict[str, Any],
    additional_context: str,
) -> str:
    """Build a rich search query for RAG from structured and unstructured data."""
    query_parts = []
    
    # Add structured criteria as natural language
    if structured_criteria.get('income'):
        query_parts.append(f"penghasilan {structured_criteria['income']} rupiah per bulan")
    
    if structured_criteria.get('familySize'):
        query_parts.append(f"keluarga {structured_criteria['familySize']} orang")
    
    if structured_criteria.get('age'):
        query_parts.append(f"usia {structured_criteria['age']} tahun")
    
    if structured_criteria.get('location'):
        location = structured_criteria['location']
        if location.get('city'):
            query_parts.append(f"tinggal di {location['city']}")
        if location.get('province'):
            query_parts.append(f"provinsi {location['province']}")
    
    if structured_criteria.get('occupation'):
        query_parts.append(f"pekerjaan {structured_criteria['occupation']}")
    
    if structured_criteria.get('hasChildren'):
        if structured_criteria.get('childrenCount'):
            query_parts.append(f"{structured_criteria['childrenCount']} anak")
        else:
            query_parts.append("memiliki anak")
    
    # Combine with additional context
    structured_text = ", ".join(query_parts)
    full_query = f"{structured_text}. {additional_context}" if additional_context else structured_text
    
    return full_query


def _llm_rank_and_explain(
    candidates: List[Dict[str, Any]],
    structured_criteria: Dict[str, Any],
    additional_context: Optional[str],
) -> List[Dict[str, Any]]:
    """Use LLM to generate personalized reasoning for program recommendations."""
    llm = get_llm_service()
    
    # Build prompt for LLM
    prompt = _build_llm_prompt(candidates, structured_criteria, additional_context)
    
    # System prompt for this task
    system_prompt = """Anda adalah konsultan program bantuan sosial yang membantu warga menemukan program yang tepat.

Tugas Anda:
1. Analisis kecocokan setiap program dengan kondisi pengguna
2. Berikan penjelasan singkat (2-3 kalimat) mengapa program ini cocok atau tidak
3. Rekomendasikan prioritas: "highly_recommended", "recommended", atau "consider"

Format output harus JSON array dengan struktur:
[
  {
    "program_id": "pkh",
    "reasoning": "Program ini sangat cocok karena...",
    "recommendation": "highly_recommended",
    "final_score": 0.95
  },
  ...
]

Pastikan reasoning dalam Bahasa Indonesia yang jelas dan membantu."""
    
    # Get LLM response (non-streaming)
    response = llm.generate(
        prompt=prompt,
        system_prompt=system_prompt,
        temperature=0.3,  # Lower temperature for more consistent output
    )
    
    # Parse LLM response
    try:
        # Try to extract JSON from response
        response_text = response.strip()
        
        # Handle markdown code blocks
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        
        # Handle plain JSON with "json" prefix
        if response_text.lower().startswith("json"):
            response_text = response_text[4:].strip()
        
        llm_rankings = json.loads(response_text)
        
        # Map LLM output to candidates
        result = []
        for candidate in candidates:
            program_id = candidate['program'].get('id', '')
            
            # Find LLM ranking for this program
            llm_data = next(
                (r for r in llm_rankings if r.get('program_id') == program_id),
                None
            )
            
            if llm_data:
                result.append({
                    'program': candidate['program'],
                    'eligibility': candidate['eligibility'],
                    'semanticScore': candidate['semanticScore'],
                    'aiReasoning': llm_data.get('reasoning', 'Program ini relevan dengan kondisi Anda.'),
                    'finalScore': llm_data.get('final_score', candidate['combinedScore']),
                    'recommendation': llm_data.get('recommendation', 'recommended'),
                })
            else:
                # Fallback if LLM didn't include this program
                result.append({
                    'program': candidate['program'],
                    'eligibility': candidate['eligibility'],
                    'semanticScore': candidate['semanticScore'],
                    'aiReasoning': 'Program ini sesuai dengan beberapa kriteria Anda.',
                    'finalScore': candidate['combinedScore'],
                    'recommendation': _determine_recommendation(candidate['combinedScore']),
                })
        
        # Sort by final score
        result.sort(key=lambda x: x['finalScore'], reverse=True)
        
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {str(e)}")
        logger.error(f"LLM response: {response[:500]}...")
        raise
    except Exception as e:
        logger.error(f"Error processing LLM rankings: {str(e)}", exc_info=True)
        raise


def _build_llm_prompt(
    candidates: List[Dict[str, Any]],
    structured_criteria: Dict[str, Any],
    additional_context: Optional[str],
) -> str:
    """Build a structured prompt for LLM ranking."""
    prompt_parts = []
    
    # User profile
    prompt_parts.append("=== PROFIL PENGGUNA ===")
    
    if structured_criteria.get('income'):
        prompt_parts.append(f"Penghasilan: Rp {structured_criteria['income']:,}/bulan")
    
    if structured_criteria.get('familySize'):
        prompt_parts.append(f"Jumlah anggota keluarga: {structured_criteria['familySize']} orang")
    
    if structured_criteria.get('age'):
        prompt_parts.append(f"Usia: {structured_criteria['age']} tahun")
    
    if structured_criteria.get('location'):
        loc = structured_criteria['location']
        location_str = f"{loc.get('city', '')}, {loc.get('province', '')}".strip(', ')
        if location_str:
            prompt_parts.append(f"Lokasi: {location_str}")
    
    if structured_criteria.get('occupation'):
        prompt_parts.append(f"Pekerjaan: {structured_criteria['occupation']}")
    
    if structured_criteria.get('hasChildren'):
        if structured_criteria.get('childrenCount'):
            prompt_parts.append(f"Jumlah anak: {structured_criteria['childrenCount']}")
        else:
            prompt_parts.append("Memiliki anak: Ya")
    
    if additional_context:
        prompt_parts.append(f"\nKondisi tambahan: {additional_context}")
    
    # Programs
    prompt_parts.append("\n=== PROGRAM YANG AKAN DIANALISIS ===")
    
    for i, candidate in enumerate(candidates, 1):
        program = candidate['program']
        eligibility = candidate['eligibility']
        
        prompt_parts.append(f"\n{i}. {program.get('name', 'Unknown Program')} (ID: {program.get('id', '')})")
        prompt_parts.append(f"   Deskripsi: {program.get('description', 'Tidak ada deskripsi')[:200]}")
        prompt_parts.append(f"   Manfaat: {program.get('benefits', 'Tidak ada informasi')[:150]}")
        prompt_parts.append(f"   Status kelayakan: {eligibility['status']}")
        
        if eligibility['matchedRequirements']:
            prompt_parts.append(f"   ✓ Cocok: {', '.join(eligibility['matchedRequirements'][:3])}")
        
        if eligibility['missingInformation']:
            prompt_parts.append(f"   ? Perlu info: {', '.join(eligibility['missingInformation'][:2])}")
        
        if eligibility['unmatchedRequirements']:
            prompt_parts.append(f"   ✗ Tidak cocok: {', '.join(eligibility['unmatchedRequirements'][:2])}")
        
        prompt_parts.append(f"   Skor awal: {candidate['combinedScore']:.2f}")
    
    prompt_parts.append("\n=== TUGAS ===")
    prompt_parts.append("Analisis setiap program dan berikan output dalam format JSON array.")
    
    return "\n".join(prompt_parts)


def _determine_recommendation(score: float) -> str:
    """Determine recommendation level based on score."""
    if score >= 0.8:
        return "highly_recommended"
    elif score >= 0.5:
        return "recommended"
    else:
        return "consider"

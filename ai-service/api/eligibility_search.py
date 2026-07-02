"""
Eligibility Search API route — POST /eligibility-search endpoint.

Provides smart program matching using hybrid AI approach (rules + RAG + LLM).
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from tools.smart_eligibility import smart_eligibility_search

logger = logging.getLogger(__name__)

router = APIRouter()


class LocationInput(BaseModel):
    """User location input."""
    province: Optional[str] = None
    city: Optional[str] = None


class EligibilityCriteria(BaseModel):
    """Structured eligibility criteria from user input."""
    income: Optional[int] = Field(None, description="Monthly income in IDR")
    familySize: Optional[int] = Field(None, description="Number of family members")
    age: Optional[int] = Field(None, description="User age")
    location: Optional[LocationInput] = None
    occupation: Optional[str] = None
    hasChildren: Optional[bool] = None
    childrenCount: Optional[int] = None
    hasDisability: Optional[bool] = None
    isPregnant: Optional[bool] = None


class EligibilitySearchRequest(BaseModel):
    """Request body for eligibility search."""
    criteria: EligibilityCriteria = Field(..., description="Structured user criteria")
    additionalInfo: Optional[str] = Field(None, description="Free-form additional context")
    programs: List[Dict[str, Any]] = Field(..., description="List of programs to search")
    topK: int = Field(10, description="Maximum number of results to return", ge=1, le=50)


class EligibilitySearchResponse(BaseModel):
    """Response body for eligibility search."""
    programs: List[Dict[str, Any]]
    searchMetadata: Dict[str, Any]


@router.post("/eligibility-search", response_model=EligibilitySearchResponse)
async def eligibility_search(request: EligibilitySearchRequest):
    """
    Smart eligibility search using hybrid AI approach.
    
    This endpoint combines three tiers of matching:
    1. Rule-based filtering (fast, deterministic)
    2. Semantic RAG search (context-aware)
    3. LLM ranking and reasoning (personalized explanations)
    
    Returns ranked programs with eligibility status, match scores, and AI reasoning.
    """
    request_id = f"{int(time.time() * 1000)}"
    start_time = time.time()
    
    logger.info("\n" + "=" * 80)
    logger.info(f"🔍 API: New eligibility search request (ID: {request_id})")
    logger.info(f"   Criteria: {request.criteria.dict(exclude_none=True)}")
    logger.info(f"   Additional info: {request.additionalInfo[:100] if request.additionalInfo else 'None'}...")
    logger.info(f"   Programs to search: {len(request.programs)}")
    logger.info(f"   Top K: {request.topK}")
    logger.info("=" * 80)
    
    try:
        # Convert Pydantic models to dicts
        criteria_dict = request.criteria.dict(exclude_none=True)
        
        # Convert location if present
        if 'location' in criteria_dict and criteria_dict['location']:
            criteria_dict['location'] = {
                'province': criteria_dict['location'].get('province'),
                'city': criteria_dict['location'].get('city'),
            }
        
        logger.info("🚀 Calling smart eligibility search...")
        search_start = time.time()
        
        # Call smart search tool
        results = smart_eligibility_search(
            programs=request.programs,
            structured_criteria=criteria_dict,
            additional_context=request.additionalInfo,
            top_k=request.topK,
        )
        
        search_time = time.time() - search_start
        logger.info(f"✅ Smart search completed in {search_time:.3f}s")
        logger.info(f"   Returned: {len(results)} programs")
        
        # Build response
        total_time = time.time() - start_time
        
        response = {
            "programs": results,
            "searchMetadata": {
                "totalScanned": len(request.programs),
                "resultsReturned": len(results),
                "processingTimeMs": int(total_time * 1000),
                "searchTiers": {
                    "ruleBased": True,
                    "semantic": bool(request.additionalInfo),
                    "llmRanking": len(results) > 0,
                },
                "timestamp": int(time.time()),
            }
        }
        
        logger.info(f"\n✅ REQUEST COMPLETED (ID: {request_id})")
        logger.info(f"   Total time: {total_time:.3f}s")
        logger.info(f"   Results: {len(results)} programs")
        logger.info("=" * 80 + "\n")
        
        return response
        
    except Exception as e:
        elapsed = time.time() - start_time
        logger.error(f"❌ Search error after {elapsed:.3f}s: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Terjadi kesalahan saat mencari program: {str(e)}",
        )

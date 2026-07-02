"""
Pydantic schemas for the chat API.

Defines the request and response models for POST /chat, plus
citation and source types used in the orchestrator response.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Citation(BaseModel):
    """A regulation citation from the RAG knowledge base."""
    regulation: str = Field(..., description="e.g. 'Permensos No. 1/2024'")
    article: Optional[str] = Field(None, description="e.g. 'Pasal 5'")
    verse: Optional[str] = Field(None, description="e.g. 'Ayat 2'")
    full_citation: str = Field(..., description="e.g. 'Permensos No. 1/2024, Pasal 5, Ayat 2'")


class WebSource(BaseModel):
    """A web search result used as context (fallback path)."""
    title: str
    url: str
    snippet: str = ""


class ChatMessage(BaseModel):
    """A single message in the conversation history."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    """Request body for POST /chat."""
    message: str = Field(..., description="The user's current message")
    conversation: List[ChatMessage] = Field(
        default_factory=list,
        description="Prior conversation messages for context",
    )
    user_context: Optional[Dict[str, Any]] = Field(
        None,
        description="User criteria (income, family size, location, etc.)",
    )


class ChatResponse(BaseModel):
    """Response body for POST /chat (non-streaming mode)."""
    answer: str
    citations: List[Citation] = Field(default_factory=list)
    sources: List[WebSource] = Field(default_factory=list)
    emergency: bool = False


# Note: SSE events are serialized with json.dumps() in api/chat.py, not via a
# Pydantic model, because the event payload shape varies by type (token vs
# metadata vs done vs error). The schemas above (Citation, WebSource, ChatRequest,
# ChatResponse) are the ones used for validation.

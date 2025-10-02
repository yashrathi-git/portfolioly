"""Pydantic schemas for chat data models."""

import uuid
from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    """Tool call for rendering portfolio widgets."""

    type: Literal["widget_render"] = "widget_render"
    widget: Literal["about", "projects", "skills", "contact", "experience", "education"]
    indices: Optional[List[int]] = Field(
        None, description="Zero-based indices of specific items to show"
    )
    explanation: Optional[str] = Field(None, description="Optional explanation text")


class ChatMessage(BaseModel):
    """Individual chat message in a conversation."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    tool_calls: Optional[List[ToolCall]] = None


class ChatConversation(BaseModel):
    """Complete conversation thread."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str  # Portfolio username being viewed
    messages: List[ChatMessage]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: str
    user_id: Optional[str] = None  # Firebase UID if authenticated


class ChatRequest(BaseModel):
    """Request payload for chat endpoint."""

    message: str = Field(..., min_length=1, max_length=500)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response payload from chat endpoint."""

    content: str  # Text response from LLM
    tool_calls: Optional[List[ToolCall]] = None
    conversation_id: str

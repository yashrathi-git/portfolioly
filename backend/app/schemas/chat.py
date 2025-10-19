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
    content: str  # Raw content including <<<WIDGET:...>>> delimiters
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatConversation(BaseModel):
    """Complete conversation thread."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str  # Portfolio username being viewed
    messages: List[ChatMessage]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: str
    user_id: Optional[str] = None  # Firebase UID if authenticated


class ChatRequestMessage(BaseModel):
    """Individual message in chat request from Vercel AI SDK."""

    role: Literal["user", "assistant", "system"]
    content: str
    id: Optional[str] = None


class ChatRequest(BaseModel):
    """Request payload for chat endpoint (Vercel AI SDK format)."""

    messages: List[ChatRequestMessage] = Field(
        ..., description="Array of messages from AI SDK"
    )
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    id: Optional[str] = None  # Chat ID from AI SDK

    class Config:
        populate_by_name = True  # Allow both conversation_id and conversationId


class ChatResponse(BaseModel):
    """Response payload from chat endpoint."""

    content: str  # Text response from LLM including widget delimiters
    conversation_id: str

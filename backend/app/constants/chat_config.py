"""Configuration constants for AI-powered portfolio chat."""

from typing import Literal


class ChatConfig:
    """Configuration constants for AI-powered portfolio chat."""

    # Rate limiting
    IP_REQUESTS_PER_HOUR = 50  # Per-IP limit across all portfolios (can be generous)
    PORTFOLIO_MESSAGES_PER_MONTH = 60  # Per portfolio owner for pricing
    RATE_LIMIT_WINDOW_SECONDS = 3600  # 1 hour

    # Input validation
    MAX_USER_INPUT_CHARS = 280  # ~70 tokens with a buffer
    MAX_SYSTEM_PROMPT_CHARS = 10000  # ~2500 tokens
    MAX_TOOL_ARGUMENT_CHARS = 4000

    # AI processing
    CHAT_MODEL_NAME = "gpt-5-mini"  # Azure AI model
    PROCESSOR_MODEL_NAME = "gpt-5-mini"  # Default model for AIProcessor
    MAX_CONVERSATION_HISTORY = 5  # Number of previous messages to include
    MAX_RESPONSE_TOKENS = 500  # Keep token limit to control Azure response size

    # Storage
    CHAT_COLLECTION_NAME = "portfolio_chats"
    CONVERSATION_TTL_DAYS = 30

    # Access control
    DEFAULT_CHAT_ACCESS: Literal["public", "private"] = (
        "public"  # Default if not set in user settings
    )

    # Tool calling
    SUPPORTED_WIDGETS = [
        "about",
        "projects",
        "skills",
        "contact",
        "experience",
        "education",
    ]

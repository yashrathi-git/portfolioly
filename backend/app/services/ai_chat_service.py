"""
AI chat service for portfolio conversations with streaming support.

This service handles LLM integration with widget marker parsing for portfolio widget rendering,
conversation context management, and streaming responses.
"""

import json
import logging
from typing import Optional, List, Dict, Any, AsyncGenerator

from azure.ai.inference.aio import ChatCompletionsClient
from azure.ai.inference.models import (
    SystemMessage,
    UserMessage,
    AssistantMessage,
)
from azure.core.credentials import AzureKeyCredential

from ..core.config import settings
from ..schemas.chat import ToolCall, ChatMessage
from ..schemas.portfolio import PortfolioData
from ..constants.chat_config import ChatConfig
from .chat_prompt_builder import build_system_prompt

logger = logging.getLogger(__name__)


class AIChatError(Exception):
    """Custom exception for AI chat operations."""

    pass


class AIChatService:
    """
    AI chat service for portfolio conversations.

    Handles LLM integration with widget marker parsing, conversation context,
    and streaming responses for real-time user experience.
    """

    # Token counting configuration (reused from AIProcessor)
    MODEL_ENCODING = "cl100k_base"

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        model_name: str = ChatConfig.CHAT_MODEL_NAME,
    ):
        """
        Initialize the AI chat service.

        Args:
            endpoint: Azure AI endpoint URL
            api_key: Azure AI API key
            model_name: Model name to use
        """
        self.endpoint = endpoint or settings.azure_ai_endpoint
        self.api_key = api_key or settings.azure_ai_api_key
        self.model_name = model_name

        # Initialize Azure AI client lazily for async usage
        if self.endpoint and self.api_key:
            self.client = ChatCompletionsClient(
                endpoint=self.endpoint,
                credential=AzureKeyCredential(self.api_key),
            )
        else:
            logger.warning("Azure AI credentials not provided, client not initialized")
            self.client = None

    async def close(self):
        """Close the Azure AI client connection."""
        if self.client:
            await self.client.close()
            self.client = None

    def _prepare_conversation_messages(
        self,
        system_prompt: str,
        conversation_history: List[ChatMessage],
        user_message: str,
    ) -> List[Any]:
        """
        Prepare messages for LLM API call.

        Args:
            system_prompt: System prompt with portfolio context
            conversation_history: Previous messages (last N messages)
            user_message: Current user message

        Returns:
            List of message objects for Azure AI
        """
        messages = [SystemMessage(content=system_prompt)]

        # Add conversation history (last N messages)
        for msg in conversation_history[-ChatConfig.MAX_CONVERSATION_HISTORY :]:
            if msg.role == "user":
                messages.append(UserMessage(content=msg.content))
            elif msg.role == "assistant":
                # Include tool calls if present
                if msg.tool_calls:
                    # Convert tool calls to Azure AI format
                    tool_calls_data = [
                        {
                            "id": f"call_{i}",
                            "type": "function",
                            "function": {
                                "name": "render_portfolio_widget",
                                "arguments": json.dumps(
                                    {
                                        "widget": tc.widget,
                                        "indices": tc.indices,
                                        "explanation": tc.explanation,
                                    }
                                ),
                            },
                        }
                        for i, tc in enumerate(msg.tool_calls)
                    ]
                    messages.append(
                        AssistantMessage(
                            content=msg.content or "", tool_calls=tool_calls_data
                        )
                    )
                else:
                    messages.append(AssistantMessage(content=msg.content))

        # Add current user message
        messages.append(UserMessage(content=user_message))

        return messages

    async def process_chat_streaming(
        self,
        user_message: str,
        portfolio_data: PortfolioData,
        conversation_history: List[ChatMessage],
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process chat message with streaming response.

        Yields chunks of the response as they arrive from the LLM.

        Args:
            user_message: User's message
            portfolio_data: Portfolio data for context
            conversation_history: Previous messages

        Yields:
            Dict with 'type' and data:
            - {'type': 'content', 'data': str} for text chunks
            - {'type': 'tool_call', 'data': ToolCall} for tool calls
            - {'type': 'done', 'data': None} when complete
            - {'type': 'error', 'data': str} on error
        """
        if not self.client:
            yield {"type": "error", "data": "AI client not initialized"}
            return

        try:
            # Create system prompt with portfolio context
            system_prompt = build_system_prompt(portfolio_data)

            # Prepare messages
            messages = self._prepare_conversation_messages(
                system_prompt, conversation_history, user_message
            )

            # Make streaming API call WITHOUT tool support (simpler, more reliable)
            content_buffer = ""

            # Don't use async with since client is managed at instance level
            response = await self.client.complete(
                model=self.model_name,
                messages=messages,
                stream=True,
                max_tokens=ChatConfig.MAX_RESPONSE_TOKENS,
            )

            async for update in response:
                if not update.choices:
                    continue

                delta = update.choices[0].delta

                if delta.content:
                    content_buffer += delta.content
                    yield {"type": "content", "data": delta.content}

            # Parse widget markers from accumulated content
            import re

            widget_pattern = r"\[WIDGET:(\w+)(?::([0-9,]+))?\]"
            matches = re.finditer(widget_pattern, content_buffer)

            for match in matches:
                widget_name = match.group(1)
                indices_str = match.group(2)

                # Parse indices if provided
                indices = None
                if indices_str:
                    try:
                        indices = [int(i.strip()) for i in indices_str.split(",")]
                    except ValueError:
                        pass

                # Create tool call from marker
                if widget_name in ChatConfig.SUPPORTED_WIDGETS:
                    tool_call = ToolCall(
                        widget=widget_name,
                        indices=indices,
                        explanation=None,
                    )
                    yield {"type": "tool_call", "data": tool_call}

            # Signal completion
            yield {"type": "done", "data": None}

        except Exception as e:
            logger.error(f"Chat processing failed: {str(e)}")
            yield {"type": "error", "data": f"Chat processing failed: {str(e)}"}


# Global service instance
_ai_chat_service: Optional[AIChatService] = None


def get_ai_chat_service() -> AIChatService:
    """Get or create the global AI chat service instance."""
    global _ai_chat_service
    if _ai_chat_service is None:
        _ai_chat_service = AIChatService()
    return _ai_chat_service

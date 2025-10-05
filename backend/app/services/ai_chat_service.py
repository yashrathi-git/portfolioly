"""
AI chat service for portfolio conversations with streaming support.

This service handles LLM integration with command delimiter parsing for portfolio widget rendering,
conversation context management, and streaming responses.
"""

import logging
import re
from typing import Optional, List, Dict, Any, AsyncGenerator

from openai import AsyncAzureOpenAI, AsyncOpenAI

from ..core.config import settings
from ..schemas.chat import ChatMessage
from ..schemas.portfolio import PortfolioData
from ..constants.chat_config import ChatConfig
from ..constants.chat_delimiters import ChatDelimiters
from .chat_prompt_builder import build_system_prompt

logger = logging.getLogger(__name__)


class AIChatError(Exception):
    """Custom exception for AI chat operations."""

    pass


class AIChatService:
    """
    AI chat service for portfolio conversations.

    Handles LLM integration with command delimiter parsing, conversation context,
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

        # Initialize OpenAI client with Azure configuration
        if self.endpoint and self.api_key:
            self.client = AsyncOpenAI(
                base_url=self.endpoint,
                api_key=self.api_key,
                # api_version="2024-02-01",  # Use stable API version
            )
        else:
            logger.warning("Azure AI credentials not provided, client not initialized")
            self.client = None

    async def close(self):
        """Close the OpenAI client connection."""
        if self.client:
            await self.client.close()
            self.client = None

    def _prepare_conversation_messages(
        self,
        system_prompt: str,
        conversation_history: List[ChatMessage],
        user_message: str,
    ) -> List[Dict[str, str]]:
        """
        Prepare messages for LLM API call in OpenAI format.

        Args:
            system_prompt: System prompt with portfolio context
            conversation_history: Previous messages (last N messages)
            user_message: Current user message

        Returns:
            List of message dictionaries for OpenAI API
        """
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (last N messages)
        for msg in conversation_history[-ChatConfig.MAX_CONVERSATION_HISTORY :]:
            if msg.role == "user":
                messages.append({"role": "user", "content": msg.content})
            elif msg.role == "assistant":
                # For assistant messages, just include the text content
                # Tool calls are represented as delimiters in the content
                messages.append({"role": "assistant", "content": msg.content or ""})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        return messages

    async def process_chat_streaming(
        self,
        user_message: str,
        portfolio_data: PortfolioData,
        conversation_history: List[ChatMessage],
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process chat message with streaming response using OpenAI library.

        Yields chunks of the response as they arrive from the LLM.
        Parses command delimiters (<<<WIDGET:...>>>, <<<MSG_BREAK>>>) and emits them as 'cmd' events.

        Args:
            user_message: User's message
            portfolio_data: Portfolio data for context
            conversation_history: Previous messages

        Yields:
            Dict with 'type' and data:
            - {'type': 'content', 'data': str} for text chunks
            - {'type': 'cmd', 'data': str} for command delimiters
            - {'type': 'done', 'data': None} when complete
            - {'type': 'error', 'data': str} on error
        """
        if not self.client:
            logger.error("AI client not initialized")
            yield {"type": "error", "data": "AI client not initialized"}
            return

        try:
            # Create system prompt with portfolio context
            system_prompt = build_system_prompt(portfolio_data)

            # Prepare messages in OpenAI format
            messages = self._prepare_conversation_messages(
                system_prompt, conversation_history, user_message
            )

            # Command pattern: <<<WIDGET:name>>> or <<<WIDGET:name:0,1>>> or <<<MSG_BREAK>>>
            cmd_pattern = re.compile(r"<<<(WIDGET:\w+(?::[0-9,]+)?|MSG_BREAK)>>>")

            pending_text = ""

            # Make streaming API call using OpenAI library
            logger.info(
                f"Starting OpenAI streaming request with model: {self.model_name}"
            )
            print(self.model_name)
            print(self.endpoint)
            print(messages)
            print(ChatConfig.MAX_RESPONSE_TOKENS)
            print(0.7)
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                stream=True,
                max_tokens=ChatConfig.MAX_RESPONSE_TOKENS,
                temperature=0.7,
            )

            async for chunk in stream:
                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta

                # Get content from delta
                if delta.content:
                    pending_text += delta.content

                    # Check for complete commands in pending text
                    while True:
                        match = cmd_pattern.search(pending_text)
                        if not match:
                            break

                        # Emit text before the command
                        text_before = pending_text[: match.start()]
                        if text_before:
                            logger.debug(f"Emitting content: {text_before[:50]}...")
                            yield {
                                "type": ChatDelimiters.EVENT_CONTENT,
                                "data": text_before,
                            }

                        # Emit the command
                        command = match.group(1)
                        logger.debug(f"Emitting command: {command}")
                        yield {"type": ChatDelimiters.EVENT_CMD, "data": command}

                        # Keep text after the command
                        pending_text = pending_text[match.end() :]

                    # Emit text chunk if no delimiter found (for real-time streaming)
                    # Only emit if we have accumulated enough text or if it's a complete word
                    if not match and len(pending_text) > 0:
                        # Look for word boundaries to avoid cutting words in half
                        last_space = pending_text.rfind(" ")
                        if last_space > 0:
                            text_to_emit = pending_text[: last_space + 1]
                            logger.debug(
                                f"Emitting partial content: {text_to_emit[:50]}..."
                            )
                            yield {
                                "type": ChatDelimiters.EVENT_CONTENT,
                                "data": text_to_emit,
                            }
                            pending_text = pending_text[last_space + 1 :]

            # Emit any remaining text
            if pending_text:
                logger.debug(f"Emitting final content: {pending_text[:50]}...")
                yield {"type": ChatDelimiters.EVENT_CONTENT, "data": pending_text}

            # Signal completion
            logger.info("Streaming completed successfully")
            yield {"type": ChatDelimiters.EVENT_DONE, "data": None}

        except Exception as e:
            logger.error(f"Chat processing failed: {str(e)}", exc_info=True)
            yield {
                "type": ChatDelimiters.EVENT_ERROR,
                "data": f"Chat processing failed: {str(e)}",
            }


# Global service instance
_ai_chat_service: Optional[AIChatService] = None


def get_ai_chat_service() -> AIChatService:
    """Get or create the global AI chat service instance."""
    global _ai_chat_service
    if _ai_chat_service is None:
        _ai_chat_service = AIChatService()
    return _ai_chat_service

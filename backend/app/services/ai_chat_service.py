"""
AI chat service for portfolio conversations with streaming support.

This service handles LLM integration with tool calling for portfolio widget rendering,
conversation context management, and streaming responses.
"""

import json
import logging
from typing import Optional, List, Dict, Any, AsyncGenerator
from datetime import datetime

import tiktoken
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import (
    SystemMessage,
    UserMessage,
    AssistantMessage,
    ChatCompletionsToolDefinition,
    FunctionDefinition,
)
from azure.core.credentials import AzureKeyCredential

from ..core.config import settings
from ..schemas.chat import ToolCall, ChatMessage
from ..schemas.portfolio import PortfolioData
from ..constants.chat_config import ChatConfig

logger = logging.getLogger(__name__)


class AIChatError(Exception):
    """Custom exception for AI chat operations."""

    pass


class AIChatService:
    """
    AI chat service for portfolio conversations.

    Handles LLM integration with tool calling, conversation context,
    and streaming responses for real-time user experience.
    """

    # Token counting configuration (reused from AIProcessor)
    MODEL_ENCODING = "cl100k_base"

    # Tool definition for widget rendering
    WIDGET_RENDER_TOOL = ChatCompletionsToolDefinition(
        function=FunctionDefinition(
            name="render_portfolio_widget",
            description=(
                "Render a specific portfolio widget to show relevant information. "
                "Use this when the user asks about specific aspects of the portfolio "
                "(projects, experience, education, skills, contact info, or about section)."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "widget": {
                        "type": "string",
                        "enum": ChatConfig.SUPPORTED_WIDGETS,
                        "description": "Type of widget to render",
                    },
                    "indices": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": (
                            "Optional zero-based indices of specific items to show. "
                            "For example, [0, 2] would show the first and third items. "
                            "Omit to show all items."
                        ),
                    },
                    "explanation": {
                        "type": "string",
                        "description": (
                            "Optional brief explanation of why this widget is relevant "
                            "to the user's question"
                        ),
                    },
                },
                "required": ["widget"],
            },
        )
    )

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

        # Initialize tiktoken encoder
        try:
            self.encoder = tiktoken.get_encoding(self.MODEL_ENCODING)
        except Exception as e:
            logger.warning(f"Failed to load tiktoken encoder: {e}, using fallback")
            self.encoder = None

        # Initialize Azure AI client
        if self.endpoint and self.api_key:
            self.client = ChatCompletionsClient(
                endpoint=self.endpoint, credential=AzureKeyCredential(self.api_key)
            )
        else:
            logger.warning("Azure AI credentials not provided, client not initialized")
            self.client = None

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text using tiktoken.

        Args:
            text: Text to count tokens for

        Returns:
            int: Number of tokens
        """
        if self.encoder:
            return len(self.encoder.encode(text))
        else:
            # Fallback: approximate 1 token = 4 characters
            return len(text) // 4

    def _create_system_prompt(self, portfolio_data: PortfolioData) -> str:
        """
        Create system prompt with portfolio context.

        Args:
            portfolio_data: Portfolio data to include in context

        Returns:
            str: System prompt
        """
        # Extract key information from portfolio
        personal_info = portfolio_data.personal_info
        name = personal_info.full_name if personal_info else "the portfolio owner"

        # Build portfolio summary
        portfolio_summary = self._build_portfolio_summary(portfolio_data)

        system_prompt = f"""You are an AI assistant for {name}'s portfolio website. Your role is to help visitors learn about {name}'s professional background, skills, and projects in a warm, engaging, and professional manner.

## Portfolio Context
{portfolio_summary}

## Guidelines
- Focus conversations on {name}'s work, skills, projects, and professional background
- Be warm, professional, and engaging in your responses
- Keep responses concise (under 150 words) unless more detail is specifically requested
- Use the render_portfolio_widget tool to show relevant portfolio sections when appropriate
- For questions about specific projects, experience, or skills, call the appropriate widget tool
- For general questions about {name}, provide a brief answer and offer to show more details

## Handling Different Question Types
- **Specific questions** (e.g., "What projects has {name} worked on?"): Call the appropriate widget tool and provide brief context
- **General questions** (e.g., "Tell me about {name}"): Provide a brief overview and offer to show specific sections
- **Off-topic questions**: Politely redirect to {name}'s professional background. Example: "I'm here to help you learn about {name}'s professional work. Would you like to know about their projects or experience?"

## Tool Usage
- Use render_portfolio_widget when users ask about specific portfolio sections
- You can call multiple widgets in one response if relevant
- Always provide text context along with widget calls
- Use the indices parameter to show specific items when the user asks about particular projects/experiences

Remember: Your goal is to help visitors understand {name}'s professional capabilities and background in an engaging way."""

        return system_prompt

    def _build_portfolio_summary(self, portfolio_data: PortfolioData) -> str:
        """
        Build a comprehensive portfolio summary for the system prompt.

        Includes all relevant details so the LLM can answer specific questions
        about projects, skills, experience, etc.

        Args:
            portfolio_data: Portfolio data

        Returns:
            str: Detailed portfolio summary
        """
        summary_parts = []

        # Personal info
        if portfolio_data.personal_info:
            info = portfolio_data.personal_info
            personal_details = []
            if info.full_name:
                personal_details.append(f"Name: {info.full_name}")
            if info.title:
                personal_details.append(f"Title: {info.title}")
            if info.email:
                personal_details.append(f"Email: {info.email}")
            if info.phone:
                personal_details.append(f"Phone: {info.phone}")
            if info.location:
                personal_details.append(f"Location: {info.location}")
            if personal_details:
                summary_parts.append(
                    "### Personal Information\n" + "\n".join(personal_details)
                )

        # About/Summary
        if portfolio_data.text_blobs:
            for blob in portfolio_data.text_blobs:
                if blob.type == "about" and blob.content:
                    summary_parts.append(f"### About\n{blob.content}")
                elif blob.type == "summary" and blob.content:
                    summary_parts.append(f"### Summary\n{blob.content}")

        # Skills - complete list
        if portfolio_data.skills:
            skills_text = ", ".join(portfolio_data.skills)
            summary_parts.append(f"### Skills\n{skills_text}")

        # Work Experience - detailed
        if portfolio_data.work_experiences:
            exp_details = []
            for i, exp in enumerate(portfolio_data.work_experiences, 1):
                exp_text = f"\n{i}. {exp.title} at {exp.company}"
                if exp.start_date or exp.end_date:
                    dates = f" ({exp.start_date or 'Unknown'} - {exp.end_date or 'Present'})"
                    exp_text += dates
                if exp.location:
                    exp_text += f"\n   Location: {exp.location}"
                if exp.description:
                    exp_text += f"\n   Description: {exp.description}"
                if exp.technologies:
                    exp_text += f"\n   Technologies: {', '.join(exp.technologies)}"
                exp_details.append(exp_text)
            summary_parts.append("### Work Experience" + "".join(exp_details))

        # Projects - detailed
        if portfolio_data.projects:
            project_details = []
            for i, proj in enumerate(portfolio_data.projects, 1):
                proj_text = f"\n{i}. {proj.name}"
                if proj.description:
                    proj_text += f"\n   Description: {proj.description}"
                if proj.technologies:
                    proj_text += f"\n   Technologies: {', '.join(proj.technologies)}"
                if proj.url:
                    proj_text += f"\n   URL: {proj.url}"
                if proj.github_url:
                    proj_text += f"\n   GitHub: {proj.github_url}"
                if proj.start_date or proj.end_date:
                    dates = f"\n   Duration: {proj.start_date or 'Unknown'} - {proj.end_date or 'Present'}"
                    proj_text += dates
                if proj.highlights:
                    proj_text += f"\n   Highlights: {'; '.join(proj.highlights)}"
                project_details.append(proj_text)
            summary_parts.append("### Projects" + "".join(project_details))

        # Education - detailed
        if portfolio_data.education:
            edu_details = []
            for i, edu in enumerate(portfolio_data.education, 1):
                edu_text = f"\n{i}. {edu.degree}"
                if edu.field_of_study:
                    edu_text += f" in {edu.field_of_study}"
                edu_text += f" from {edu.institution}"
                if edu.start_date or edu.end_date:
                    dates = f" ({edu.start_date or 'Unknown'} - {edu.end_date or 'Present'})"
                    edu_text += dates
                if edu.gpa:
                    edu_text += f"\n   GPA: {edu.gpa}"
                if edu.location:
                    edu_text += f"\n   Location: {edu.location}"
                if edu.description:
                    edu_text += f"\n   Description: {edu.description}"
                edu_details.append(edu_text)
            summary_parts.append("### Education" + "".join(edu_details))

        # Certifications
        if portfolio_data.certifications:
            cert_details = []
            for i, cert in enumerate(portfolio_data.certifications, 1):
                cert_text = f"\n{i}. {cert.name}"
                if cert.issuer:
                    cert_text += f" (issued by {cert.issuer})"
                if cert.date:
                    cert_text += f"\n   Date: {cert.date}"
                if cert.url:
                    cert_text += f"\n   URL: {cert.url}"
                cert_details.append(cert_text)
            summary_parts.append("### Certifications" + "".join(cert_details))

        # Profiles (GitHub, LinkedIn, etc.)
        if portfolio_data.profiles:
            profile_details = []
            for profile in portfolio_data.profiles:
                profile_details.append(f"{profile.platform}: {profile.url}")
            summary_parts.append("### Profiles\n" + "\n".join(profile_details))

        return (
            "\n\n".join(summary_parts)
            if summary_parts
            else "No portfolio data available"
        )

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
            system_prompt = self._create_system_prompt(portfolio_data)

            # Prepare messages
            messages = self._prepare_conversation_messages(
                system_prompt, conversation_history, user_message
            )

            # Make streaming API call with tool support
            response = self.client.complete(
                stream=True,
                messages=messages,
                tools=[self.WIDGET_RENDER_TOOL],
                tool_choice="auto",
                model=self.model_name,
                max_tokens=ChatConfig.MAX_RESPONSE_TOKENS,
            )

            # Track tool calls across chunks
            tool_calls_dict: Dict[str, Dict[str, Any]] = {}
            content_buffer = ""

            # Process streaming response
            for update in response:
                if not update.choices:
                    continue

                delta = update.choices[0].delta

                # Handle tool calls
                if delta.tool_calls:
                    for tc_update in delta.tool_calls:
                        # Initialize tool call if new
                        if tc_update.id:
                            tool_calls_dict[tc_update.id] = {
                                "id": tc_update.id,
                                "type": "function",
                                "function": {"name": "", "arguments": ""},
                            }

                        # Update tool call data
                        if tc_update.function:
                            tc_id = tc_update.id or list(tool_calls_dict.keys())[-1]
                            if tc_update.function.name:
                                tool_calls_dict[tc_id]["function"][
                                    "name"
                                ] = tc_update.function.name
                            if tc_update.function.arguments:
                                tool_calls_dict[tc_id]["function"][
                                    "arguments"
                                ] += tc_update.function.arguments

                # Handle content
                if delta.content:
                    content_buffer += delta.content
                    yield {"type": "content", "data": delta.content}

            # Yield complete tool calls
            for tool_call_data in tool_calls_dict.values():
                try:
                    args = json.loads(tool_call_data["function"]["arguments"])
                    tool_call = ToolCall(
                        widget=args["widget"],
                        indices=args.get("indices"),
                        explanation=args.get("explanation"),
                    )
                    yield {"type": "tool_call", "data": tool_call}
                except Exception as e:
                    logger.error(f"Failed to parse tool call: {e}")

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

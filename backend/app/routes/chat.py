"""
Chat API routes for AI-powered portfolio conversations.

This module provides the chat endpoint that integrates with the AI chat service,
portfolio access control, rate limiting, and conversation storage.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
import logging
import json
from typing import AsyncGenerator

from ..schemas.chat import ChatRequest, ChatResponse, ChatMessage, ToolCall
from ..dependencies.portfolio_access import check_portfolio_access
from ..dependencies.chat_rate_limiting import (
    check_chat_ip_rate_limit,
    check_portfolio_owner_usage_limit,
    increment_portfolio_owner_usage,
    validate_chat_input_tokens,
)
from ..services.portfolio_service import get_portfolio_service
from ..services.ai_chat_service import get_ai_chat_service, AIChatError
from ..services.chat_storage_service import ChatStorageService, ChatStorageError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/{username}")
async def chat_with_portfolio(
    username: str,
    request: Request,
    chat_request: ChatRequest,
    ip_address: str = Depends(check_chat_ip_rate_limit),
    portfolio_owner_user_id: str = Depends(check_portfolio_access),
) -> StreamingResponse:
    """
    Chat with an AI assistant about a portfolio.

    This endpoint processes natural language queries about a portfolio and returns
    intelligent responses with optional widget rendering through tool calls.

    Access control:
    - Public portfolios: Allow unauthenticated requests
    - Private portfolios: Require authentication and verify user matches owner

    Rate limiting:
    - IP-based: 50 requests per hour per IP address
    - Portfolio owner: 100 messages per month per portfolio

    Args:
        username: Portfolio username to chat about
        request: FastAPI request object
        chat_request: Chat request with message and optional conversation_id
        ip_address: IP address from rate limiting dependency
        portfolio_owner_user_id: Portfolio owner's user_id from access control dependency

    Returns:
        StreamingResponse with Server-Sent Events (SSE) format

    Raises:
        HTTPException: For various error conditions
    """
    try:
        # Validate user input token count
        try:
            validate_chat_input_tokens(chat_request.message)
        except HTTPException as e:
            logger.warning(f"Input validation failed for user message: {e.detail}")
            raise

        # Check portfolio owner's monthly usage limit
        try:
            await check_portfolio_owner_usage_limit(portfolio_owner_user_id)
        except HTTPException as e:
            logger.warning(
                f"Portfolio owner usage limit exceeded for {portfolio_owner_user_id}"
            )
            raise

        # Fetch portfolio data for the specified username
        try:
            portfolio_service = get_portfolio_service()
            portfolio_data = portfolio_service.get_portfolio_by_username(username)

            if not portfolio_data:
                logger.warning(f"Portfolio not found for username: {username}")
                raise HTTPException(
                    status_code=404,
                    detail={
                        "message": f"Portfolio not found for username: {username}",
                        "error_code": "PORTFOLIO_NOT_FOUND",
                    },
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch portfolio data for {username}: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Failed to retrieve portfolio data",
                    "error_code": "PORTFOLIO_FETCH_FAILED",
                },
            )

        # Initialize chat storage service
        try:
            chat_storage = ChatStorageService()
        except ChatStorageError as e:
            logger.error(f"Failed to initialize chat storage: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Chat service temporarily unavailable",
                    "error_code": "CHAT_STORAGE_INIT_FAILED",
                },
            )

        # Retrieve conversation history if conversation_id provided
        conversation_history = []
        conversation_id = chat_request.conversation_id

        try:
            if conversation_id:
                # Get recent messages for context
                conversation_history = chat_storage.get_recent_messages(conversation_id)
                logger.info(
                    f"Retrieved {len(conversation_history)} messages from conversation {conversation_id}"
                )
            else:
                # Create new conversation
                conversation_id = chat_storage.create_conversation(
                    username=username, ip_address=ip_address, user_id=None
                )
                logger.info(f"Created new conversation {conversation_id}")
        except ChatStorageError as e:
            logger.error(f"Failed to manage conversation: {e}")
            # Continue with empty history rather than failing
            conversation_history = []
            if not conversation_id:
                # Generate a temporary conversation ID
                import uuid

                conversation_id = str(uuid.uuid4())
                logger.warning(
                    f"Using temporary conversation ID due to storage error: {conversation_id}"
                )

        # Store user message
        try:
            user_message = ChatMessage(
                role="user", content=chat_request.message, tool_calls=None
            )
            chat_storage.store_message(
                conversation_id=conversation_id,
                message=user_message,
                username=username,
                ip_address=ip_address,
                user_id=None,
            )
        except ChatStorageError as e:
            logger.error(f"Failed to store user message: {e}")
            # Continue processing even if storage fails
            pass

        # Get AI chat service
        try:
            ai_chat_service = get_ai_chat_service()
        except Exception as e:
            logger.error(f"Failed to initialize AI chat service: {e}")
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "AI chat service temporarily unavailable. Please try again later.",
                    "error_code": "AI_SERVICE_UNAVAILABLE",
                },
            )

        # Create streaming response generator
        async def generate_sse_stream() -> AsyncGenerator[str, None]:
            """Generate Server-Sent Events stream for chat response."""
            content_buffer = ""
            tool_calls_list = []

            try:
                # Process chat with streaming
                async for chunk in ai_chat_service.process_chat_streaming(
                    user_message=chat_request.message,
                    portfolio_data=portfolio_data,
                    conversation_history=conversation_history,
                ):
                    chunk_type = chunk.get("type")
                    chunk_data = chunk.get("data")

                    if chunk_type == "content":
                        # Stream content chunks
                        content_buffer += chunk_data
                        yield f"data: {json.dumps({'type': 'content', 'data': chunk_data})}\n\n"

                    elif chunk_type == "tool_call":
                        # Collect tool calls
                        tool_calls_list.append(chunk_data)
                        # Stream tool call
                        yield f"data: {json.dumps({'type': 'tool_call', 'data': chunk_data.model_dump()})}\n\n"

                    elif chunk_type == "error":
                        # Stream error
                        yield f"data: {json.dumps({'type': 'error', 'data': chunk_data})}\n\n"
                        return

                    elif chunk_type == "done":
                        # Store assistant response
                        try:
                            assistant_message = ChatMessage(
                                role="assistant",
                                content=content_buffer,
                                tool_calls=tool_calls_list if tool_calls_list else None,
                            )
                            chat_storage.store_message(
                                conversation_id=conversation_id,
                                message=assistant_message,
                                username=username,
                                ip_address=ip_address,
                                user_id=None,
                            )
                        except ChatStorageError as e:
                            logger.error(f"Failed to store assistant message: {e}")
                            # Continue even if storage fails

                        # Increment portfolio owner's monthly message counter
                        try:
                            await increment_portfolio_owner_usage(
                                portfolio_owner_user_id
                            )
                        except Exception as e:
                            logger.error(
                                f"Failed to increment portfolio owner usage: {e}"
                            )
                            # Continue even if increment fails

                        # Send final response with conversation_id
                        final_response = {
                            "type": "done",
                            "data": {"conversation_id": conversation_id},
                        }
                        yield f"data: {json.dumps(final_response)}\n\n"

            except AIChatError as e:
                logger.error(f"AI chat error in streaming response: {e}")
                error_response = {
                    "type": "error",
                    "data": "I'm having trouble processing your message right now. Please try again.",
                }
                yield f"data: {json.dumps(error_response)}\n\n"
            except Exception as e:
                logger.error(f"Unexpected error in streaming response: {e}")
                error_response = {
                    "type": "error",
                    "data": "An unexpected error occurred. Please try again later.",
                }
                yield f"data: {json.dumps(error_response)}\n\n"

        # Return streaming response
        return StreamingResponse(
            generate_sse_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            },
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error during chat processing",
                "error_code": "INTERNAL_ERROR",
            },
        )

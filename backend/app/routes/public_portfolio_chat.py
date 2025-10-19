"""Refactored handlers for the public chat endpoint with Vercel AI SDK integration."""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Optional, AsyncGenerator

from fastapi import HTTPException, Request
from fastapi.responses import StreamingResponse

from ..schemas.chat import ChatRequest, ChatMessage, ChatRequestMessage
from ..schemas.portfolio import PortfolioData
from ..services.chat_storage_service import ChatStorageService, ChatStorageError
from ..dependencies.chat_rate_limiting import (
    validate_chat_input_length,
    check_chat_ip_rate_limit,
    check_portfolio_owner_usage_limit,
    increment_portfolio_owner_usage,
)
from ..services.ai_chat_service import get_ai_chat_service
from ..routes.utils.auth_helpers import (
    validate_portfolio_access,
    extract_bearer_token,
)
from ..services.portfolio_service import get_portfolio_service, FirebaseError

logger = logging.getLogger(__name__)


async def _ensure_chat_access(username: str, authorization: str) -> dict:
    user_settings, _ = validate_portfolio_access(
        username=username, authorization=authorization, require_public=False
    )
    user_id = user_settings.get("user_id")
    if not user_id:
        logger.error(f"No user_id found for username '{username}'")
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return user_settings


async def _fetch_portfolio(username: str) -> PortfolioData:
    portfolio_service = get_portfolio_service()
    try:
        portfolio = portfolio_service.get_portfolio_by_username(username)
    except FirebaseError as exc:
        logger.error(f"Failed to fetch portfolio data for {username}: {exc}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to retrieve portfolio data",
                "error_code": "PORTFOLIO_FETCH_FAILED",
            },
        )

    if not portfolio:
        logger.warning(f"Portfolio not found for username: {username}")
        raise HTTPException(
            status_code=404,
            detail={
                "message": f"Portfolio not found for username: {username}",
                "error_code": "PORTFOLIO_NOT_FOUND",
            },
        )
    return portfolio


def _convert_messages_to_history(
    messages: list[ChatRequestMessage],
) -> list[ChatMessage]:
    """
    Convert Vercel AI SDK messages to ChatMessage format for conversation history.

    Only includes user and assistant messages (excludes system messages).
    Excludes the last user message as it will be processed separately.

    Args:
        messages: Messages from Vercel AI SDK request

    Returns:
        List of ChatMessage objects representing conversation history
    """
    history = []

    # Process all but the last message (the current user message)
    for msg in messages[:-1]:
        if msg.role in ["user", "assistant"]:
            history.append(
                ChatMessage(
                    role=msg.role,
                    content=msg.content,
                    id=msg.id or str(uuid.uuid4()),
                )
            )

    logger.info(
        f"Converted {len(history)} messages from request to conversation history"
    )
    return history


def _ensure_conversation_id(request_id: Optional[str]) -> str:
    """
    Ensure we have a valid conversation ID.

    Uses the ID from Vercel AI SDK request if available, otherwise generates one.

    Args:
        request_id: ID from Vercel AI SDK request

    Returns:
        Valid conversation ID
    """
    if request_id:
        return request_id

    new_id = str(uuid.uuid4())
    logger.info(f"Generated new conversation ID: {new_id}")
    return new_id


async def _store_message_async(
    chat_storage: ChatStorageService,
    conversation_id: str,
    message: ChatMessage,
    username: str,
    ip_address: str,
):
    """
    Store a message asynchronously without blocking the response stream.

    This is called as a background task to avoid delaying streaming responses.

    Args:
        chat_storage: Chat storage service instance
        conversation_id: ID of the conversation
        message: Message to store
        username: Portfolio username
        ip_address: Client IP address
    """
    try:
        await asyncio.to_thread(
            chat_storage.store_message,
            conversation_id=conversation_id,
            message=message,
            username=username,
            ip_address=ip_address,
            user_id=None,
        )
        logger.debug(f"Stored {message.role} message in conversation {conversation_id}")
    except ChatStorageError as exc:
        logger.error(f"Failed to store message: {exc}")
    except Exception as exc:
        logger.error(f"Unexpected error storing message: {exc}", exc_info=True)


async def _stream_chat_response(
    username: str,
    user_message: str,
    conversation_id: str,
    conversation_history: list[ChatMessage],
    portfolio_data: PortfolioData,
    chat_storage: ChatStorageService,
    ip_address: str,
    portfolio_owner_user_id: str,
):
    """
    Stream chat response using Vercel AI SDK format.

    Streams immediately without blocking on database operations.
    Message storage happens asynchronously in the background.

    Args:
        username: Portfolio username
        user_message: Current user message content
        conversation_id: Conversation ID
        conversation_history: Previous messages (from request)
        portfolio_data: Portfolio data for context
        chat_storage: Storage service for persisting messages
        ip_address: Client IP address
        portfolio_owner_user_id: Portfolio owner's user ID

    Returns:
        StreamingResponse with Vercel AI SDK formatted events
    """
    ai_chat_service = get_ai_chat_service()

    async def event_stream() -> AsyncGenerator[str, None]:
        content_buffer = ""
        storage_tasks = []

        try:
            # Stream AI response in real-time
            async for chunk in ai_chat_service.process_chat_streaming(
                user_message=user_message,
                portfolio_data=portfolio_data,
                conversation_history=conversation_history,
            ):
                chunk_type = chunk.get("type")
                data = chunk.get("data")

                if chunk_type == "content" and isinstance(data, str):
                    content_buffer += data
                    # Stream text delta in Vercel AI SDK format: 0:"text chunk"\n
                    escaped_text = (
                        data.replace("\\", "\\\\")
                        .replace('"', '\\"')
                        .replace("\n", "\\n")
                    )
                    yield f'0:"{escaped_text}"\n'

                elif chunk_type == "cmd" and isinstance(data, str):
                    # Include delimiter commands in content buffer for storage
                    delimiter = f"<<<{data}>>>"
                    content_buffer += delimiter
                    escaped_delimiter = delimiter.replace("\\", "\\\\").replace(
                        '"', '\\"'
                    )
                    yield f'0:"{escaped_delimiter}"\n'

                elif chunk_type == "done":
                    # Processing completed successfully
                    break

                elif chunk_type == "error":
                    # Stream error in AI SDK format
                    error_msg = str(data).replace("\\", "\\\\").replace('"', '\\"')
                    yield f'3:{{"error":"{error_msg}"}}\n'
                    return

            # Store assistant message asynchronously (non-blocking)
            assistant_message = ChatMessage(
                role="assistant",
                content=content_buffer,
            )

            # Launch storage tasks without waiting
            storage_task = asyncio.create_task(
                _store_message_async(
                    chat_storage,
                    conversation_id,
                    assistant_message,
                    username,
                    ip_address,
                )
            )
            storage_tasks.append(storage_task)

            # Increment usage asynchronously
            usage_task = asyncio.create_task(
                _increment_usage_async(portfolio_owner_user_id)
            )
            storage_tasks.append(usage_task)

            # Send stream completion in AI SDK format
            # e: event data (usage stats)
            # d: done signal
            yield 'e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'
            yield f'd:{{"finishReason":"stop","conversationId":"{conversation_id}"}}\n'

        except Exception as e:
            logger.error(f"Error in event stream: {str(e)}", exc_info=True)
            error_msg = str(e).replace("\\", "\\\\").replace('"', '\\"')
            yield f'3:{{"error":"Stream error: {error_msg}"}}\n'
        finally:
            # Ensure storage tasks complete (but don't block the response)
            if storage_tasks:
                asyncio.create_task(_wait_for_tasks(storage_tasks))

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream",
            "x-vercel-ai-data-stream": "v1",
        },
    )


async def _increment_usage_async(portfolio_owner_user_id: str):
    """
    Increment portfolio owner usage asynchronously.

    This is called as a background task to avoid blocking the response stream.

    Args:
        portfolio_owner_user_id: Portfolio owner's user ID
    """
    try:
        await increment_portfolio_owner_usage(portfolio_owner_user_id)
        logger.debug(f"Incremented usage for user {portfolio_owner_user_id}")
    except Exception as exc:
        logger.error(f"Failed to increment portfolio owner usage: {exc}", exc_info=True)


async def _wait_for_tasks(tasks: list[asyncio.Task]):
    """
    Wait for background tasks to complete without raising exceptions.

    This ensures storage operations complete even if they fail.

    Args:
        tasks: List of asyncio tasks to wait for
    """
    try:
        await asyncio.gather(*tasks, return_exceptions=True)
    except Exception as exc:
        logger.error(f"Error waiting for background tasks: {exc}", exc_info=True)


async def handle_chat_request(
    username: str,
    request: Request,
    authorization: str,
) -> StreamingResponse:
    """
    Handle chat request with Vercel AI SDK integration.

    Optimized for minimal latency:
    - No database reads for conversation history (uses history from request)
    - Immediate streaming (no blocking operations before stream starts)
    - Async message storage (non-blocking)

    Args:
        username: Portfolio username
        request: FastAPI request object
        authorization: Authorization header

    Returns:
        StreamingResponse with Vercel AI SDK formatted events
    """
    # Step 1: Validate access and get user settings
    user_settings = await _ensure_chat_access(username, authorization)
    portfolio_owner_user_id = user_settings.get("user_id")

    # Step 2: Extract and validate token
    token = extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    # Step 3: Check rate limits
    ip_address = await check_chat_ip_rate_limit(request, username, token)

    # Step 4: Parse request body
    body = await request.json()
    chat_request = ChatRequest(**body)

    # Step 5: Validate messages array
    if not chat_request.messages:
        raise HTTPException(status_code=400, detail="No messages found in request")

    # Extract the last message (current user message)
    last_message = chat_request.messages[-1]
    if last_message.role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user")

    user_message_content = last_message.content
    validate_chat_input_length(user_message_content)

    # Step 6: Check portfolio owner usage limits
    await check_portfolio_owner_usage_limit(portfolio_owner_user_id)

    # Step 7: Fetch portfolio data (required for AI context)
    portfolio_data = await _fetch_portfolio(username)

    # Step 8: Convert messages to conversation history
    # (excludes the last user message which we're processing)
    conversation_history = _convert_messages_to_history(chat_request.messages)

    # Step 9: Ensure we have a conversation ID
    conversation_id = _ensure_conversation_id(chat_request.id)

    # Step 10: Store user message asynchronously (non-blocking)
    chat_storage = ChatStorageService()
    user_message = ChatMessage(role="user", content=user_message_content)

    asyncio.create_task(
        _store_message_async(
            chat_storage,
            conversation_id,
            user_message,
            username,
            ip_address,
        )
    )

    # Step 11: Stream response immediately
    logger.info(
        f"Starting chat stream for {username} - conversation: {conversation_id}, "
        f"history length: {len(conversation_history)}"
    )

    return await _stream_chat_response(
        username=username,
        user_message=user_message_content,
        conversation_id=conversation_id,
        conversation_history=conversation_history,
        portfolio_data=portfolio_data,
        chat_storage=chat_storage,
        ip_address=ip_address,
        portfolio_owner_user_id=portfolio_owner_user_id,
    )

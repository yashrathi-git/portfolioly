"""Refactored handlers for the public chat endpoint."""

from __future__ import annotations

import json
import logging
from typing import Optional, AsyncGenerator, Dict

from fastapi import HTTPException, Request
from fastapi.responses import StreamingResponse

from ..schemas.chat import ChatRequest, ChatMessage, ToolCall
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


async def _resolve_conversation(
    chat_storage: ChatStorageService,
    username: str,
    ip_address: str,
    conversation_id: Optional[str],
) -> tuple[str, list[ChatMessage]]:
    if conversation_id:
        try:
            history = chat_storage.get_recent_messages(conversation_id)
            logger.info(
                f"Retrieved {len(history)} messages from conversation {conversation_id}"
            )
            return conversation_id, history
        except ChatStorageError as exc:
            logger.error(f"Failed to manage conversation: {exc}")
            return conversation_id, []

    try:
        conversation_id = chat_storage.create_conversation(
            username=username, ip_address=ip_address, user_id=None
        )
        logger.info(f"Created new conversation {conversation_id}")
        return conversation_id, []
    except ChatStorageError as exc:
        logger.error(f"Failed to create conversation: {exc}")
        return conversation_id or "", []


async def _store_message(
    chat_storage: ChatStorageService,
    conversation_id: str,
    message: ChatMessage,
    username: str,
    ip_address: str,
):
    try:
        chat_storage.store_message(
            conversation_id=conversation_id,
            message=message,
            username=username,
            ip_address=ip_address,
            user_id=None,
        )
    except ChatStorageError as exc:
        logger.error(f"Failed to store message: {exc}")


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
    ai_chat_service = get_ai_chat_service()

    async def event_stream() -> AsyncGenerator[str, None]:
        content_buffer = ""
        tool_calls: list[ToolCall] = []

        async for chunk in ai_chat_service.process_chat_streaming(
            user_message=user_message,
            portfolio_data=portfolio_data,
            conversation_history=conversation_history,
        ):
            chunk_type = chunk.get("type")
            data = chunk.get("data")

            if chunk_type == "content" and isinstance(data, str):
                content_buffer += data
                yield f"data: {json.dumps({'type': 'content', 'data': data})}\n\n"
            elif chunk_type == "tool_call" and isinstance(data, ToolCall):
                tool_calls.append(data)
                yield f"data: {json.dumps({'type': 'tool_call', 'data': data.model_dump()})}\n\n"
            elif chunk_type == "error":
                yield f"data: {json.dumps({'type': 'error', 'data': data})}\n\n"
                return

        assistant_message = ChatMessage(
            role="assistant",
            content=content_buffer,
            tool_calls=tool_calls or None,
        )
        await _persist_assistant_message(
            chat_storage,
            conversation_id,
            assistant_message,
            username,
            ip_address,
            portfolio_owner_user_id,
        )

        done_payload = {
            "type": "done",
            "data": {"conversation_id": conversation_id},
        }
        yield f"data: {json.dumps(done_payload)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _persist_assistant_message(
    chat_storage: ChatStorageService,
    conversation_id: str,
    assistant_message: ChatMessage,
    username: str,
    ip_address: str,
    portfolio_owner_user_id: str,
):
    await _store_message(
        chat_storage,
        conversation_id,
        assistant_message,
        username,
        ip_address,
    )
    try:
        await increment_portfolio_owner_usage(portfolio_owner_user_id)
    except Exception as exc:
        logger.error(f"Failed to increment portfolio owner usage: {exc}")


async def handle_chat_request(
    username: str,
    request: Request,
    authorization: str,
) -> StreamingResponse:
    user_settings = await _ensure_chat_access(username, authorization)
    portfolio_owner_user_id = user_settings.get("user_id")

    token = extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    ip_address = await check_chat_ip_rate_limit(request, username, token)

    body = await request.json()
    chat_request = ChatRequest(**body)
    validate_chat_input_length(chat_request.message)

    await check_portfolio_owner_usage_limit(portfolio_owner_user_id)

    portfolio_data = await _fetch_portfolio(username)

    chat_storage = ChatStorageService()
    conversation_id, history = await _resolve_conversation(
        chat_storage, username, ip_address, chat_request.conversation_id
    )

    user_message = ChatMessage(role="user", content=chat_request.message)
    await _store_message(
        chat_storage, conversation_id, user_message, username, ip_address
    )

    return await _stream_chat_response(
        username,
        chat_request.message,
        conversation_id,
        history,
        portfolio_data,
        chat_storage,
        ip_address,
        portfolio_owner_user_id,
    )

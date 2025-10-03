"""
Public portfolio API routes for accessing published portfolios.
"""

from fastapi import APIRouter, HTTPException, Path, Header, Request
from typing import Optional
import logging

from ..schemas.portfolio import PortfolioData
from ..schemas.public_token import (
    EnsureUsernameRequest,
    EnsureUsernameResponse,
    EnsureTokenRequest,
    EnsureTokenResponse,
)
from ..services.portfolio_service import get_portfolio_service, FirebaseError
from ..services.user_settings_service import (
    get_user_settings_service,
    UserSettingsError,
)
from ..services.public_token_service import get_public_token_service
from ..core.firebase import get_firebase_auth

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/public", tags=["public-portfolio"])


@router.get("/portfolio/{username}", response_model=Optional[PortfolioData])
def get_public_portfolio(
    username: str = Path(..., description="Username of the portfolio to retrieve"),
    authorization: Optional[str] = Header(
        None, description="Optional Bearer token for authentication"
    ),
):
    """
    Get a public portfolio by username.

    Optionally accepts an Authorization header with a Bearer token.
    If provided, the token will be verified. Returns 401 if token is invalid.

    Returns 404 if the portfolio doesn't exist or is private.
    """
    try:
        user_settings_service = get_user_settings_service()
        portfolio_service = get_portfolio_service()

        # First, check if the username exists and portfolio is public
        user_settings = user_settings_service.get_user_settings_by_username(username)

        if not user_settings:
            logger.info(f"Username '{username}' not found")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # If authorization header is present, verify the token
        if authorization:
            # Extract Bearer token
            if not authorization.startswith("Bearer "):
                logger.warning(
                    f"Invalid authorization header format for username '{username}'"
                )
                raise HTTPException(status_code=401, detail="Invalid token")

            token = authorization[7:]  # Remove "Bearer " prefix

            # Get token version from user settings
            token_version = user_settings.get("public_token_ver", 1)

            # Verify token
            token_service = get_public_token_service()
            is_valid = token_service.verify_public_token(username, token, token_version)

            if not is_valid:
                logger.warning(f"Invalid token provided for username '{username}'")
                raise HTTPException(status_code=401, detail="Invalid token")

            logger.info(f"Token verified successfully for username '{username}'")

        if not user_settings.get("is_public", False):
            logger.info(f"Portfolio for username '{username}' is private")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Get the user ID from settings
        user_id = user_settings.get("user_id")
        if not user_id:
            logger.error(f"No user_id found for username '{username}'")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Fetch the portfolio data
        portfolio_data = portfolio_service.get_portfolio_data(user_id)

        if not portfolio_data:
            logger.info(
                f"No portfolio data found for user_id '{user_id}' (username: '{username}')"
            )
            raise HTTPException(status_code=404, detail="Portfolio not found")

        logger.info(
            f"Successfully retrieved public portfolio for username '{username}'"
        )
        return portfolio_data

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except UserSettingsError as e:
        logger.error(f"User settings error for username '{username}': {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve portfolio")
    except FirebaseError as e:
        logger.error(
            f"Firebase error retrieving portfolio for username '{username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Failed to retrieve portfolio")
    except Exception as e:
        logger.error(
            f"Unexpected error retrieving portfolio for username '{username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/ensure-username", response_model=EnsureUsernameResponse)
def ensure_username(request: EnsureUsernameRequest):
    """
    Get or generate a username for a user.

    Flow:
    1. Fetch user settings by user_id
    2. If username exists, return it
    3. If no username, get user email from Firebase Auth
    4. Generate username from email (part before @)
    5. Store username in user_settings
    6. Return username
    """
    try:
        user_settings_service = get_user_settings_service()

        # Check if user already has settings with a username
        existing_settings = user_settings_service.get_user_settings(request.user_id)

        if existing_settings and existing_settings.get("username"):
            username = existing_settings.get("username")
            logger.info(f"User {request.user_id} already has username: {username}")
            return EnsureUsernameResponse(username=username)

        # User doesn't have a username, generate one from email
        try:
            auth = get_firebase_auth()
            user_record = auth.get_user(request.user_id)
            email = user_record.email

            if not email:
                logger.error(f"User {request.user_id} has no email address")
                raise HTTPException(status_code=400, detail="User has no email address")

            # Generate username from email
            username = user_settings_service.generate_username_from_email(email)

            # Store the username in user settings
            user_settings_service.set_username(request.user_id, username)

            logger.info(
                f"Generated and stored username '{username}' for user {request.user_id}"
            )
            return EnsureUsernameResponse(username=username)

        except Exception as e:
            logger.error(f"Error getting user email from Firebase Auth: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to retrieve user information"
            )

    except HTTPException:
        raise
    except UserSettingsError as e:
        logger.error(f"User settings error for user {request.user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to ensure username")
    except Exception as e:
        logger.error(
            f"Unexpected error ensuring username for user {request.user_id}: {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/ensure-token", response_model=EnsureTokenResponse)
def ensure_token(request: EnsureTokenRequest):
    """
    Generate a public token for a username.

    Returns 404 if:
    - Username doesn't exist
    - Portfolio is private (is_public == false)
    - Token generation disabled (public_token_enabled == false)

    Returns:
        EnsureTokenResponse with the generated token in format "psk_xxx..."
    """
    try:
        user_settings_service = get_user_settings_service()
        token_service = get_public_token_service()

        # Fetch user settings by username
        user_settings = user_settings_service.get_user_settings_by_username(
            request.username
        )

        # Return 404 if username doesn't exist
        if not user_settings:
            logger.info(f"Username '{request.username}' not found for token generation")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Return 404 if portfolio is private
        # if not user_settings.get("is_public", False):
        #     logger.info(
        #         f"Portfolio for username '{request.username}' is private, cannot generate token"
        #     )
        #     raise HTTPException(status_code=404, detail="Portfolio not found")

        # Return 404 if token generation is disabled
        if not user_settings.get("public_token_enabled", True):
            logger.info(f"Token generation disabled for username '{request.username}'")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Get the token version from user settings
        token_version = user_settings.get("public_token_ver", 1)

        # Generate the token
        token = token_service.derive_public_token(request.username, token_version)

        logger.info(
            f"Generated token for username '{request.username}' with version {token_version}"
        )
        return EnsureTokenResponse(token=token)

    except HTTPException:
        raise
    except UserSettingsError as e:
        logger.error(
            f"User settings error generating token for username '{request.username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Failed to generate token")
    except Exception as e:
        logger.error(
            f"Unexpected error generating token for username '{request.username}': {e}"
        )
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/username/{username}/available", response_model=dict)
def check_username_availability(
    username: str = Path(..., description="Username to check availability for"),
):
    """
    Check if a username is available for registration.
    Returns {"available": true/false}
    """
    try:
        user_settings_service = get_user_settings_service()

        # Validate username format
        validation_result = user_settings_service.validate_username(username)
        if not validation_result["valid"]:
            return {
                "available": False,
                "reason": validation_result.get("error", "Invalid username format"),
            }

        # Check if username is already taken
        existing_settings = user_settings_service.get_user_settings_by_username(
            username
        )
        is_available = existing_settings is None

        logger.info(f"Username '{username}' availability check: {is_available}")

        result = {"available": is_available}
        if not is_available:
            result["reason"] = "Username is already taken"

        return result

    except UserSettingsError as e:
        logger.error(f"User settings error checking username '{username}': {e}")
        raise HTTPException(
            status_code=500, detail="Failed to check username availability"
        )
    except Exception as e:
        logger.error(f"Unexpected error checking username '{username}': {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/chat/{username}")
async def chat_with_public_portfolio(
    username: str,
    request: Request,
    authorization: str = Header(..., description="Bearer token for authentication"),
):
    """
    Chat with an AI assistant about a public portfolio using token authentication.

    This endpoint processes natural language queries about a portfolio and returns
    intelligent responses with optional widget rendering through tool calls.

    Access control:
    - Requires valid public token in Authorization header
    - Portfolio must be public (is_public == true)

    Rate limiting:
    - IP-based: 50 requests per hour per IP address
    - Portfolio owner: 100 messages per month per portfolio

    Args:
        username: Portfolio username to chat about
        request: FastAPI request object
        authorization: Bearer token (required)

    Returns:
        StreamingResponse with Server-Sent Events (SSE) format

    Raises:
        HTTPException: 401 for missing/invalid token, 404 for private/missing portfolio
    """
    from fastapi.responses import StreamingResponse
    from typing import AsyncGenerator
    import json
    from ..schemas.chat import ChatRequest, ChatMessage
    from ..services.ai_chat_service import get_ai_chat_service, AIChatError
    from ..services.chat_storage_service import ChatStorageService, ChatStorageError
    from ..dependencies.chat_rate_limiting import (
        validate_chat_input_tokens,
        check_portfolio_owner_usage_limit,
        increment_portfolio_owner_usage,
    )

    try:
        # Extract Bearer token from authorization header
        if not authorization.startswith("Bearer "):
            logger.warning(
                f"Invalid authorization header format for username '{username}'"
            )
            raise HTTPException(status_code=401, detail="Invalid token")

        token = authorization[7:]  # Remove "Bearer " prefix

        # Fetch user settings by username to get public_token_ver
        user_settings_service = get_user_settings_service()
        user_settings = user_settings_service.get_user_settings_by_username(username)

        if not user_settings:
            logger.info(f"Username '{username}' not found for chat")
            raise HTTPException(status_code=404, detail="Portfolio not found")

        # Verify token using token service (token is the only barrier)
        token_version = user_settings.get("public_token_ver", 1)
        token_service = get_public_token_service()
        is_valid = token_service.verify_public_token(username, token, token_version)

        if not is_valid:
            logger.warning(
                f"Invalid token provided for chat with username '{username}'"
            )
            raise HTTPException(status_code=401, detail="Invalid token")

        logger.info(f"Token verified successfully for chat with username '{username}'")

        # Check rate limiting with token-based keys
        from ..dependencies.chat_rate_limiting import check_chat_ip_rate_limit

        try:
            ip_address = await check_chat_ip_rate_limit(request, username, token)
        except HTTPException as e:
            logger.warning(
                f"Rate limit exceeded for chat with username '{username}' from IP {request.client.host if request.client else 'unknown'}"
            )
            raise

        # Parse chat request from body
        body = await request.json()
        chat_request = ChatRequest(**body)

        # Validate user input token count
        try:
            validate_chat_input_tokens(chat_request.message)
        except HTTPException as e:
            logger.warning(f"Input validation failed for user message: {e.detail}")
            raise

        # Get portfolio owner user_id for usage tracking
        portfolio_owner_user_id = user_settings.get("user_id")
        if not portfolio_owner_user_id:
            logger.error(f"No user_id found for username '{username}'")
            raise HTTPException(status_code=404, detail="Portfolio not found ok?")

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

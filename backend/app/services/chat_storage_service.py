"""
Chat storage service for managing conversation history in Firebase Firestore.

This service handles storing and retrieving chat conversations with support for
conversation threading, message history, and IP address tracking.
"""

import logging
from typing import Optional, List
from datetime import datetime

import firebase_admin
from firebase_admin import firestore

from ..core.firebase import initialize_firebase
from ..schemas.chat import ChatMessage, ChatConversation
from ..constants.chat_config import ChatConfig

logger = logging.getLogger(__name__)


class ChatStorageError(Exception):
    """Exception raised for chat storage errors."""

    pass


class ChatStorageService:
    """Service for managing chat history in Firebase Firestore."""

    def __init__(self):
        """Initialize the chat storage service."""
        self._db = None

    @property
    def db(self):
        """Lazy initialization of Firestore client."""
        if self._db is None:
            self._initialize_firebase()
        return self._db

    def _initialize_firebase(self):
        """Initialize Firebase Firestore client."""
        try:
            # Initialize Firebase if not already done
            if not firebase_admin._apps:
                initialize_firebase()

            self._db = firestore.client()
            logger.info("Firebase Firestore client initialized for chat storage")

        except Exception as e:
            logger.error(f"Failed to initialize Firebase for chat storage: {e}")
            raise ChatStorageError(f"Failed to initialize Firebase: {str(e)}")

    def create_conversation(
        self, username: str, ip_address: str, user_id: Optional[str] = None
    ) -> str:
        """
        Create a new conversation with a unique ID.

        Args:
            username: Portfolio username being viewed
            ip_address: IP address of the requester
            user_id: Optional Firebase UID if authenticated

        Returns:
            str: The unique conversation ID

        Raises:
            ChatStorageError: If conversation creation fails
        """
        try:
            # Create new conversation document
            conversation_ref = self.db.collection(
                ChatConfig.CHAT_COLLECTION_NAME
            ).document()
            conversation_id = conversation_ref.id

            conversation_data = {
                "id": conversation_id,
                "username": username,
                "messages": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "ip_address": ip_address,
                "user_id": user_id,
            }

            conversation_ref.set(conversation_data)
            logger.info(
                f"Created new conversation {conversation_id} for username {username}"
            )

            return conversation_id

        except Exception as e:
            logger.error(f"Failed to create conversation: {e}")
            raise ChatStorageError(f"Failed to create conversation: {str(e)}")

    def store_message(
        self,
        conversation_id: str,
        message: ChatMessage,
        username: str,
        ip_address: str,
        user_id: Optional[str] = None,
    ) -> None:
        """
        Store a chat message in an existing conversation.

        Args:
            conversation_id: The conversation ID
            message: The chat message to store
            username: Portfolio username being viewed
            ip_address: IP address of the requester
            user_id: Optional Firebase UID if authenticated

        Raises:
            ChatStorageError: If message storage fails
        """
        try:
            conversation_ref = self.db.collection(
                ChatConfig.CHAT_COLLECTION_NAME
            ).document(conversation_id)

            # Check if conversation exists
            conversation_doc = conversation_ref.get()

            if not conversation_doc.exists:
                # Create new conversation if it doesn't exist
                logger.info(
                    f"Conversation {conversation_id} not found, creating new one"
                )
                conversation_data = {
                    "id": conversation_id,
                    "username": username,
                    "messages": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "ip_address": ip_address,
                    "user_id": user_id,
                }
                conversation_ref.set(conversation_data)

            # Convert message to dict for storage
            message_dict = message.model_dump()
            # Convert datetime to timestamp for Firestore
            if isinstance(message_dict.get("timestamp"), datetime):
                message_dict["timestamp"] = message_dict["timestamp"]

            # Append message to conversation
            conversation_ref.update(
                {
                    "messages": firestore.ArrayUnion([message_dict]),
                    "updated_at": datetime.utcnow(),
                }
            )

            logger.info(
                f"Stored {message.role} message in conversation {conversation_id}"
            )

        except Exception as e:
            logger.error(f"Failed to store message: {e}")
            raise ChatStorageError(f"Failed to store message: {str(e)}")

    def get_conversation(self, conversation_id: str) -> Optional[ChatConversation]:
        """
        Retrieve a complete conversation by ID.

        Args:
            conversation_id: The conversation ID to retrieve

        Returns:
            Optional[ChatConversation]: The conversation if found, None otherwise

        Raises:
            ChatStorageError: If retrieval fails
        """
        try:
            conversation_ref = self.db.collection(
                ChatConfig.CHAT_COLLECTION_NAME
            ).document(conversation_id)
            conversation_doc = conversation_ref.get()

            if not conversation_doc.exists:
                logger.warning(f"Conversation {conversation_id} not found")
                return None

            data = conversation_doc.to_dict()

            # Convert message dicts back to ChatMessage objects
            messages = []
            for msg_dict in data.get("messages", []):
                messages.append(ChatMessage(**msg_dict))

            # Create ChatConversation object
            conversation = ChatConversation(
                id=data["id"],
                username=data["username"],
                messages=messages,
                created_at=data["created_at"],
                updated_at=data["updated_at"],
                ip_address=data["ip_address"],
                user_id=data.get("user_id"),
            )

            return conversation

        except Exception as e:
            logger.error(f"Failed to retrieve conversation {conversation_id}: {e}")
            raise ChatStorageError(f"Failed to retrieve conversation: {str(e)}")

    def get_recent_messages(
        self, conversation_id: str, limit: int = ChatConfig.MAX_CONVERSATION_HISTORY
    ) -> List[ChatMessage]:
        """
        Retrieve the last N messages from a conversation for context.

        Args:
            conversation_id: The conversation ID
            limit: Maximum number of messages to retrieve (default from config)

        Returns:
            List[ChatMessage]: List of recent messages, empty list if conversation not found

        Raises:
            ChatStorageError: If retrieval fails
        """
        try:
            conversation = self.get_conversation(conversation_id)

            if not conversation:
                logger.warning(
                    f"Conversation {conversation_id} not found, returning empty history"
                )
                return []

            # Return the last N messages
            messages = conversation.messages[-limit:] if conversation.messages else []

            logger.info(
                f"Retrieved {len(messages)} recent messages from conversation {conversation_id}"
            )

            return messages

        except Exception as e:
            logger.error(
                f"Failed to retrieve recent messages from conversation {conversation_id}: {e}"
            )
            raise ChatStorageError(f"Failed to retrieve recent messages: {str(e)}")

    def update_conversation_timestamp(self, conversation_id: str) -> None:
        """
        Update the last updated timestamp for a conversation.

        Args:
            conversation_id: The conversation ID to update

        Raises:
            ChatStorageError: If update fails
        """
        try:
            conversation_ref = self.db.collection(
                ChatConfig.CHAT_COLLECTION_NAME
            ).document(conversation_id)

            # Check if conversation exists
            if not conversation_ref.get().exists:
                logger.warning(
                    f"Conversation {conversation_id} not found, cannot update timestamp"
                )
                return

            conversation_ref.update({"updated_at": datetime.utcnow()})

            logger.debug(f"Updated timestamp for conversation {conversation_id}")

        except Exception as e:
            logger.error(
                f"Failed to update timestamp for conversation {conversation_id}: {e}"
            )
            raise ChatStorageError(f"Failed to update conversation timestamp: {str(e)}")

    def conversation_exists(self, conversation_id: str) -> bool:
        """
        Check if a conversation exists.

        Args:
            conversation_id: The conversation ID to check

        Returns:
            bool: True if conversation exists, False otherwise
        """
        try:
            conversation_ref = self.db.collection(
                ChatConfig.CHAT_COLLECTION_NAME
            ).document(conversation_id)
            return conversation_ref.get().exists

        except Exception as e:
            logger.error(
                f"Failed to check if conversation {conversation_id} exists: {e}"
            )
            return False

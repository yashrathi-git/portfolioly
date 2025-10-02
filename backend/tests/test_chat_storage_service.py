"""
Tests for chat storage service.

These tests verify the chat storage service functionality with mocked Firebase.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime

from app.services.chat_storage_service import ChatStorageService, ChatStorageError
from app.schemas.chat import ChatMessage, ChatConversation


@pytest.fixture
def mock_firestore():
    """Mock Firestore client."""
    with patch("app.services.chat_storage_service.firestore") as mock_fs:
        yield mock_fs


@pytest.fixture
def mock_firebase_admin():
    """Mock Firebase admin."""
    with patch("app.services.chat_storage_service.firebase_admin") as mock_admin:
        mock_admin._apps = {"default": Mock()}
        yield mock_admin


@pytest.fixture
def chat_service(mock_firestore, mock_firebase_admin):
    """Create chat storage service with mocked dependencies."""
    service = ChatStorageService()
    service._db = Mock()
    return service


def test_create_conversation(chat_service):
    """Test creating a new conversation."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc_ref.id = "test-conversation-id"
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute
    conversation_id = chat_service.create_conversation(
        username="testuser", ip_address="127.0.0.1", user_id="user123"
    )

    # Assert
    assert conversation_id == "test-conversation-id"
    mock_doc_ref.set.assert_called_once()
    call_args = mock_doc_ref.set.call_args[0][0]
    assert call_args["username"] == "testuser"
    assert call_args["ip_address"] == "127.0.0.1"
    assert call_args["user_id"] == "user123"
    assert call_args["messages"] == []


def test_store_message_new_conversation(chat_service):
    """Test storing a message creates conversation if it doesn't exist."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = False
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    message = ChatMessage(role="user", content="Hello!")

    # Execute
    chat_service.store_message(
        conversation_id="new-conv-id",
        message=message,
        username="testuser",
        ip_address="127.0.0.1",
    )

    # Assert
    mock_doc_ref.set.assert_called_once()  # Creates new conversation
    mock_doc_ref.update.assert_called_once()  # Adds message


def test_store_message_existing_conversation(chat_service, mock_firestore):
    """Test storing a message in existing conversation."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    message = ChatMessage(role="assistant", content="Hi there!")

    # Execute
    chat_service.store_message(
        conversation_id="existing-conv-id",
        message=message,
        username="testuser",
        ip_address="127.0.0.1",
    )

    # Assert
    mock_doc_ref.set.assert_not_called()  # Doesn't create new conversation
    mock_doc_ref.update.assert_called_once()  # Only updates with message


def test_get_conversation_exists(chat_service):
    """Test retrieving an existing conversation."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "id": "conv-123",
        "username": "testuser",
        "messages": [
            {
                "id": "msg-1",
                "role": "user",
                "content": "Hello",
                "timestamp": datetime.utcnow(),
            }
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "ip_address": "127.0.0.1",
        "user_id": "user123",
    }
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute
    conversation = chat_service.get_conversation("conv-123")

    # Assert
    assert conversation is not None
    assert conversation.id == "conv-123"
    assert conversation.username == "testuser"
    assert len(conversation.messages) == 1
    assert conversation.messages[0].content == "Hello"


def test_get_conversation_not_found(chat_service):
    """Test retrieving a non-existent conversation."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = False
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute
    conversation = chat_service.get_conversation("nonexistent-id")

    # Assert
    assert conversation is None


def test_get_recent_messages(chat_service):
    """Test retrieving recent messages from a conversation."""
    # Setup
    messages = [ChatMessage(role="user", content=f"Message {i}") for i in range(15)]
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "id": "conv-123",
        "username": "testuser",
        "messages": [msg.model_dump() for msg in messages],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "ip_address": "127.0.0.1",
    }
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute
    recent_messages = chat_service.get_recent_messages("conv-123", limit=10)

    # Assert
    assert len(recent_messages) == 10
    assert recent_messages[0].content == "Message 5"  # Last 10 messages
    assert recent_messages[-1].content == "Message 14"


def test_get_recent_messages_conversation_not_found(chat_service):
    """Test retrieving messages from non-existent conversation returns empty list."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = False
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute
    recent_messages = chat_service.get_recent_messages("nonexistent-id")

    # Assert
    assert recent_messages == []


def test_update_conversation_timestamp(chat_service):
    """Test updating conversation timestamp."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute
    chat_service.update_conversation_timestamp("conv-123")

    # Assert
    mock_doc_ref.update.assert_called_once()
    call_args = mock_doc_ref.update.call_args[0][0]
    assert "updated_at" in call_args


def test_update_conversation_timestamp_not_found(chat_service):
    """Test updating timestamp for non-existent conversation."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = False
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute (should not raise error)
    chat_service.update_conversation_timestamp("nonexistent-id")

    # Assert
    mock_doc_ref.update.assert_not_called()


def test_conversation_exists(chat_service):
    """Test checking if conversation exists."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = True
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute
    exists = chat_service.conversation_exists("conv-123")

    # Assert
    assert exists is True


def test_conversation_not_exists(chat_service):
    """Test checking if conversation doesn't exist."""
    # Setup
    mock_doc_ref = Mock()
    mock_doc = Mock()
    mock_doc.exists = False
    mock_doc_ref.get.return_value = mock_doc
    chat_service._db.collection.return_value.document.return_value = mock_doc_ref

    # Execute
    exists = chat_service.conversation_exists("nonexistent-id")

    # Assert
    assert exists is False

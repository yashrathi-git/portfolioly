# Implementation Plan

## Overview

This implementation plan breaks down the AI-powered portfolio chat feature into discrete, manageable coding tasks. Each task builds incrementally on previous work, following test-driven development principles where appropriate. Also NOTE that all the generated response should be streamed to the frontend.

**Development Tools:**

- Backend: Use `uv` for Python package management and running tests (`uv run pytest`)
- Frontend: Use `yarn` for JavaScript/TypeScript package management
- Testing: Backend integration tests only (mock all external services), no frontend tests required

## Tasks

- [x] 1. Set up backend infrastructure and data models

  - Create chat configuration constants
  - Define Pydantic schemas for chat data
  - Extend user settings schema with chat settings
  - _Requirements: 3, 4, 5, 7_

- [x] 1.1 Create chat configuration constants

  - Create `backend/app/constants/chat_config.py`
  - Define `ChatConfig` class with rate limiting, validation, AI processing, and storage constants
  - Include supported widget types and default access mode
  - _Requirements: 3, 7_

- [x] 1.2 Create chat data schemas

  - Create `backend/app/schemas/chat.py`
  - Define `ToolCall` model with widget type, indices, and explanation
  - Define `ChatMessage` model with role, content, timestamp, and tool_calls
  - Define `ChatConversation` model with username, messages, IP address, and timestamps
  - Define `ChatRequest` and `ChatResponse` models for API
  - _Requirements: 1, 4, 6, 8_

- [x] 1.3 Extend user settings schema

  - Update `backend/app/schemas/user_settings.py`
  - Add `PortfolioChatSettings` model with access_mode, monthly_message_count, and limits
  - Extend `UserSettings` to include optional `chat_settings` field
  - _Requirements: 3, 7_

- [x] 2. Implement chat storage service

  - Create service for managing chat history in Firebase
  - Implement conversation threading and retrieval
  - _Requirements: 4, 8_

- [x] 2.1 Create chat storage service

  - Create `backend/app/services/chat_storage_service.py` using `uv`
  - Implement `ChatStorageService` class with Firebase Firestore integration
  - Add method to store chat messages with conversation threading
  - Add method to retrieve conversation history by conversation_id
  - Include IP address and timestamp tracking
  - Note: Conversations are logged permanently, no auto-cleanup needed
  - _Requirements: 4, 8_

- [x] 2.2 Implement conversation management

  - Add method to create new conversations with unique IDs
  - Add method to retrieve last N messages for context
  - Add method to update conversation timestamps
  - Handle missing or invalid conversation IDs gracefully
  - _Requirements: 8_

- [x] 3. Implement portfolio access control dependency

  - Create reusable FastAPI dependency for checking portfolio access
  - Integrate with Firebase user settings
  - Handle authentication verification
  - _Requirements: 7_

- [x] 3.1 Create portfolio access control dependency

  - Create `backend/app/dependencies/portfolio_access.py`
  - Implement `check_portfolio_access` function as FastAPI dependency
  - Fetch user settings from Firebase to check access_mode
  - If private: verify Bearer token and match user to portfolio owner
  - If public: allow unauthenticated requests
  - Return portfolio owner's user_id for usage tracking
  - Raise HTTP 403 for access denied
  - _Requirements: 7_

- [x] 4. Implement chat rate limiting

  - Create IP-based rate limiting with memory management
  - Implement portfolio owner usage tracking
  - Add token count validation
  - _Requirements: 3_

- [x] 4.1 Create chat rate limiting dependencies

  - Create `backend/app/dependencies/chat_rate_limiting.py`
  - Extend existing `RateLimiter` service for chat-specific limits
  - Implement IP-based rate limiting (50 requests/hour per IP)
  - Use in-memory/Redis storage with automatic cleanup of expired records
  - Return HTTP 429 with retry-after headers when exceeded
  - _Requirements: 3_

- [x] 4.2 Implement portfolio owner usage tracking

  - Add function to track monthly message count per portfolio owner (backend only, no UI)
  - Store in Firebase user_settings collection
  - Increment counter for each chat message received
  - Enforce monthly limit (100 messages default)
  - Auto-reset counters at month boundaries
  - Use `uv` for backend development
  - _Requirements: 3, 4_

- [x] 4.3 Add input validation

  - Implement token counting using tiktoken for user input (max 60 tokens)
  - Add system prompt size validation (max 2000 tokens)
  - Return clear error messages for validation failures
  - _Requirements: 3_

- [x] 5. Implement AI chat service

  - Create service for LLM integration with tool calling
  - Define system prompt and tool schemas
  - Handle conversation context
  - _Requirements: 1, 5, 6, 8, 9_

- [x] 5.1 Create AI chat service class

  - Create `backend/app/services/ai_chat_service.py`
  - Implement `AIChatService` class extending `AIProcessor` patterns
  - Initialize Azure AI client with grok-3-mini model
  - Reuse token counting and encoding from `AIProcessor`
  - _Requirements: 1, 5_

- [x] 5.2 Define tool calling schema

  - Define `WIDGET_RENDER_TOOL` function schema for LLM
  - Include widget type enum (about, projects, skills, contact, experience, education)
  - Add optional indices parameter for filtering specific items
  - Add optional explanation parameter for context
  - _Requirements: 1, 6_

- [x] 5.3 Implement system prompt

  - Create system prompt template focusing on portfolio owner's work
  - Include guidelines for warm, professional, and engaging tone
  - Add instructions for handling general and off-topic questions
  - Include portfolio data in prompt context
  - Store prompt in backend code (not exposed to frontend)
  - _Requirements: 5, 9_

- [x] 5.4 Implement chat processing method

  - Add method to process user queries with portfolio context
  - Include conversation history in LLM context (last 10 messages)
  - Make LLM API call with tool calling enabled
  - Parse response to extract text content and tool calls
  - Handle errors and provide fallback responses
  - _Requirements: 1, 5, 8_

- [x] 5.5 Implement tool call parsing

  - Parse LLM response to extract tool calls
  - Validate tool call structure and parameters
  - Convert to `ToolCall` Pydantic models
  - Handle multiple tool calls in single response
  - _Requirements: 1, 6_

- [x] 6. Create chat API endpoint

  - Implement POST endpoint for chat
  - Integrate all services and dependencies
  - Handle errors gracefully
  - _Requirements: 1, 2, 3, 4, 7, 8_

- [x] 6.1 Create chat route

  - Create `backend/app/routes/chat.py`
  - Implement `POST /api/chat/{username}` endpoint
  - Use `check_portfolio_access` dependency for access control
  - Apply IP-based rate limiting dependency
  - Accept `ChatRequest` with message and optional conversation_id
  - _Requirements: 1, 3, 7_

- [x] 6.2 Implement chat endpoint logic

  - Fetch portfolio data for specified username
  - Validate user input token count
  - Retrieve conversation history if conversation_id provided
  - Call `AIChatService` to process query
  - Store chat message and response in Firebase
  - Increment portfolio owner's monthly message counter
  - Return `ChatResponse` with content, tool_calls, and conversation_id
  - _Requirements: 1, 3, 4, 5, 8_

- [x] 6.3 Add error handling

  - Handle portfolio not found errors
  - Handle rate limit exceeded errors
  - Handle AI service failures with fallback responses
  - Handle validation errors
  - Return structured error responses
  - _Requirements: 2_

- [x] 7. Update frontend chat types

  - Extend existing Message type for tool calls
  - Add API request/response types
  - _Requirements: 1, 6_

- [x] 7.1 Update chat types

  - Update `packages/template-components/src/components/chat/types.ts` using `yarn`
  - Extend `Message` type to support tool_calls array
  - Add `ToolCall` type with widget, indices, and explanation
  - Add `ChatRequest` type with message and conversation_id
  - Add `ChatResponse` type with content, tool_calls, and conversation_id
  - _Requirements: 1, 6_

- [x] 8. Integrate chat API with frontend

  - Replace keyword matching with API calls
  - Handle tool call responses
  - Manage conversation state
  - _Requirements: 1, 2, 8_

- [x] 8.1 Update ChatPortfolio component

  - Update `packages/template-components/src/components/ChatPortfolio.tsx` using `yarn`
  - Replace `chooseWidget` function with API call to `/api/chat/{username}`
  - Add state for conversation_id tracking
  - Send conversation_id with subsequent messages
  - Handle loading states during API calls
  - _Requirements: 1, 2, 8_

- [x] 8.2 Handle API responses

  - Parse `ChatResponse` to extract content and tool_calls
  - Render text content as chat messages
  - Convert tool_calls to widget messages
  - Handle multiple tool calls in order
  - Maintain existing animation and styling
  - _Requirements: 1, 2, 6_

- [x] 8.3 Add error handling

  - Display user-friendly error messages in chat
  - Handle network failures with retry option
  - Handle rate limit errors with clear messaging
  - Fallback to static suggestions when API unavailable
  - _Requirements: 2_

- [x] 9. Update Thread component for tool calls

  - Enhance message rendering for tool calls
  - Support indices-based filtering
  - _Requirements: 1, 6_

- [x] 9.1 Update Thread component

  - Update `packages/template-components/src/components/chat/Thread.tsx` using `yarn`
  - Handle messages with tool_calls array
  - Render multiple widgets from tool_calls
  - Support indices parameter for filtering widget items
  - Render explanation text alongside widgets
  - Maintain existing animations and styling
  - _Requirements: 1, 6_

- [ ] 10. Backend integration testing

  - Test end-to-end chat flow with mocked external services
  - Test access control and rate limiting
  - Test conversation context
  - Note: Frontend tests not required, manual testing sufficient
  - _Requirements: All_

- [ ] 10.1 Test chat API endpoint

  - Use `uv run pytest` for backend tests
  - Mock Firebase, Azure AI, and external services
  - Test public portfolio access (unauthenticated)
  - Test private portfolio access (authenticated)
  - Test access denied for private portfolios
  - Test IP-based rate limiting enforcement
  - Test portfolio owner usage tracking
  - Test conversation threading and context retrieval
  - Verify all tests pass before completion
  - _Requirements: 1, 3, 7, 8_

- [ ] 10.2 Test AI service

  - Use `uv run pytest` with mocked Azure AI responses
  - Test tool call generation with different query types
  - Test indices parameter handling (all items, specific items)
  - Test conversation context with follow-up questions
  - Test token limit enforcement
  - Test error handling and fallback responses
  - Verify all tests pass before completion
  - _Requirements: 1, 5, 6, 8, 9_

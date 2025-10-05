---
inclusion: always
---

# AI-Powered Portfolio Chat System

## Overview

The chat system enables visitors to interact with portfolios through natural language conversations. The AI assistant answers questions about projects, skills, experience, and other portfolio content, using tool calling to dynamically render relevant portfolio widgets.

## Architecture

### Backend (`backend/app/`)

**Core Service**: `services/ai_chat_service.py`

- `AIChatService`: Main service handling LLM integration with Azure AI
- Manages conversation context, streaming responses, and tool calling
- Uses `grok-3-mini` model via Azure AI Inference SDK
- Token counting with tiktoken (`cl100k_base` encoding)

**API Endpoint**: `routes/public_portfolio.py`

- `POST /public/chat/{username}`: Main chat endpoint
- Authentication: Public token (Bearer `psk_xxx...`)
- Returns Server-Sent Events (SSE) stream for real-time responses
- Rate limiting: 50 requests/hour per IP, 100 messages/month per portfolio owner

**Storage**: `services/chat_storage_service.py`

- `ChatStorageService`: Manages conversation persistence in Firestore
- Collection: `portfolio_chats`
- Stores conversation history, user messages, and assistant responses
- 30-day TTL for conversations

**Configuration**: `constants/chat_config.py`

- Model settings, rate limits, token limits
- Supported widgets: `about`, `projects`, `skills`, `contact`, `experience`, `education`
- Max conversation history: 10 messages
- Max response tokens: 500

**Rate Limiting**: `dependencies/chat_rate_limiting.py`

- IP-based rate limiting (50 requests/hour)
- Portfolio owner usage tracking (100 messages/month)
- Input validation (max 60 tokens per user message)

**Schemas**: `schemas/chat.py`

- `ChatRequest`: User message + optional conversation_id
- `ChatResponse`: Assistant content + tool calls + conversation_id
- `ChatMessage`: Individual message with role, content, timestamp, tool_calls
- `ToolCall`: Widget render instructions with type, widget name, indices, explanation

### Frontend

**Main Component**: `packages/template-components/src/components/ChatPortfolio.tsx`

- Manages chat UI, message state, and API communication
- Handles SSE streaming from backend
- Falls back to keyword matching when API unavailable
- Props: `username`, `apiBaseUrl`, `publicToken`, `portfolioData`

**Message Thread**: `packages/template-components/src/components/chat/Thread.tsx`

- Renders conversation messages
- Dynamically renders widgets based on tool calls
- Maps tool calls to widget components using `prepareWidgetData()`
- Supports both legacy widget format and new tool call format

**Input**: `packages/template-components/src/components/chat/Composer.tsx`

- Text input with submit button
- Enter to send, Shift+Enter for new line

**Widgets**: `packages/template-components/src/components/widgets/`

- `AboutWidget`, `ProjectsWidget`, `SkillsWidget`, `ContactWidget`
- `WorkExperienceWidget`, `EducationWidget`
- Each widget receives prepared data from portfolio

## Tool Calling Flow

### 1. Tool Definition (Backend)

The AI service defines a tool for rendering portfolio widgets:

```python
WIDGET_RENDER_TOOL = ChatCompletionsToolDefinition(
    function=FunctionDefinition(
        name="render_portfolio_widget",
        description="Render a specific portfolio widget...",
        parameters={
            "widget": {"enum": ["about", "projects", "skills", ...]},
            "indices": {"type": "array", "items": {"type": "integer"}},
            "explanation": {"type": "string"}
        }
    )
)
```

### 2. LLM Decision (Backend)

When processing a user message:

- System prompt includes full portfolio context
- LLM decides whether to call tools based on user question
- Can call multiple tools in one response
- Tool choice: `"auto"` (LLM decides when to use tools)

### 3. Streaming Response (Backend → Frontend)

SSE stream sends chunks with different types:

- `{type: "content", data: "text chunk"}` - Text response
- `{type: "tool_call", data: {widget, indices, explanation}}` - Widget to render
- `{type: "done", data: {conversation_id}}` - Stream complete
- `{type: "error", data: "error message"}` - Error occurred

### 4. Widget Rendering (Frontend)

Frontend receives tool calls and:

1. Extracts widget type and parameters from tool call
2. Calls `prepareWidgetData()` to map portfolio data to widget props
3. Renders appropriate widget component with filtered data
4. Supports `indices` parameter to show specific items (e.g., first 2 projects)

## Prompt Engineering

### System Prompt Structure

Generated in `_create_system_prompt()`:

1. **Role Definition**: AI assistant for portfolio owner
2. **Portfolio Context**: Comprehensive summary via `_build_portfolio_summary()`
3. **Guidelines**: Tone, response length, tool usage rules
4. **Question Handling**: Specific vs general questions, off-topic handling
5. **Tool Usage Instructions**: When and how to call widgets

### Portfolio Summary Generation

`_build_portfolio_summary()` creates detailed context including:

- Personal information (name, email, phone, location)
- Work experience (title, organization, dates, technologies)
- Projects, education, certifications (currently commented out to reduce token usage)
- Skills and profiles

**Note**: Some sections are commented out to stay within token limits. This is a known optimization area - the schema should be used more efficiently to include all relevant data without exceeding limits.

### Conversation Context

Messages prepared in `_prepare_conversation_messages()`:

- System prompt with portfolio context
- Last 10 messages from conversation history
- Current user message
- Previous tool calls preserved in history

## Data Flow

### User Message → AI Response

1. **Frontend**: User types message, clicks send
2. **Frontend**: POST to `/public/chat/{username}` with public token
3. **Backend**: Validate token, check rate limits, fetch portfolio data
4. **Backend**: Load conversation history from Firestore
5. **Backend**: Store user message in Firestore
6. **Backend**: Build system prompt with portfolio context
7. **Backend**: Call Azure AI with streaming enabled
8. **Backend**: Stream SSE chunks to frontend
9. **Frontend**: Accumulate content, collect tool calls
10. **Frontend**: Render text + widgets when stream completes
11. **Backend**: Store assistant response in Firestore
12. **Backend**: Increment usage counters

### Error Handling

- Network errors: Show retry button
- Rate limits: Display retry-after time
- 404: Portfolio not found
- 403: Chat access denied (private portfolio)
- 500: Service unavailable

## Key Implementation Details

### Token Management

- User input: Max 60 tokens (validated before processing)
- System prompt: Max 2000 tokens (portfolio summary must fit)
- Response: Max 500 tokens
- Encoding: `cl100k_base` (tiktoken)

### Rate Limiting Strategy

Two-tier approach:

1. **IP-based**: Prevents abuse from single source (50/hour)
2. **Owner-based**: Controls costs per portfolio (100/month)

Both use Redis-backed rate limiter with sliding window.

### Authentication

- Public token required: `psk_xxx...`
- Token validated against username in user settings
- No user authentication needed for public portfolios
- Private portfolios require matching token

### Conversation Persistence

- Each conversation has unique ID
- Messages stored with timestamps
- Conversation metadata: username, IP, user_id (if authenticated)
- 30-day TTL for automatic cleanup

## Known Issues & Optimization Areas

1. **Portfolio Summary Token Usage**: Some sections (projects, education, certifications) are commented out in `_build_portfolio_summary()` to avoid exceeding token limits. Need better schema utilization to include all data efficiently.

2. **Tool Call Schema**: The current implementation works but could be optimized to pass more structured data through tool calls rather than relying entirely on the system prompt.

3. **Conversation History**: Currently limited to 10 messages. Could implement smarter context window management with summarization.

## Development Guidelines

### Adding New Widgets

1. Define widget in `ChatConfig.SUPPORTED_WIDGETS`
2. Add widget case in `prepareWidgetData()` (frontend)
3. Add widget rendering in `Thread.tsx`
4. Update tool definition description if needed

### Modifying System Prompt

Edit `_create_system_prompt()` and `_build_portfolio_summary()` in `ai_chat_service.py`. Be mindful of token limits.

### Testing Chat Functionality

- Use `backend/tests/test_chat_rate_limiting.py` for rate limiting
- Test streaming with real Azure AI endpoint
- Verify tool calls render correct widgets
- Check conversation persistence in Firestore

### Debugging

- Backend logs: Check `logger` output in `ai_chat_service.py`
- Frontend: Console logs show SSE chunks and tool calls
- Firestore: Inspect `portfolio_chats` collection for stored conversations

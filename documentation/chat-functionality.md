---
inclusion: always
---

# AI-Powered Portfolio Chat System

## Overview

The chat system enables visitors to interact with portfolios through natural language conversations. The AI assistant answers questions about projects, skills, experience, and other portfolio content. Streaming uses command delimiters (e.g., `<<<WIDGET:projects>>>`, `<<<MSG_BREAK>>>`) that get parsed into separate chat bubbles and widget components.

## Architecture

### Backend (`backend/app/`)

**Core Service**: `services/ai_chat_service.py`

- `AIChatService`: Handles OpenAI streaming and command delimiter parsing
- Uses `openai.AsyncAzureOpenAI` for stable async streaming with Azure endpoints
- Parses delimiters during streaming and emits them as separate `cmd` events
- Character-based limits for fast validation
- Real-time streaming with word-boundary awareness for smooth UX

**Prompt Builder**: `services/chat_prompt_builder.py`

- Builds structured system prompt from `schemas/portfolio.PortfolioData`
- Includes personal info, work experience, projects, education, certifications, skills, profiles
- Uses constants from `constants/chat_delimiters.py` for all delimiter documentation
- Documents delimiter usage: `<<<WIDGET:name>>>`, `<<<WIDGET:name:0,1>>>`, `<<<MSG_BREAK>>>`
- Instructs LLM to be concise and place widgets at the end of text

**Delimiters Configuration**: `constants/chat_delimiters.py`

- `ChatDelimiters`: Centralized constants for all delimiter strings
- Widget delimiters: `WIDGET_ABOUT`, `WIDGET_PROJECTS`, etc.
- Control delimiters: `MSG_BREAK` for splitting chat bubbles
- SSE event type constants: `EVENT_CONTENT`, `EVENT_CMD`, `EVENT_DONE`, `EVENT_ERROR`
- Helper methods for generating widget delimiters with indices

**API Route**: `routes/public_portfolio_chat.py`

- `POST /public/chat/{username}`: Main chat endpoint (SSE)
- Orchestrates auth/rate limits, loads portfolio + conversation, proxies stream
- Emits SSE events: `content`, `cmd`, `done`, `error`

**Storage**: `services/chat_storage_service.py`

- Persists conversations/messages in Firestore (`portfolio_chats`)
- Stores assistant text + any widget calls as part of history

**Configuration**: `constants/chat_config.py`

- Model settings, supported widgets, response caps
- Char limits: input/system prompt/tool arguments
- Rate limiting settings

**Delimiters**: `constants/chat_delimiters.py`

- All delimiter string constants (widgets, message breaks)
- SSE event type constants
- Helper functions for delimiter generation

**Rate Limiting & Validation**: `dependencies/chat_rate_limiting.py`

- IP + portfolio-owner usage limits
- Character-based input validation for speed

**Schemas**: `schemas/chat.py`, `schemas/portfolio.py`

- `ChatRequest`, `ChatMessage`, and `ToolCall` define request/stream payloads
- `PortfolioData` is the canonical context schema used by the prompt builder

### Frontend

**Main Component**: `packages/template-components/src/components/ChatPortfolio.tsx`

- Manages chat UI and SSE
- Robust stream parser with line buffering
- Parses `cmd` events to create separate message bubbles or widget components
- Simple, user-friendly error handling

**Thread Rendering**: `packages/template-components/src/components/chat/Thread.tsx`

- Maps `ToolCall` to components using `prepareWidgetData()`
- Supports indices to focus specific items

**Widgets**: `packages/template-components/src/components/widgets/`

- `AboutWidget`, `ProjectsWidget`, `SkillsWidget`, `ContactWidget`, `WorkExperienceWidget`, `EducationWidget`

## Streaming & Widget Flow

### 1. Backend streaming

- System prompt includes full portfolio context and delimiter instructions (from constants)
- OpenAI client streams text chunks; backend scans for delimiters in real-time
- When delimiter found: emits preceding text as `content`, then delimiter as `cmd`
- Word-boundary detection prevents breaking words during streaming
- Finally emits `{type:"done"}` with conversation ID

### 2. Frontend rendering

- Accumulates `content` chunks into current message bubble
- On `cmd` event:
  - `MSG_BREAK`: Finalizes current bubble, starts new one
  - `WIDGET:name` or `WIDGET:name:0,1`: Finalizes current bubble, creates widget message
- Each command creates a separate visual element

## Command Delimiters

### Widget Commands

- `<<<WIDGET:about>>>` - Show about/personal info
- `<<<WIDGET:projects>>>` - Show all projects
- `<<<WIDGET:projects:0,1>>>` - Show projects at indices 0 and 1
- `<<<WIDGET:skills>>>` - Show skills
- `<<<WIDGET:contact>>>` - Show contact info
- `<<<WIDGET:experience>>>` - Show work experience
- `<<<WIDGET:education>>>` - Show education

### Message Break

- `<<<MSG_BREAK>>>` - Split into separate message bubbles

### Example Flow

LLM outputs:

```
Hi, I'm Yash Rathi. Here are my experiences:
<<<WIDGET:experience>>>
And here are my projects:
<<<WIDGET:projects>>>
```

Frontend renders:

1. Bubble: "Hi, I'm Yash Rathi. Here are my experiences:"
2. Experience widget component
3. Bubble: "And here are my projects:"
4. Projects widget component

## Prompt Engineering

### System Prompt Structure

Generated in `chat_prompt_builder.build_system_prompt()`:

1. **Role Definition**: AI assistant for portfolio owner
2. **Portfolio Context**: Comprehensive summary from `PortfolioData`
3. **Response Guidelines**: Be concise, answer only what's asked, use simple language
4. **Widget Commands**: Available delimiters and usage rules
5. **Widget Placement Rules**: Always place at END of text, never inline
6. **Message Splitting**: Use MSG_BREAK for digestible responses

### Portfolio Summary

Prompt builder creates detailed context including:

- Personal information (name, email, phone, location, summary)
- Work experience (role, organization, dates, technologies, highlights)
- Projects (name, role, description, technologies, links)
- Education (degree, institution, dates, location, grade)
- Certifications (name, issuer, date, credential)
- Skills and social profiles
- Additional text blobs

### Conversation Context

Messages prepared in `_prepare_conversation_messages()`:

- System prompt with portfolio context
- Last N messages from conversation history
- Current user message

## Data Flow

### User Message → AI Response

1. **Frontend**: User types message, clicks send
2. **Frontend**: POST to `/public/chat/{username}` with public token
3. **Backend**: Validate token, check rate limits, fetch portfolio data
4. **Backend**: Load conversation history from Firestore
5. **Backend**: Store user message in Firestore
6. **Backend**: Build system prompt with portfolio context
7. **Backend**: Call Azure AI with streaming enabled
8. **Backend**: Parse delimiters and stream SSE chunks (content/cmd/done/error)
9. **Frontend**: Accumulate content, process commands, create separate bubbles/widgets
10. **Backend**: Store assistant response in Firestore
11. **Backend**: Increment usage counters

### Error Handling

- Network errors: Show retry button
- Rate limits: Display retry-after time
- 404: Portfolio not found
- 403: Chat access denied (private portfolio)
- 500: Service unavailable

## Key Implementation Details

### SSE Event Types

- `content`: `{ type: "content", data: string }` - Text chunk
- `cmd`: `{ type: "cmd", data: string }` - Command delimiter (WIDGET:... or MSG_BREAK)
- `done`: `{ type: "done" }` - Stream complete
- `error`: `{ type: "error", data: string }` - Error occurred

### Limits

- User input: `ChatConfig.MAX_USER_INPUT_CHARS`
- System prompt: `ChatConfig.MAX_SYSTEM_PROMPT_CHARS`
- Tool arguments: `ChatConfig.MAX_TOOL_ARGUMENT_CHARS`
- Response: `ChatConfig.MAX_RESPONSE_TOKENS`

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

## Files That Are In Good Shape

- `backend/app/constants/chat_delimiters.py`: Centralized delimiter constants with helper methods
- `backend/app/services/ai_chat_service.py`: Clear lifecycle, robust OpenAI streaming, real-time delimiter parsing
- `backend/app/services/chat_prompt_builder.py`: Readable, modular prompt assembly using delimiter constants
- `backend/app/routes/public_portfolio_chat.py`: Focused SSE proxy with proper error handling and tool call parsing
- `packages/template-components/src/components/ChatPortfolio.tsx`: Solid SSE handling, command parsing, simple error UI
- `packages/template-components/src/components/chat/Thread.tsx`: Clean widget rendering pipeline with both legacy and tool call support

## Development Guidelines

### Adding New Widgets

1. Add widget constant to `ChatDelimiters` class in `constants/chat_delimiters.py`
2. Add widget name to `ChatDelimiters.SUPPORTED_WIDGETS` list
3. Update `ChatConfig.SUPPORTED_WIDGETS` in `constants/chat_config.py`
4. Add widget case in `prepareWidgetData()` (frontend `Thread.tsx`)
5. Add widget rendering in `Thread.tsx`
6. Prompt builder will automatically include the new delimiter in system prompt

### Modifying System Prompt

Edit `build_system_prompt()` in `chat_prompt_builder.py`. Be mindful of character limits.

### Testing Chat Functionality

- Use `backend/tests/test_chat_rate_limiting.py` for rate limiting
- Test streaming with real Azure AI endpoint
- Verify delimiters create correct bubbles/widgets
- Check conversation persistence in Firestore

### Debugging

- Backend logs: Check `logger` output in `ai_chat_service.py` (includes detailed streaming events)
- Frontend: Console logs show SSE chunks and commands
- Firestore: Inspect `portfolio_chats` collection for stored conversations
- Network tab: Inspect SSE events for proper streaming format
- Check delimiter constants if widgets not rendering properly

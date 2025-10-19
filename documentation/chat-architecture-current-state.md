# Chat Architecture - Current State

**Last Updated**: 2025-10-19  
**Status**: ✅ Simplified with Vercel AI SDK, streaming works reliably

## Overview

The chat system enables AI-powered conversations with portfolios using **Vercel AI SDK** for streaming. The backend sends text with widget delimiter strings (`<<<WIDGET:name>>>`), which the frontend parses client-side. This provides a clean separation: backend stores raw responses, frontend handles widget rendering.

**Key improvements from previous version**:

- Simplified from ~779 lines to ~322 lines in ChatPortfolio component
- Removed complex character animation and buffer management
- Uses proven Vercel AI SDK for reliable streaming
- No partial message issues
- Clean thinking state management

---

## Current Architecture

### Frontend Structure

```
packages/template-components/src/
├── utils/
│   └── parseMessageContent.ts  # Parse widget delimiters from text
├── components/
│   ├── ChatPortfolio.tsx        # Main chat UI component (~322 lines) ✨ Simplified
│   └── chat/
│       ├── Thread.tsx           # Message rendering (~320 lines) ✨ Simplified
│       ├── types.ts             # Type definitions (simplified)
│       ├── Header.tsx           # Chat header
│       ├── Composer.tsx         # Input component
│       ├── EmptyState.tsx       # Initial state
│       └── Suggestions.tsx      # Suggestion chips
└── widgets/                     # Widget components for chat
    ├── AboutWidget.tsx
    ├── ProjectsWidget.tsx
    ├── SkillsWidget.tsx
    ├── ContactWidget.tsx
    ├── WorkExperienceWidget.tsx
    └── EducationWidget.tsx
```

**Removed**:

- `services/chatService.ts` - Replaced by Vercel AI SDK's `useChat` hook

### Backend Structure

```
backend/app/
├── routes/
│   └── public_portfolio_chat.py  # Chat endpoint handler
├── services/
│   ├── ai_chat_service.py        # OpenAI streaming with delimiter parsing
│   └── chat_prompt_builder.py   # System prompt generation
└── constants/
    ├── chat_delimiters.py        # Delimiter constants
    └── chat_config.py            # Configuration
```

---

## Current Data Flow

### 1. Message Send Flow

```
User Input
  ↓
useChat hook (Vercel AI SDK)
  ↓
POST /public/chat/{username}
  ↓
Backend processes with OpenAI
  ↓
Vercel AI SDK Stream Protocol:
  - 0:"text chunk"  (text deltas, includes <<<WIDGET:name>>> as text)
  - e:{...}         (completion metadata)
  - d:{...}         (done signal with conversationId)
  ↓
Frontend: useChat accumulates message content
  ↓
Thread.tsx parses content to extract widgets
  ↓
Render text + widgets inline
```

### 2. Streaming State Management ✅ SIMPLIFIED

**Solution**: Vercel AI SDK handles all streaming state.

#### State Variables in ChatPortfolio.tsx

```typescript
// Simple state with useChat hook
const {
  messages: aiMessages, // Managed by AI SDK
  input, // Managed by AI SDK
  handleInputChange, // Provided by AI SDK
  handleSubmit: aiHandleSubmit, // Provided by AI SDK
  isLoading: aiIsLoading, // Managed by AI SDK
  error: aiError, // Managed by AI SDK
} = useChat({
  api: `${apiBaseUrl}/public/chat/${username}`,
  headers: { Authorization: `Bearer ${publicToken}` },
  body: { conversation_id: conversationId },
});

// Additional local state
const [conversationId, setConversationId] = useState<string | undefined>();
const [localInput, setLocalInput] = useState(""); // For suggestion handling
const listRef = useRef<HTMLDivElement>(null); // For auto-scroll
```

**Benefits**:

- No manual buffer management
- No animation intervals or refs
- Single source of truth for messages
- Automatic reconnection on network errors
- Built-in error handling

#### Animation Loop (Lines 270-317)

```typescript
useEffect(() => {
  if (typingIntervalRef.current) {
    clearInterval(typingIntervalRef.current);
  }

  if (!currentMessageId) {
    currentMessageIdRef.current = null;
    return;
  }

  currentMessageIdRef.current = currentMessageId;

  typingIntervalRef.current = setInterval(() => {
    const buffer = contentBufferRef.current;
    const displayed = displayedContentRef.current;

    if (buffer.length > displayed.length) {
      const remaining = buffer.length - displayed.length;
      const charsToAdd = remaining > 50 ? Math.min(10, remaining) : 1;
      const newDisplayed = buffer.slice(0, displayed.length + charsToAdd);
      displayedContentRef.current = newDisplayed;

      setMessages((prevMessages) => {
        const id = currentMessageIdRef.current;
        if (!id) return prevMessages;

        const msgIndex = prevMessages.findIndex((msg) => msg.id === id);
        if (msgIndex >= 0) {
          const updated = [...prevMessages];
          updated[msgIndex] = {
            ...updated[msgIndex],
            streamingContent: newDisplayed, // Temporary field
          };
          return updated;
        }
        return prevMessages;
      });
    }
  }, 20);

  return () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
  };
}, [currentMessageId]);
```

**Complexity Issues**:

- Updates messages array 50 times/second for character animation
- Searches for message by ID in every interval tick
- Uses both `streamingContent` and `content` fields on messages
- Heavy re-renders during streaming

---

## Current Issues & Root Causes

### Issue #1: Partial Message Response ⚠️

**Symptom**: Some content from backend doesn't appear in the UI, especially before widgets.

**Root Cause Analysis**:

1. **Buffer Clearing Too Early** (Lines 439-468, 487-518):

   ```typescript
   case "widget": {
     if (messageId) {
       // Fast-forward animation to completion
       const messageContent = contentBufferRef.current;
       displayedContentRef.current = messageContent;
       setDisplayedContent(messageContent);
       // ... update message ...
     }

     // Always finalize before creating widget
     messageId = null;
     setCurrentMessageId(null);
     currentMessageIdRef.current = null;
     contentBufferRef.current = "";  // ⚠️ CLEARED
     displayedContentRef.current = ""; // ⚠️ CLEARED
     // ...
   }
   ```

2. **Race Condition**: Animation loop might not have caught up to buffer before it's cleared

3. **Message ID Reset**: Setting `messageId = null` prevents further updates even if content arrives

**Why This Happens**:

- Backend emits: `[content chunks...] → WIDGET:projects → [more content...?]`
- Frontend clears all buffers on `WIDGET` command
- If animation hasn't finished, remaining characters are lost
- If backend sends more content after widget, no message exists to receive it

### Issue #2: Duplicate Message Tracking

**Symptom**: Same data tracked in multiple places.

```typescript
// Lines 67-72
const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
const currentMessageIdRef = useRef<string | null>(null); // Why both?
const [displayedContent, setDisplayedContent] = useState<string>("");
const displayedContentRef = useRef<string>(""); // Why both?
```

**Impact**:

- Confusing which source of truth to use
- Manual synchronization required (lines 277, 281, 421, etc.)
- Easy to miss updates in one place

### Issue #3: Message Type Complexity

**Current Message Type** (types.ts):

```typescript
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string; // Final content
  streamingContent?: string; // Temporary streaming content
  toolCalls?: ToolCall[]; // Widget rendering
};
```

**Problem**:

- Messages have both `content` and `streamingContent`
- Thread.tsx must check both: `m.streamingContent ?? m.content`
- Finalization logic must clear `streamingContent` and set `content`
- Easy to forget to clear `streamingContent` (leads to stale data)

### Issue #4: Event Handler Duplication

**Same Logic Repeated 4 Times** (Lines 439-557):

Each event handler (`widget`, `message_break`, `done`, `error`) has similar finalization code:

```typescript
if (messageId) {
  const messageContent = contentBufferRef.current;
  displayedContentRef.current = messageContent;
  setDisplayedContent(messageContent);
  setMessages((prevMessages) => {
    // ... find and update message ...
  });
}

// Reset state
messageId = null;
setCurrentMessageId(null);
currentMessageIdRef.current = null;
contentBufferRef.current = "";
displayedContentRef.current = "";
setDisplayedContent("");
```

**Impact**:

- 50+ lines of duplicated code
- Easy to miss updates in one handler
- Hard to maintain consistency

---

## Backend Complexity

### Delimiter-Based Widget System

**Current Approach** (ai_chat_service.py, chat_delimiters.py):

LLM outputs special delimiters in text:

```
Here are my projects:
<<<WIDGET:projects>>>
And my skills:
<<<WIDGET:skills>>>
```

**Backend Parsing** (ai_chat_service.py lines 148-196):

```python
cmd_pattern = re.compile(r"<<<(WIDGET:\w+(?::[0-9,]+)?|MSG_BREAK)>>>")

# Real-time parsing during streaming
for chunk in stream:
    pending_text += delta.content

    while True:
        match = cmd_pattern.search(pending_text)
        if not match:
            break

        # Emit text before command
        text_before = pending_text[:match.start()]
        yield {"type": "content", "data": text_before}

        # Emit command
        command = match.group(1)
        yield {"type": "cmd", "data": command}

        # Keep text after command
        pending_text = pending_text[match.end():]
```

**Complexity Issues**:

1. LLM must generate exact delimiter syntax
2. Delimiters can be partial in chunks (causes parsing issues)
3. Frontend must interpret command strings
4. Tight coupling between LLM output and frontend parsing

---

## Unnecessary Complexity Areas

### 1. Dual State/Ref Pattern

**Current**: Lines 67-72

```typescript
const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
const currentMessageIdRef = useRef<string | null>(null);
```

**Simpler Alternative**: Just use ref, no state needed

```typescript
const currentMessageIdRef = useRef<string | null>(null);
```

### 2. Character Animation System

**Current Complexity**:

- Separate animation loop with setInterval
- Manual buffer synchronization
- Ref-based updates to avoid re-renders
- ~100 lines of animation logic

**Question**: Is character-by-character animation worth this complexity?

**Alternative Approaches**:

1. **Word-by-word**: Simpler, still feels live
2. **Chunk-based**: Display as received (backend already does word-boundary)
3. **CSS animation**: Add typing effect with CSS instead

### 3. Finalization Logic Duplication

**Current**: 4 nearly identical code blocks for message finalization

**Better**: Extract to helper function

```typescript
const finalizeCurrentMessage = (messageId: string | null) => {
  if (!messageId) return;

  const finalContent = contentBufferRef.current;
  updateMessage(messageId, {
    content: finalContent,
    streamingContent: undefined,
  });
  resetBuffers();
};
```

### 4. Widget Data Preparation

**Current**: Lines 133-258 in ChatPortfolio.tsx

Transforms portfolio data into widget props in the component:

```typescript
const projectsData = effectivePortfolioData?.projects?.length
  ? {
      heading: "Projects",
      projects: effectivePortfolioData.projects.map((p) => ({
        name: p.name,
        one_line_description: p.one_line_description,
        // ... more mapping
      })),
    }
  : null;
```

**Complexity**:

- 125 lines of data transformation in render path
- Runs on every render
- Duplicates logic from Thread.tsx `prepareWidgetData()` function

**Simpler**: Let Thread.tsx handle all widget data preparation

---

## What Works Well

### ✅ Chat Service Extraction

The new `chatService.ts` is a good separation:

- Clean async generator API
- Handles all SSE parsing
- Proper error handling
- Type-safe events

### ✅ Thread Rendering

`Thread.tsx` cleanly renders messages:

- Consistent markdown styling
- Widget integration
- No business logic

### ✅ Backend Streaming

`ai_chat_service.py` robustly handles:

- OpenAI async streaming
- Real-time delimiter parsing
- Word-boundary detection
- Conversation history

---

## Complexity Scorecard

| Area                       | Complexity | Impact | Priority to Simplify |
| -------------------------- | ---------- | ------ | -------------------- |
| Streaming state management | 🔴 High    | High   | P0 - Critical        |
| Character animation loop   | 🟡 Medium  | Low    | P2 - Nice to have    |
| Message finalization       | 🔴 High    | High   | P0 - Causing bugs    |
| Delimiter parsing          | 🟡 Medium  | Medium | P1 - Maintenance     |
| Widget data prep           | 🟠 Medium  | Low    | P2 - Performance     |
| Dual state/ref tracking    | 🔴 High    | Medium | P1 - Confusing       |

---

## Proposed Next Steps (User's Plan)

### Phase 1: Stream Special Tokens Directly ✨

**Current**: Backend sends text delimiters `<<<WIDGET:projects>>>`  
**Proposed**: Backend sends structured SSE events directly

```typescript
// Instead of:
{ type: "content", data: "Here are my projects:" }
{ type: "cmd", data: "WIDGET:projects" }

// Send:
{ type: "content", data: "Here are my projects:" }
{ type: "widget_render", widget: "projects", indices: [0, 1] }
```

**Benefits**:

- No LLM delimiter generation needed
- No regex parsing complexity
- Type-safe widget commands
- Easier to debug

### Phase 2: Simplify State Management 🎯

**Target Areas**:

1. Remove dual state/ref tracking
2. Simplify message finalization (extract helper)
3. Consider simpler animation approach
4. Move widget data prep to Thread.tsx

### Phase 3: Fix Partial Message Issue 🐛

**Root Cause**: Buffer clearing before animation completes

**Options**:

1. Wait for animation before clearing (adds complexity)
2. Remove character animation (simplest)
3. Use message-level buffering instead of global buffer

---

## Key Files Reference

### Frontend

- `packages/template-components/src/components/ChatPortfolio.tsx` - Main component (779 lines) - **Needs simplification**
- `packages/template-components/src/services/chatService.ts` - SSE service (230 lines) - **Good**
- `packages/template-components/src/components/chat/Thread.tsx` - Rendering (397 lines) - **Good**
- `packages/template-components/src/components/chat/types.ts` - Types (48 lines) - **Needs streamingContent removal**

### Backend

- `backend/app/routes/public_portfolio_chat.py` - Endpoint handler - **Good**
- `backend/app/services/ai_chat_service.py` - OpenAI streaming (241 lines) - **Will change for token approach**
- `backend/app/constants/chat_delimiters.py` - Delimiter constants (90 lines) - **Will be deprecated**
- `backend/app/services/chat_prompt_builder.py` - Prompt generation - **Good**

---

## Questions for Simplification

1. **Character Animation**: Keep or remove? Current complexity: ~100 lines, 50 updates/sec
2. **Streaming Content Field**: Is temporary field needed, or can we update `content` directly?
3. **Widget Data Prep**: Keep in ChatPortfolio or move to Thread.tsx?
4. **Buffer Management**: Global refs or message-scoped?
5. **Message Finalization**: How many places should this happen? (Currently 4)

---

## Debug Tips

### Partial Message Issue

```typescript
// Add logging to track buffer state:
console.log("Buffer before widget:", contentBufferRef.current);
console.log("Displayed before widget:", displayedContentRef.current);
console.log(
  "Animation caught up?",
  contentBufferRef.current === displayedContentRef.current
);
```

### State Synchronization

```typescript
// Check if state and refs match:
console.log("State ID:", currentMessageId);
console.log("Ref ID:", currentMessageIdRef.current);
console.log("Match?", currentMessageId === currentMessageIdRef.current);
```

### SSE Event Flow

```typescript
// In chatService.ts line 185:
console.log("SSE Event:", parsed.type, parsed.data);
```

---

## Conclusion

The current architecture has these main complexity sources:

1. **Dual state/ref tracking** - Choose one or the other
2. **Character animation** - Evaluate if worth the complexity
3. **Message finalization duplication** - Extract to single function
4. **Delimiter-based widgets** - Moving to direct tokens will help
5. **Buffer management** - Needs clear ownership model

The streaming special tokens approach will eliminate delimiter parsing complexity. After that, focus on simplifying state management and buffer handling to fix the partial message issue.

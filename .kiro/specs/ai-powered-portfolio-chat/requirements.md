# Requirements Document

## Introduction

This feature enhances the existing chat-based portfolio interface with AI-powered natural language understanding. The system will integrate an LLM that analyzes user queries and dynamically renders portfolio widgets (projects, experience, education, etc.) through structured tool calls, replacing the current keyword-based widget selection with intelligent context-aware responses. Portfolio owners can control whether their chat is publicly accessible or requires authentication, with usage tracking for future pricing plans.

## Requirements

### Requirement 1

**User Story:** As a portfolio visitor, I want to ask natural language questions about the portfolio owner's work and get intelligent responses with relevant portfolio components displayed, so that I can explore their background in an interactive way.

#### Acceptance Criteria

1. WHEN a user types a question about the portfolio THEN the system SHALL send the query to the backend chat API endpoint
2. WHEN the backend processes the query THEN it SHALL use the Azure AI service to generate an intelligent response
3. WHEN the LLM determines it should show portfolio data THEN it SHALL make a tool call specifying the widget type and optional indices
4. WHEN a tool call is received THEN the frontend SHALL render the specified widget with smooth animations
5. WHEN the LLM provides explanatory text THEN it SHALL be displayed in a chat bubble with markdown formatting
6. WHEN no specific indices are provided THEN the system SHALL show all items in the requested widget
7. WHEN specific indices are provided THEN the system SHALL show only the specified item(s) from the widget data

### Requirement 2

**User Story:** As a portfolio visitor, I want the chat interface to be responsive and provide immediate feedback, so that the interaction feels natural and engaging.

#### Acceptance Criteria

1. WHEN a user submits a message THEN the system SHALL show a loading/thinking indicator immediately
2. WHEN the backend response is received THEN the system SHALL parse tool calls and text content
3. WHEN the response includes widget tool calls THEN widgets SHALL animate in smoothly using Framer Motion
4. WHEN the response includes text content THEN it SHALL be rendered with markdown formatting
5. WHEN multiple tool calls are made in a single response THEN widgets SHALL be rendered in the order specified
6. WHEN an error occurs THEN the system SHALL display a user-friendly error message in the chat thread
7. WHEN the network request fails THEN the system SHALL provide retry functionality

### Requirement 3

**User Story:** As a system administrator, I want robust rate limiting and security controls on the chat endpoint, so that the system remains stable, secure, and cost-effective under load.

#### Acceptance Criteria

1. WHEN requests are made from the same IP address THEN the system SHALL enforce IP-based rate limits using in-memory/Redis storage (50 requests per hour per IP across all portfolios by default)
2. WHEN IP rate limit records are no longer needed THEN the system SHALL automatically discard them to prevent memory bloat
3. WHEN a portfolio owner's chat receives messages THEN the system SHALL track total monthly message count in Firebase for that portfolio owner
4. WHEN the portfolio owner's monthly message limit is reached (100 messages per month default) THEN the system SHALL reject new chat requests
5. WHEN a rate limit is exceeded THEN the system SHALL return HTTP 429 with retry-after information
6. WHEN user input exceeds the token limit (60 tokens) THEN the system SHALL reject the request with a clear error message
7. WHEN monthly limits reset THEN the system SHALL automatically reset counters at month boundaries

### Requirement 4

**User Story:** As a system administrator, I want all chat interactions to be logged and tracked in the backend, so that I can monitor usage patterns, investigate issues, and support future pricing plans.

#### Acceptance Criteria

1. WHEN a chat request is made THEN the system SHALL store the user message in Firebase Firestore (backend only, no UI for now)
2. WHEN a chat response is generated THEN the system SHALL store the LLM response including tool calls in Firebase
3. WHEN storing chat history THEN the system SHALL include the originating IP address for security monitoring
4. WHEN storing chat data THEN the system SHALL associate it with the portfolio username being viewed
5. WHEN storing chat data THEN the system SHALL include timestamps for all interactions
6. WHEN storing conversations THEN the system SHALL support conversation threading with unique conversation IDs
7. WHEN chat data exceeds retention period (30 days) THEN the system SHALL support automatic cleanup
8. WHEN tracking portfolio owner usage THEN the system SHALL increment their monthly message counter for pricing plan enforcement

### Requirement 5

**User Story:** As a portfolio owner, I want the LLM to have detailed knowledge of my portfolio data, so that it can provide accurate and specific responses about my work.

#### Acceptance Criteria

1. WHEN the backend processes a chat query THEN it SHALL fetch the complete portfolio data for the specified username
2. WHEN the LLM processes a query THEN it SHALL receive the full portfolio context including personal_info, work_experiences, projects, education, certifications, and text_blobs
3. WHEN the LLM references specific items THEN it SHALL use accurate zero-based indices that correspond to the array positions
4. WHEN the LLM makes tool calls THEN it SHALL include optional explanation text about why specific items were selected
5. WHEN portfolio data is not available THEN the system SHALL return an appropriate error message
6. WHEN the LLM cannot find relevant information THEN it SHALL respond conversationally without making incorrect tool calls
7. WHEN the portfolio data structure changes THEN the system SHALL handle missing or optional fields gracefully

### Requirement 6

**User Story:** As a developer, I want the tool call system to be extensible and well-defined, so that new portfolio widgets can be easily added to the chat interface.

#### Acceptance Criteria

1. WHEN defining tool calls THEN the system SHALL support the existing widget types: "about", "projects", "skills", "contact", "experience", "education"
2. WHEN a tool call specifies indices parameter THEN the system SHALL filter and render only the specified item(s) from the widget data
3. WHEN a tool call omits the indices parameter THEN the system SHALL render all items in the widget
4. WHEN a tool call includes explanation text THEN the system SHALL render it as a separate message in the chat thread
5. WHEN the LLM response includes both text and tool calls THEN both SHALL be rendered appropriately
6. WHEN new widget types are added THEN they SHALL follow the same tool call pattern without breaking existing functionality
7. WHEN the frontend receives an unknown widget type THEN it SHALL handle gracefully with a fallback message

### Requirement 7

**User Story:** As a portfolio owner, I want to control whether my AI chat is publicly accessible or requires authentication, so that I can manage privacy and access to my portfolio.

#### Acceptance Criteria

1. WHEN a portfolio owner configures their settings THEN they SHALL be able to toggle chat accessibility (public/private) stored in Firebase user settings
2. WHEN the chat endpoint receives a request for a private portfolio THEN it SHALL reject unauthenticated requests with HTTP 403
3. WHEN the chat endpoint receives an authenticated request for a private portfolio THEN it SHALL verify the authenticated user matches the portfolio owner
4. WHEN the chat endpoint receives a request for a public portfolio THEN it SHALL accept unauthenticated requests
5. WHEN the portfolio owner has not set a preference THEN the system SHALL default to public access
6. WHEN checking access permissions THEN the system SHALL fetch the setting from Firebase user settings efficiently

### Requirement 8

**User Story:** As a portfolio visitor, I want the AI to remember our conversation context, so that I can have natural follow-up conversations without repeating information.

#### Acceptance Criteria

1. WHEN a user sends a message THEN the system SHALL include the conversation_id in the request if one exists
2. WHEN the backend receives a conversation_id THEN it SHALL retrieve the last N messages (configurable, default 10) from Firebase
3. WHEN the LLM processes a query THEN it SHALL receive the conversation history as context
4. WHEN generating a response THEN the LLM SHALL consider previous messages for context-aware replies
5. WHEN a new conversation starts THEN the system SHALL generate a unique conversation_id
6. WHEN conversation history is retrieved THEN it SHALL include both user messages and assistant responses with tool calls
7. WHEN the conversation history exceeds the limit THEN the system SHALL use only the most recent messages

### Requirement 9

**User Story:** As a portfolio visitor, I want the AI to be helpful and focused on the portfolio owner's work, so that I get relevant and warm responses about their background and interests.

#### Acceptance Criteria

1. WHEN the LLM system prompt is defined THEN it SHALL be stored in the backend code (not exposed to frontend)
2. WHEN the LLM processes queries THEN it SHALL focus responses on the portfolio owner's work, projects, experience, and education
3. WHEN users ask general questions THEN the LLM SHALL respond warmly while relating answers back to the portfolio context
4. WHEN users ask off-topic questions THEN the LLM SHALL politely redirect to portfolio-related topics
5. WHEN the LLM generates responses THEN it SHALL maintain a warm, professional, and engaging tone
6. WHEN the system prompt is updated THEN it SHALL not require frontend changes

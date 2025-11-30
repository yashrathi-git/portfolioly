# Chat API Integration Summary

## Overview

Updated the portfolio preview and template components to support authenticated API calls to the chat endpoint, enabling real-time AI-powered chat functionality in the portfolio editor preview when a username is configured.

## Important Note

**Username is required for API calls**: The chat endpoint requires a username in the path (`/api/chat/{username}`). If the user hasn't set a username yet, the preview will fall back to preset responses with a helpful banner indicating they should set a username to enable live AI chat.

## Changes Made

### 1. Template Components Package

#### `ChatPortfolio.tsx`

- Added `authToken` prop to `ChatPortfolioProps`
- Updated `callChatAPI` to include Authorization header when `authToken` is provided
- Maintains backward compatibility with unauthenticated public access
- Falls back to preset responses when username is not provided

#### `PortfolioLayoutContainer.tsx`

- Added `username`, `apiBaseUrl`, and `authToken` props to interface
- Passes these props through to `ChatPortfolio` component

#### `Portfolio.tsx`

- Added `username`, `apiBaseUrl`, and `authToken` props to `PortfolioProps` interface
- Passes these props through to `PortfolioLayoutContainer`

### 2. Main App

#### `PortfolioPreview.tsx`

- Added `username` prop to `PortfolioPreviewProps` (optional)
- Integrated `useAuth` hook to get authenticated user
- Added state management for auth token using `useEffect`
- Passes `username`, `apiBaseUrl`, and `authToken` to Portfolio component
- Shows helpful banner when username is not set
- Enables authenticated API calls in preview mode when username is available

## How It Works

### Authentication Flow

1. User is authenticated in the main app via Firebase
2. `PortfolioPreview` retrieves the Firebase ID token using `user.getIdToken()`
3. Token is passed down through component hierarchy to `ChatPortfolio`
4. `ChatPortfolio` includes token in Authorization header when making API calls

### API Call Flow (With Username)

```
User types message in preview
  ↓
ChatPortfolio.sendUserMessage()
  ↓
ChatPortfolio.callChatAPI()
  ↓
POST /api/chat/{username}
  Headers: { Authorization: "Bearer {token}" }
  ↓
Backend validates token and processes request
  ↓
SSE streaming response with tool calls
  ↓
Thread component renders widgets with indices filtering
```

### Fallback Flow (Without Username)

```
User types message in preview
  ↓
ChatPortfolio.sendUserMessage()
  ↓
No API call (username not provided)
  ↓
Keyword matching for preset responses
  ↓
Thread component renders widgets
```

### Props Flow

```
PortfolioPreview
  ├─ username (from props - optional)
  ├─ apiBaseUrl (from env)
  └─ authToken (from Firebase user)
      ↓
  Portfolio
      ↓
  PortfolioLayoutContainer
      ↓
  ChatPortfolio
      ↓
  Makes authenticated API call (if username provided)
  OR falls back to presets (if no username)
```

## Usage

### In Portfolio Editor (With Username)

```tsx
<PortfolioPreview data={portfolioData} username={userSettings?.username} />
```

When username is provided, the component will:

- Get the auth token from the authenticated user
- Pass it to the chat API
- Enable real-time AI chat in the preview

### In Portfolio Editor (Without Username)

```tsx
<PortfolioPreview data={portfolioData} username={undefined} />
```

When username is not provided:

- Shows a helpful banner: "💡 Set a username to enable live AI chat in preview"
- Falls back to preset keyword-based responses
- User can still interact with the chat UI to see the layout

### Public Portfolio (No Auth)

When `authToken` is not provided, the chat works in public mode:

- No Authorization header sent
- Backend allows public access based on portfolio settings
- Rate limiting applies to unauthenticated requests

## Behavior Summary

| Scenario                 | Username    | Auth Token      | Behavior                                  |
| ------------------------ | ----------- | --------------- | ----------------------------------------- |
| Preview with username    | ✅ Provided | ✅ Auto-fetched | Live AI chat with authenticated API calls |
| Preview without username | ❌ Not set  | ✅ Auto-fetched | Preset responses + banner to set username |
| Public portfolio         | ✅ Required | ❌ None         | Live AI chat with public API calls        |

## Benefits

1. **Live Preview**: Users can test their AI chat in the editor before publishing (when username is set)
2. **Authenticated Access**: Preview uses authenticated endpoints, bypassing public rate limits
3. **Real-time Testing**: See actual AI responses with tool calls and widget rendering
4. **Graceful Degradation**: Works with preset responses when username isn't set yet
5. **Seamless Integration**: No code changes needed in existing public portfolio pages

## Security

- Auth tokens are obtained client-side from Firebase
- Tokens are short-lived and automatically refreshed
- Backend validates tokens on every request
- Private portfolios remain protected even in preview mode

## Next Steps

To enable live AI chat in the portfolio editor:

1. Implement username selection/configuration in user settings
2. Fetch user's username from user settings API
3. Pass username to `PortfolioPreview` component
4. Chat will automatically work with authenticated API calls

## Future Enhancement

Consider adding an authenticated endpoint `/api/chat/me` that:

- Doesn't require username in the path
- Uses auth token to identify the user's portfolio
- Enables preview chat even before username is set
- Would require backend changes to add this new endpoint

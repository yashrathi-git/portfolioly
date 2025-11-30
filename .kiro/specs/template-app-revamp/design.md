# Design Document

## Overview

This design document outlines the implementation of a PortfolioWrapper component that simplifies portfolio consumption by making data fetching optional. The wrapper will leverage existing infrastructure (PublicApiClient, Portfolio component, data transformers) to provide a minimal API surface for template apps.

## Existing Infrastructure

### Already Implemented

1. **Portfolio Component** (`packages/template-components/src/components/Portfolio.tsx`)

   - Handles layout switching (chat/traditional modes)
   - Generates default suggestions from portfolio data
   - Generates chat profile from personal_info
   - Accepts all necessary props (username, apiBaseUrl, publicToken, etc.)
   - Already supports isLoading and error states

2. **PublicApiClient** (`packages/template-components/src/clients/public-api-client.ts`)

   - `getPublicPortfolioData(username, publicToken?)` - Fetches portfolio data
   - `chatWithPortfolio(username, message, publicToken, conversationId?)` - Chat API
   - Proper error handling with DataProviderError
   - Debug logging support

3. **Data Transformer** (`packages/schema/src/transformers/backend-to-display.ts`)

   - `mapBackendToDisplay(backendData)` - Converts PortfolioData to DisplayPortfolioData
   - Extracts and deduplicates skills
   - Maps certifications to formatted strings
   - Handles all date formatting

4. **Type Definitions** (`packages/schema`)
   - PortfolioData (backend format)
   - DisplayPortfolioData (UI format)
   - All entity types properly defined

## Backend API Endpoints

### GET /public/portfolio/{username}

- **Authentication**: Bearer token (public token) in Authorization header
- **Response**: PortfolioData (backend format)
- **Status Codes**:
  - 200: Success
  - 401: Missing or invalid token
  - 404: Portfolio not found or private
  - 500: Server error

### POST /public/chat/{username}

- **Authentication**: Bearer token (public token) in Authorization header
- **Request Body**: `{ message: string, conversation_id?: string }`
- **Response**: Streaming SSE response
- **Status Codes**:
  - 200: Success (streaming)
  - 401: Invalid or expired token
  - 404: Portfolio not found or chat disabled
  - 429: Rate limit exceeded
  - 500: Server error

## Architecture

### Component Hierarchy

```
PortfolioWrapper (new)
  ├─ Loading State (built-in)
  ├─ Error State (built-in)
  └─ Portfolio (existing)
       ├─ PortfolioLayoutContainer
       │    ├─ ChatPortfolio
       │    └─ TraditionalPortfolio
       └─ LayoutSwitcher
```

### Data Flow

```
┌─────────────────────┐
│ PortfolioWrapper    │
│                     │
│ Props:              │
│ - portfolioData?    │◄─── Optional: Skip API if provided
│ - username?         │
│ - apiBaseUrl?       │
│ - publicToken?      │
│ - ...Portfolio props│
└──────────┬──────────┘
           │
           ├─ If portfolioData provided
           │  └─► Pass directly to Portfolio
           │
           └─ If portfolioData NOT provided
              │
              ├─► 1. Validate required props (username, apiBaseUrl)
              │
              ├─► 2. Create PublicApiClient instance
              │
              ├─► 3. Call getPublicPortfolioData(username, publicToken)
              │
              ├─► 4. Transform with mapBackendToDisplay()
              │
              └─► 5. Pass to Portfolio component
```

## Component Design

### PortfolioWrapper Component

**File**: `packages/template-components/src/components/PortfolioWrapper.tsx`

#### Props Interface

```typescript
export interface PortfolioWrapperProps
  extends Omit<PortfolioProps, "portfolioData" | "isLoading" | "error"> {
  // Optional: Provide data directly (skip API call)
  portfolioData?: DisplayPortfolioData | null;

  // Required when portfolioData not provided
  username?: string;
  apiBaseUrl?: string;

  // Optional: For authenticated access
  publicToken?: string;

  // All other Portfolio props are passed through
  // (isOwner, isPreview, profile, suggestions, presets, etc.)
}
```

#### State Management

```typescript
const [data, setData] = useState<DisplayPortfolioData | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | undefined>();
```

#### Logic Flow

1. **Initialization**

   - Check if `portfolioData` prop is provided
   - If yes: Use it directly, skip API call
   - If no: Validate `username` and `apiBaseUrl` are provided

2. **Data Fetching** (when portfolioData not provided)

   ```typescript
   useEffect(() => {
     if (portfolioData !== undefined) {
       // Use provided data
       return;
     }

     if (!username || !apiBaseUrl) {
       setError(
         "Username and apiBaseUrl are required when portfolioData is not provided"
       );
       return;
     }

     async function fetchData() {
       setLoading(true);
       setError(undefined);

       try {
         const config: TemplateConfig = {
           dataSource: "api",
           apiEndpoints: {
             publicPortfolio: "/public/portfolio",
           },
         };

         const client = new PublicApiClient(config, apiBaseUrl);
         const backendData = await client.getPublicPortfolioData(
           username,
           publicToken
         );

         if (backendData) {
           const displayData = mapBackendToDisplay(backendData);
           setData(displayData);
         } else {
           setData(null);
         }
       } catch (err) {
         const errorMessage =
           err instanceof DataProviderError
             ? err.message
             : "Failed to load portfolio";
         setError(errorMessage);
       } finally {
         setLoading(false);
       }
     }

     fetchData();
   }, [portfolioData, username, apiBaseUrl, publicToken]);
   ```

3. **Rendering**

   ```typescript
   const effectiveData = portfolioData !== undefined ? portfolioData : data;
   const effectiveLoading = portfolioData !== undefined ? false : loading;
   const effectiveError = portfolioData !== undefined ? undefined : error;

   return (
     <Portfolio
       portfolioData={effectiveData}
       isLoading={effectiveLoading}
       error={effectiveError}
       username={username}
       apiBaseUrl={apiBaseUrl}
       publicToken={publicToken}
       {...otherProps}
     />
   );
   ```

### Error Handling

The component will handle three types of errors:

1. **Validation Errors**: Missing required props

   - Error message: "Username and apiBaseUrl are required when portfolioData is not provided"

2. **API Errors**: Network or server failures

   - Use DataProviderError messages from PublicApiClient
   - Examples: "Portfolio not found or is private", "Server error occurred"

3. **Transformation Errors**: Data mapping failures
   - Error message: "Failed to process portfolio data"

All errors are passed to the Portfolio component via the `error` prop, which already has built-in error display UI.

## Template App Implementation

### Updated page.tsx

**File**: `apps/template/src/app/page.tsx`

```typescript
"use client";

import {
  PortfolioWrapper,
  TemplateProvider,
} from "@portfolioly/template-components";
import "@portfolioly/template-components/style.css";

export default function Home() {
  const username = process.env.NEXT_PUBLIC_USERNAME;
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const publicToken = process.env.NEXT_PUBLIC_PUBLIC_TOKEN;

  return (
    <TemplateProvider>
      <main className="min-h-screen bg-background text-foreground">
        <PortfolioWrapper
          username={username}
          apiBaseUrl={apiBaseUrl}
          publicToken={publicToken}
        />
      </main>
    </TemplateProvider>
  );
}
```

**Lines of code**: ~20 (well under the 50-line requirement)

### Environment Variables

**File**: `apps/template/.env.example`

```bash
# Required: Portfolio username to display
NEXT_PUBLIC_USERNAME=your_username_here

# Required: Backend API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional: Public token for authenticated access
# Get this from your portfolio settings
NEXT_PUBLIC_PUBLIC_TOKEN=psk_your_token_here
```

### Updated package.json

Remove unnecessary dependencies:

- Remove `@portfolioly/schema` (imported via template-components)
- Remove duplicate UI libraries already in template-components
- Keep only: Next.js, React, template-components, Tailwind CSS

```json
{
  "dependencies": {
    "@portfolioly/template-components": "workspace:*",
    "next": "15.3.5",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9.35.0",
    "eslint-config-next": "^15.5.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## Package Exports

### Updated src/index.ts

**File**: `packages/template-components/src/index.ts`

Add export for PortfolioWrapper:

```typescript
// Add after Portfolio export
export * from "./components/PortfolioWrapper";
```

This makes PortfolioWrapper available as:

```typescript
import { PortfolioWrapper } from "@portfolioly/template-components";
```

## Testing Strategy

### Manual Testing Scenarios

1. **With portfolioData prop**

   - Verify no API call is made
   - Verify data displays correctly
   - Verify chat functionality works

2. **Without portfolioData prop**

   - Verify API call is made with correct parameters
   - Verify loading state displays
   - Verify data transforms correctly
   - Verify error handling for invalid username
   - Verify error handling for network failures

3. **With publicToken**

   - Verify token is included in Authorization header
   - Verify private portfolios are accessible

4. **Without publicToken**

   - Verify only public portfolios are accessible
   - Verify proper error message for private portfolios

5. **Template App**
   - Verify environment variables are read correctly
   - Verify app builds without errors
   - Verify app runs in development mode
   - Verify app builds for production

## Migration Path

### For Existing Template App Users

1. Update `@portfolioly/template-components` to latest version
2. Replace custom data fetching code with PortfolioWrapper
3. Remove manual data transformation code
4. Update environment variables if needed
5. Remove unused dependencies from package.json

### For New Template App Users

1. Install `@portfolioly/template-components`
2. Set up environment variables
3. Use PortfolioWrapper in page.tsx
4. Done! (3 steps)

## Performance Considerations

1. **No Additional Overhead**: PortfolioWrapper is a thin wrapper with minimal logic
2. **Efficient Re-renders**: Uses React.memo for Portfolio component (already implemented)
3. **Single API Call**: Data is fetched once on mount, cached in state
4. **Conditional Fetching**: API call only made when portfolioData not provided

## Security Considerations

1. **Token Handling**: Public tokens are passed securely via Authorization header
2. **Environment Variables**: Sensitive tokens stored in .env files (not committed)
3. **Error Messages**: Generic error messages to avoid leaking system information
4. **CORS**: Backend already configured for cross-origin requests

## Future Enhancements

1. **Caching**: Add optional caching layer for repeated fetches
2. **Retry Logic**: Add automatic retry for failed API calls
3. **Prefetching**: Add prefetch option for faster initial load
4. **SSR Support**: Add server-side rendering support for better SEO

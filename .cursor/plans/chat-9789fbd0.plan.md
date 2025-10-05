<!-- 9789fbd0-6194-4a53-9acd-3a0b777f2c45 ffce9d06-400c-42e3-a113-47945e456c06 -->
# Chat Streaming Refactor Plan

## Backend Chat Service

- update-ai-chat-service: Switch to the async Azure inference client with proper streaming iteration, drop tiktoken dependency in favor of character limits, and return structured chunks.
- add-prompt-builder: Introduce a dedicated helper to assemble the system prompt from `PortfolioData`, covering personal info, work experience, projects, education, certifications, profiles, and text blobs.

## API Route Cleanup

- refactor-public-chat-route: Break `chat_with_public_portfolio` into smaller async helpers (auth/rate limiting, portfolio fetch, conversation handling) and move reusable pieces into a new module to keep the route slim.

## Validation & Limits

- simplify-token-validation: Replace token-count validation with lightweight character-length checks in `chat_rate_limiting` and adjust related constants/settings.

## Frontend Alignment

- harden-chat-frontend: Ensure `ChatPortfolio.tsx` SSE parsing tolerates async chunking/tool calls, surfaces backend errors clearly with straightforward messaging, and still renders widgets from tool calls using the refined schema.

## Verification

- smoke-test-chat-flow: Manually exercise the chat endpoint (happy path + failure cases) and confirm streamed responses and widgets render in the template component.
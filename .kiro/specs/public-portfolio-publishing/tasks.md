# Implementation Plan

- [x] 1. Backend: Modify ensure-token authentication logic

  - Update `/public/ensure-token` endpoint to check `chat_settings.access_mode`
  - Implement logic: Firebase JWT → always return token; username only → check access_mode
  - Default to "private" if access_mode not set
  - Return 404 for private portfolios without authentication
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 2. Backend: Add access mode update endpoint

  - Create PATCH `/user-settings/settings/access-mode` endpoint
  - Add `AccessModeUpdateRequest` schema with Literal["public", "private"]
  - Verify Firebase JWT authentication
  - Update `chat_settings.access_mode` in Firestore
  - _Requirements: 2.6_

- [x] 3. Backend: Add user settings service method

  - Implement `update_access_mode(user_id, access_mode)` method in UserSettingsService
  - Update Firestore document with new access_mode value
  - Update `updated_at` timestamp
  - _Requirements: 2.6_

- [ ]\* 3.1 Write tests for ensure-token authentication logic

  - Test Firebase JWT authentication path
  - Test username-only with public access_mode
  - Test username-only with private access_mode (should return 404)
  - Test missing username (should return 404)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 3.2 Write tests for access mode update endpoint

  - Test successful access mode update
  - Test unauthorized access (no JWT)
  - Test invalid access mode values
  - _Requirements: 2.6_

- [x] 4. Frontend: Create user settings API client

  - Create `apps/main/src/lib/api/userSettings.ts`
  - Implement `updateUsername(userId, username, authToken)` function
  - Implement `updateAccessMode(accessMode, authToken)` function
  - Implement `checkUsernameAvailability(username, authToken)` function
  - Implement `getUserSettings(authToken)` function
  - Add proper error handling and TypeScript types
  - _Requirements: 2.3, 2.4, 2.6_

- [x] 5. Frontend: Create public portfolio API client

  - Create `apps/main/src/lib/api/publicPortfolio.ts`
  - Implement `fetchPublicPortfolio(username)` function
  - Call ensure-token with username only
  - Fetch portfolio data with returned public token
  - Handle 404 errors for non-existent/private portfolios
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 6. Frontend: Create user settings types

  - Create `apps/main/src/types/userSettings.ts`
  - Define `UserSettings` interface with chat_settings
  - Define `PublishStatus` interface
  - Export types for use across components
  - _Requirements: 2.1, 2.2, 2.6_

- [x] 7. Frontend: Create PublishSettingsPanel component

  - Create `apps/main/src/components/edit/PublishSettingsPanel.tsx`
  - Add username input with real-time validation
  - Add debounced availability checking
  - Add public/private toggle switch
  - Display public URL with copy button when published
  - Show status indicators (published, private, etc.)
  - Handle loading and error states
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 8. Frontend: Create FullscreenPreviewButton component

  - Create `apps/main/src/components/edit/FullscreenPreviewButton.tsx`
  - Add button to open `/preview` in new tab
  - Disable if no content exists
  - Add hover tooltip
  - _Requirements: 1.1_

- [x] 9. Frontend: Create DeployToVercelButton component

  - Create `apps/main/src/components/edit/DeployToVercelButton.tsx`
  - Add button with "Coming Soon" badge
  - Show informational modal on click explaining feature is in development
  - Style to indicate future feature (e.g., star icon, muted colors)
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Frontend: Integrate new components into EditorTopBar

  - Modify `apps/main/src/components/edit/EditorTopBar.tsx`
  - Add PublishSettingsPanel (collapsible or in dropdown)
  - Add FullscreenPreviewButton next to preview toggle
  - Add DeployToVercelButton
  - Ensure responsive layout for mobile
  - _Requirements: 2.1, 1.1, 5.1_

- [x] 11. Frontend: Create authenticated preview page

  - Create `apps/main/src/app/preview/page.tsx`
  - Use `useAuth` hook to verify authentication
  - Redirect to sign-in if not authenticated
  - Fetch portfolio data using Firebase JWT via `useAuthenticatedPortfolio`
  - Render Portfolio component in fullscreen mode
  - Handle loading and error states
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 12. Frontend: Create public portfolio page

  - Create `apps/main/src/app/p/[username]/page.tsx`
  - Extract username from route params
  - Call `fetchPublicPortfolio(username)` to get data
  - Render Portfolio component with fetched data
  - Handle 404 errors with custom error page
  - Show loading state while fetching
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 13. Frontend: Create 404 error page for portfolios

  - Create `apps/main/src/app/p/[username]/not-found.tsx`
  - Display user-friendly "Portfolio Not Found" message
  - Add link back to home page
  - Style consistently with app theme
  - _Requirements: 7.1, 7.2_

- [x] 14. Frontend: Add custom hook for publish status

  - Create `apps/main/src/hooks/usePublishStatus.ts`
  - Fetch user settings on mount
  - Calculate publish status (hasUsername, isPublic, canPublish)
  - Generate public URL if applicable
  - Return loading and error states
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 15. Frontend: Update PortfolioEditor to show publish prompts

  - Modify `apps/main/src/components/edit/PortfolioEditor.tsx`
  - Show prominent indicator if portfolio not published
  - Display prompt to set username if missing
  - Show call-to-action to make portfolio public
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 16. Frontend: Add URL copy functionality

  - Implement copy-to-clipboard in PublishSettingsPanel
  - Show tooltip "Click to copy" on hover
  - Display temporary success message after copy
  - Handle copy failures gracefully
  - _Requirements: 2.7, 6.6, 6.7_

- [x] 17. Frontend: Add error handling and validation

  - Implement username validation with specific error messages
  - Show "Username already taken" with suggestions
  - Handle backend unavailability with retry options
  - Display user-friendly error messages throughout
  - _Requirements: 7.3, 7.4, 7.5, 7.6_

- [ ]\* 17.1 Write component tests for PublishSettingsPanel

  - Test username validation logic
  - Test toggle state management
  - Test URL copy functionality
  - Test error state rendering
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ]\* 17.2 Write integration tests for preview and public pages

  - Test preview page authentication flow
  - Test public portfolio page rendering
  - Test 404 error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 18. Documentation: Update user guides
  - Document publishing workflow
  - Add screenshots of publish settings
  - Explain public vs private portfolios
  - Document URL structure and sharing
  - _Requirements: 6.5_

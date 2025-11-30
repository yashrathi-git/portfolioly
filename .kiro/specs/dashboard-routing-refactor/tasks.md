# Implementation Plan

- [x] 1. Update HeaderBar component for dynamic navigation

  - Modify logo/app name link to route based on auth status
  - Unauthenticated users → `/`
  - Authenticated + verified users → `/dashboard`
  - Authenticated + unverified users → `/`
  - _Requirements: 5.1, 5.2_

- [x] 2. Verify landing page (/) behavior

  - Ensure public landing page displays for unauthenticated users
  - Ensure authenticated users see dashboard CTA
  - Ensure no automatic redirects occur
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Update dashboard page with new action cards

  - [x] 3.1 Update dashboard layout and welcome message

    - Display user's name or email in welcome message
    - Use existing Card components from shadcn/ui
    - _Requirements: 2.4_

  - [x] 3.2 Create Edit Portfolio action card

    - Use existing Card, Button, and Lucide icons
    - Navigate to `/edit` on click
    - _Requirements: 3.1, 3.2_

  - [x] 3.3 Create Create New action card

    - Use existing Card, Button, and Lucide icons
    - Navigate to `/upload` on click
    - _Requirements: 3.1, 3.3_

  - [x] 3.4 Create Analyze Chats action card

    - Use existing Card, Button, and Lucide icons
    - Navigate to existing analysis route on click
    - _Requirements: 3.1, 3.4_

  - [x] 3.5 Create Resume Maker action card with notification toggle
    - Use existing Card, Button, and Lucide icons
    - Display as disabled with "Coming Soon" badge
    - Add notification toggle using existing Switch/Checkbox component
    - _Requirements: 3.1, 3.5, 4.1_

- [x] 4. Implement notification preference functionality

  - [x] 4.1 Extend UserSettings type with notify_for_resume_feature field

    - Add optional boolean field to UserSettings interface
    - _Requirements: 4.2_

  - [x] 4.2 Fetch notification preference on dashboard mount

    - Use existing user settings API endpoint
    - Default to false if not set or on error
    - Log errors to console (silent failure)
    - _Requirements: 4.4_

  - [x] 4.3 Implement toggle handler for notification preference
    - Update Firestore via existing user settings API
    - Optimistic UI update
    - Revert on failure (silent, no user message)
    - Log errors to console
    - _Requirements: 4.2, 4.3, 4.5_

- [x] 5. Update backend user settings schema

  - [x] 5.1 Add notify_for_resume_feature field to backend schema

    - Update Pydantic model in backend/app/schemas/user_settings.py
    - Add optional boolean field with default False
    - _Requirements: 4.2_

  - [x] 5.2 Update user settings service to handle new field
    - Ensure backend accepts and persists the new field
    - No validation needed (simple boolean)
    - _Requirements: 4.2, 4.3_

- [x] 6. Verify dashboard protection

  - Ensure dashboard uses withAuth HOC with requireVerification: true
  - Verify unauthenticated users redirect to `/`
  - Verify unverified users redirect to `/auth/verify-email`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Implement responsive dashboard layout

  - Use Tailwind grid classes for responsive layout
  - 1 column on mobile (< 768px)
  - 2 columns on tablet (768px - 1024px)
  - 4 columns on desktop (> 1024px)
  - _Requirements: 6.5_

- [x] 8. Style Resume Maker card as disabled

  - Apply muted background and text colors
  - Add opacity and cursor-not-allowed
  - Add "Coming Soon" badge
  - Ensure visually distinct from active cards
  - _Requirements: 6.3_

- [ ]\* 9. Write unit tests for HeaderBar navigation

  - Test logo navigation for unauthenticated users
  - Test logo navigation for authenticated verified users
  - Test logo navigation for authenticated unverified users
  - _Requirements: 5.1, 5.2_

- [ ]\* 10. Write unit tests for dashboard component

  - Test welcome message displays user name/email
  - Test all four action cards render
  - Test Edit Portfolio card navigation
  - Test Create New card navigation
  - Test Analyze Chats card navigation
  - Test Resume Maker card is disabled
  - Test notification toggle functionality
  - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_

- [ ]\* 11. Write property test for notification persistence

  - **Property 6: Notification toggle persists to Firestore**
  - **Validates: Requirements 4.2, 4.3**
  - Generate random toggle sequences
  - Verify Firestore updates occur
  - Verify final state matches expected

- [ ]\* 12. Write property test for error handling

  - **Property 8: Failed Firestore updates revert silently**
  - **Validates: Requirements 4.5**
  - Generate random Firestore failures
  - Verify toggle reverts to previous state
  - Verify no user-facing errors shown

- [ ]\* 13. Write property test for dashboard protection

  - **Property 2: Dashboard requires authentication and verification**
  - **Validates: Requirements 2.1, 2.2**
  - Generate various auth states (no user, unverified user)
  - Verify correct redirects occur

- [ ]\* 14. Write property test for header navigation

  - **Property 9: Header navigation is auth-aware**
  - **Validates: Requirements 5.1, 5.2**
  - Generate various auth states
  - Verify logo navigates to correct route

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

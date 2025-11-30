# Implementation Plan

- [x] 1. Create SourceSelector component

  - Create new `SourceSelector.tsx` component in `apps/main/src/components/upload/`
  - Implement three source cards (LinkedIn, Resume, GitHub) with icons, titles, descriptions, and badges
  - Add hover effects and smooth transitions for card interactions
  - Implement source selection handler that triggers parent callback
  - Add "I'll fill it manually" link at bottom that navigates directly to edit page
  - Add visual indicators for already-used sources (checkmark badge)
  - Use clear, friendly copy throughout (e.g., "No authentication required", "Username only")
  - Ensure responsive design: 3-column on desktop, 2-column on tablet, 1-column on mobile
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Create SourceUploadView orchestrator component

  - Create new `SourceUploadView.tsx` component in `apps/main/src/components/upload/`
  - Implement dynamic rendering of upload interfaces based on selected source
  - Add back button to return to source selector
  - Remove step navigation from existing upload components when used in this context
  - Implement completion callback that triggers parent state update
  - Handle upload errors and provide retry functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Create ActionPanel component

  - Create new `ActionPanel.tsx` component in `apps/main/src/components/upload/`
  - Implement success state display with checkmark icon and friendly message (e.g., "Great! Your data is ready")
  - Add prominent "Continue to Edit" button as primary CTA
  - Add subtle "Add another source" link positioned in top-right corner
  - Implement loading state for data submission with message like "Processing your data..."
  - Handle continue action that submits all data and navigates to edit page
  - Handle add source action that returns to source selector
  - _Requirements: 4.1, 4.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 4. Create SourcesSummary component

  - Create new `SourcesSummary.tsx` component in `apps/main/src/components/upload/`
  - Implement compact chip/badge display for each uploaded source
  - Show source icon, type, and brief summary (e.g., "Resume.pdf" or "5 repos")
  - Add remove button that appears on hover
  - Implement remove handler that updates parent state
  - Only render when multiple sources are uploaded
  - _Requirements: 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Adapt existing upload interfaces for standalone use

  - Modify `PDFUploadStep` to work without step navigation when used standalone
  - Modify `GithubRepoStep` to work without step navigation when used standalone
  - Add completion callback prop to both components
  - Remove dependency on wizard context
  - Add subtle authentication notes to LinkedIn interface ("No authentication required")
  - Add subtle authentication notes to GitHub interface ("Username only - no authentication needed")
  - Ensure all existing functionality is preserved
  - _Requirements: 3.6, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 10.1, 10.3_

- [x] 6. Implement main upload page state management

  - Update `apps/main/src/app/(appShell)/upload/page.tsx` to use new component structure
  - Implement state management for current view (selector, uploading, complete)
  - Implement state management for selected source
  - Implement state management for uploaded sources (Map of source type to data)
  - Implement state management for submission status
  - Handle source selection and view transitions
  - Handle "I'll fill it manually" action that navigates directly to edit page without submission
  - Handle upload completion and data storage
  - Handle multiple source uploads and removal
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 7. Implement data submission flow

  - Create submission handler that collects all uploaded source data
  - Reuse existing `useUpload` hook's `submitAllData` method
  - Show loading screen during submission with progress indication
  - Handle successful submission with success toast and navigation to edit page
  - Handle failed submission with error message and option to proceed anyway
  - Ensure all existing backend APIs are used without modification
  - _Requirements: 6.3, 6.4, 6.5, 6.6, 10.1, 10.2, 10.4_

- [x] 8. Implement responsive design and styling

  - Apply consistent spacing, typography, and colors from design system
  - Implement responsive layouts for all screen sizes (desktop, tablet, mobile)
  - Add smooth transitions and animations for all interactions
  - Implement card hover effects with scale and shadow
  - Add fade-in animations for success states
  - Ensure mobile layout stacks properly and maintains usability
  - Use ample whitespace for clean, uncluttered appearance
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Add accessibility features

  - Ensure all interactive elements are keyboard accessible
  - Implement logical tab order through source cards and actions
  - Add proper ARIA labels for all interactive elements
  - Add status announcements for upload progress and completion
  - Implement clear focus indicators for keyboard navigation
  - Ensure high contrast ratios for all text
  - Test with screen readers and fix any issues
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Implement error handling and edge cases

  - Handle file validation errors with inline messages and retry options
  - Handle network errors with toast notifications and retry buttons
  - Handle backend errors with friendly messages and option to proceed
  - Implement error recovery that preserves other uploaded sources
  - Add error logging for debugging
  - Test all error scenarios and ensure graceful degradation
  - _Requirements: 6.6, 10.3_

- [ ]\* 11. Write component tests

  - Test SourceSelector renders all three options correctly
  - Test source selection triggers correct interface
  - Test back button returns to selector
  - Test add source shows selector with used sources marked
  - Test continue button submits data correctly
  - Test multiple sources flow
  - Test error handling and retry functionality
  - _Requirements: All requirements_

- [ ]\* 12. Conduct integration testing

  - Test complete flow: select → upload → continue
  - Test multiple sources flow: select → upload → add → upload → continue
  - Test error handling: upload fails → retry → success
  - Test manual fill flow: "I'll fill it manually" from selector → navigate directly to edit page
  - Test mobile responsive behavior
  - Test keyboard navigation and accessibility
  - _Requirements: All requirements_

- [ ] 13. Performance optimization

  - Implement lazy loading for upload interfaces
  - Add code splitting for PDF and GitHub components
  - Optimize re-renders with React.memo and useMemo
  - Debounce GitHub username search
  - Optimize image assets and icons
  - Test page load time and time to interactive
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 14. Final polish and refinement
  - Review all copy for clarity, friendliness, and conciseness (use conversational, helpful tone)
  - Ensure button and link text is action-oriented and clear (e.g., "Continue to Edit", "I'll fill it manually")
  - Ensure consistent visual design across all states
  - Test on multiple devices and browsers
  - Gather feedback and make refinements
  - Update documentation if needed
  - Remove old wizard components if no longer used
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

# Implementation Plan

- [x] 1. Extend backend portfolio schema with layout settings

  - Add LayoutSettings model to portfolio schema with layout_mode and default_layout fields
  - Update PortfolioData model to include optional layout_settings field with proper defaults
  - Ensure backward compatibility with existing portfolio data
  - _Requirements: 2.6, 5.1, 5.3, 5.5_

- [x] 2. Create LayoutSwitcher component with elegant design

  - Implement toggle button component with smooth animations using Framer Motion
  - Apply consistent theming using OKLCH color palette and existing CSS variables
  - Add hover states, focus indicators, and smooth transitions matching existing UI patterns
  - Use typography system for consistent text sizing and implement responsive design
  - _Requirements: 1.1, 1.2, 1.3, 4.2, 4.3_

- [x] 3. Implement PortfolioLayoutContainer orchestration component

  - Create main container component that manages layout switching logic
  - Implement layout preference resolution based on user settings and visitor permissions
  - Add session-based layout state management using React hooks
  - Integrate with existing ErrorBoundary for graceful error handling
  - _Requirements: 1.4, 3.1, 3.2, 3.4, 4.4_

- [x] 4. Create LayoutSettingsPanel for user configuration

  - Build settings interface with radio button groups using existing design patterns
  - Implement default layout selection with conditional rendering when "both" is selected
  - Add save/cancel functionality with loading states and error handling
  - Apply consistent styling with existing form components and validation patterns
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Enhance TraditionalPortfolio component theming consistency

  - Update traditional layout components to use consistent OKLCH color variables
  - Improve conditional rendering logic to hide empty sections gracefully
  - Ensure typography consistency with chat mode using shared typography system
  - Add ambient background gradients and subtle grid overlays matching chat mode aesthetic
  - _Requirements: 1.5, 4.1, 4.3, 4.4_

- [x] 6. Integrate layout switching with existing data providers

  - Extend existing data provider interfaces to handle layout settings
  - Update portfolio data fetching to include layout preferences in API responses
  - Implement layout settings persistence using existing PUT /portfolio/ endpoint
  - Add proper error handling and fallback logic for missing or invalid settings
  - _Requirements: 2.6, 3.3, 5.2, 5.4_

- [x] 7. Create unified portfolio display component

  - Build main component that combines LayoutSwitcher and layout containers
  - Implement conditional rendering based on user settings and permissions
  - Add smooth transitions between layouts using Framer Motion layoutId
  - Ensure proper data flow and state synchronization between components
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [x] 8. Add layout settings to portfolio edit interface

  - Integrate LayoutSettingsPanel into existing portfolio editor
  - Add settings section with proper form validation and submission
  - Implement real-time preview of layout changes in edit mode
  - Ensure settings are saved along with other portfolio data
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 9. Update frontend portfolio types and interfaces

  - Add TypeScript interfaces for layout settings and switcher props
  - Update existing PortfolioData type to include layout preferences
  - Create proper type definitions for layout state management
  - Ensure type safety across all layout-related components
  - _Requirements: 4.1, 4.4, 5.1_

- [x] 10. Implement session-based layout preference for visitors
  - Add local storage or session storage for visitor layout preferences
  - Implement logic to remember visitor's layout choice during session
  - Ensure visitor preferences don't override owner's default settings on page refresh
  - Add proper cleanup and state management for visitor sessions
  - _Requirements: 3.4, 3.5_

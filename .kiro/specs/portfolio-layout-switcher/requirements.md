# Requirements Document

## Introduction

This feature enables users to switch between different portfolio layout modes (Chat Mode and Traditional Layout) and configure their preferred display settings. The system will provide a seamless way for users to toggle between layouts while maintaining consistent theming and optional data display. Users can configure whether to show one layout exclusively, both layouts, and set a default preference.

## Requirements

### Requirement 1

**User Story:** As a portfolio owner, I want to switch between Chat Mode and Traditional Layout, so that I can present my portfolio in different formats based on my preference or audience needs.

#### Acceptance Criteria

1. WHEN viewing my portfolio THEN I SHALL see a layout switcher component that allows toggling between "Chat Mode" and "Traditional Layout"
2. WHEN I click "Switch to Traditional Layout" THEN the system SHALL display my portfolio using the traditional layout components
3. WHEN I click "Switch to Chat Mode" THEN the system SHALL display my portfolio using the chat-based interface
4. WHEN switching layouts THEN the system SHALL maintain consistent theming and styling across both modes
5. WHEN data is missing for any component THEN the system SHALL hide that specific component rather than showing empty sections

### Requirement 2

**User Story:** As a portfolio owner, I want to configure my layout preferences in settings, so that I can control which layout options are available and set my default preference.

#### Acceptance Criteria

1. WHEN accessing portfolio settings THEN I SHALL see layout preference options: "Only Chat Mode", "Only Traditional Layout", or "Both"
2. WHEN I select "Only Chat Mode" THEN visitors SHALL only see the chat interface with no layout switcher
3. WHEN I select "Only Traditional Layout" THEN visitors SHALL only see the traditional layout with no layout switcher
4. WHEN I select "Both" THEN visitors SHALL see a layout switcher allowing them to toggle between modes
5. WHEN I select "Both" THEN I SHALL be able to choose a default layout that displays first
6. WHEN I save layout preferences THEN the system SHALL use the existing PUT /portfolio/ endpoint to store this setting

### Requirement 3

**User Story:** As a portfolio visitor, I want to see the portfolio in the owner's preferred layout configuration, so that I experience the portfolio as intended by the owner.

#### Acceptance Criteria

1. WHEN visiting a portfolio THEN I SHALL see the layout mode(s) configured by the portfolio owner
2. WHEN the owner has enabled "Both" layouts THEN I SHALL see the default layout first with an option to switch
3. WHEN the owner has restricted to one layout THEN I SHALL only see that layout with no switching option
4. WHEN switching layouts as a visitor THEN my preference SHALL be remembered for the current session only
5. WHEN refreshing the page THEN I SHALL return to the owner's configured default layout

### Requirement 4

**User Story:** As a developer, I want the traditional layout to use existing components with consistent theming, so that the feature integrates seamlessly with the current design system.

#### Acceptance Criteria

1. WHEN displaying the traditional layout THEN the system SHALL use the existing traditional portfolio components from the template-components package
2. WHEN applying theming THEN both layouts SHALL use the same theme system and color schemes
3. WHEN components have no data THEN the system SHALL conditionally render only components with available data
4. WHEN an entire section has no data THEN the system SHALL hide the entire section component
5. WHEN styling components THEN the traditional layout SHALL maintain visual consistency with the chat mode design language

### Requirement 5

**User Story:** As a system administrator, I want minimal backend changes for layout preferences, so that the feature can be implemented efficiently without new endpoints.

#### Acceptance Criteria

1. WHEN storing layout preferences THEN the system SHALL extend the existing portfolio data model to include layout settings
2. WHEN saving preferences THEN the system SHALL use the existing PUT /portfolio/ endpoint without creating new API routes
3. WHEN retrieving portfolio data THEN the layout preferences SHALL be included in the standard portfolio response
4. WHEN validating layout settings THEN the system SHALL ensure only valid layout mode values are accepted
5. WHEN migrating existing portfolios THEN the system SHALL default to "Both" layout mode with "Chat Mode" as default

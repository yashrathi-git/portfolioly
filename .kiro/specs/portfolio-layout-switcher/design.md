# Design Document

## Overview

The Portfolio Layout Switcher feature enables users to toggle between Chat Mode and Traditional Layout presentations of their portfolio data. The system provides a unified interface that maintains consistent theming while offering different user experiences. Users can configure their layout preferences through settings, controlling which modes are available and setting default preferences.

## Architecture

### Component Architecture

```
PortfolioLayoutContainer
├── LayoutSwitcher (conditional)
├── ChatPortfolio (conditional)
├── TraditionalPortfolio (conditional)
└── LayoutSettingsPanel (in edit mode)
```

### Data Flow

1. **Portfolio Data Loading**: Existing data providers fetch portfolio data and layout preferences
2. **Layout Resolution**: System determines available layouts based on user settings
3. **Component Rendering**: Appropriate layout components are rendered with switcher if needed
4. **State Management**: Layout preference state is managed locally with persistence
5. **Settings Persistence**: Layout preferences are saved via existing PUT /portfolio/ endpoint

### Integration Points

- **Template Components Package**: Extends existing ChatPortfolio and TraditionalPortfolio components
- **Backend Portfolio Schema**: Adds layout preferences to existing PortfolioData model
- **Frontend Portfolio API**: Uses existing portfolio endpoints for settings persistence
- **Theme System**: Leverages existing theme infrastructure for consistent styling

## Components and Interfaces

### 1. LayoutSwitcher Component

**Purpose**: Provides UI controls for switching between layout modes

**Props Interface**:

```typescript
interface LayoutSwitcherProps {
  currentLayout: "chat" | "traditional";
  availableLayouts: ("chat" | "traditional")[];
  onLayoutChange: (layout: "chat" | "traditional") => void;
  className?: string;
}
```

**Features**:

- Toggle button design with smooth transitions
- Accessibility support (ARIA labels, keyboard navigation)
- Responsive design for mobile and desktop
- Integration with existing theme system

### 2. PortfolioLayoutContainer Component

**Purpose**: Main container that orchestrates layout switching and rendering

**Props Interface**:

```typescript
interface PortfolioLayoutContainerProps {
  portfolioData?: PortfolioData | null;
  layoutSettings?: LayoutSettings;
  isLoading?: boolean;
  error?: string;
  isOwner?: boolean; // For edit mode access
}
```

**Features**:

- Layout preference resolution
- Session-based layout state management
- Conditional rendering of switcher and layouts
- Error boundary integration

### 3. LayoutSettingsPanel Component

**Purpose**: Settings interface for configuring layout preferences

**Props Interface**:

```typescript
interface LayoutSettingsPanelProps {
  currentSettings: LayoutSettings;
  onSettingsChange: (settings: LayoutSettings) => void;
  onSave: () => Promise<void>;
  isLoading?: boolean;
}
```

**Features**:

- Radio button group for layout mode selection
- Default layout selection (when "both" is chosen)
- Save/cancel functionality
- Validation and error handling

### 4. Enhanced Portfolio Components

**ChatPortfolio Enhancement**:

- No structural changes required
- Maintains existing props interface
- Continues to use existing theme system

**TraditionalPortfolio Enhancement**:

- Theme consistency improvements
- Enhanced conditional rendering for missing data
- Maintains existing component structure

## Data Models

### Layout Settings Schema

**Frontend TypeScript**:

```typescript
interface LayoutSettings {
  layoutMode: "chat-only" | "traditional-only" | "both";
  defaultLayout: "chat" | "traditional";
  createdAt?: string;
  updatedAt?: string;
}
```

**Backend Extension** (added to existing PortfolioData):

```python
class LayoutSettings(BaseModel):
    """Layout preference settings for portfolio display."""

    layout_mode: Optional[str] = Field(
        default="both",
        description="Available layout modes: chat-only, traditional-only, both"
    )
    default_layout: Optional[str] = Field(
        default="chat",
        description="Default layout when both are available: chat, traditional"
    )

class PortfolioData(BaseModel):
    # ... existing fields ...
    layout_settings: Optional[LayoutSettings] = Field(default_factory=LayoutSettings)
```

### State Management

**Local State Structure**:

```typescript
interface LayoutState {
  currentLayout: "chat" | "traditional";
  availableLayouts: ("chat" | "traditional")[];
  settings: LayoutSettings;
  isLoading: boolean;
  error?: string;
}
```

## Error Handling

### Layout Resolution Errors

- **Missing Settings**: Default to "both" mode with "chat" as default
- **Invalid Settings**: Validate and fallback to safe defaults
- **Component Load Errors**: Use ErrorBoundary to show fallback UI

### Data Loading Errors

- **Portfolio Data Errors**: Show appropriate error states in both layouts
- **Settings Save Errors**: Display user-friendly error messages with retry options
- **Network Errors**: Implement retry logic with exponential backoff

### Graceful Degradation

- **Missing Traditional Components**: Fall back to chat-only mode
- **Theme Loading Issues**: Use system defaults
- **JavaScript Disabled**: Ensure basic functionality remains accessible

## Testing Strategy

### Unit Tests

1. **LayoutSwitcher Component**

   - Layout switching functionality
   - Accessibility compliance
   - Theme integration
   - Responsive behavior

2. **PortfolioLayoutContainer Component**

   - Layout resolution logic
   - State management
   - Conditional rendering
   - Error handling

3. **LayoutSettingsPanel Component**
   - Settings validation
   - Save/cancel functionality
   - Form state management
   - Error display

### Integration Tests

1. **Layout Switching Flow**

   - End-to-end layout switching
   - State persistence across sessions
   - Settings synchronization

2. **Data Integration**

   - Portfolio data loading with layout settings
   - Settings persistence via API
   - Error recovery scenarios

3. **Theme Consistency**
   - Visual consistency across layouts
   - Theme switching compatibility
   - Responsive design validation

### Performance Tests

1. **Component Loading**

   - Layout switching performance
   - Memory usage optimization
   - Bundle size impact

2. **Data Loading**
   - Settings fetch performance
   - Caching effectiveness
   - Network request optimization

## Implementation Phases

### Phase 1: Core Layout Switching

- Implement LayoutSwitcher component
- Create PortfolioLayoutContainer component
- Add basic layout switching functionality
- Integrate with existing theme system

### Phase 2: Settings Management

- Extend backend PortfolioData schema
- Implement LayoutSettingsPanel component
- Add settings persistence via existing API
- Create settings validation logic

### Phase 3: Enhanced Traditional Layout

- Improve TraditionalPortfolio theme consistency
- Enhance conditional rendering for missing data
- Optimize component performance
- Add accessibility improvements

### Phase 4: Polish and Testing

- Comprehensive testing suite
- Performance optimization
- Documentation updates
- User experience refinements

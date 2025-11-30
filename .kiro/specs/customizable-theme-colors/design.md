# Design Document

## Overview

This design implements a comprehensive color customization system for portfolio templates. The system extracts all hardcoded colors into a centralized configuration, stores user preferences in Firebase, provides backend APIs for management, and offers an intuitive UI for customization.

### Key Design Principles

1. **Centralization**: All color tokens in a single source of truth
2. **Flexibility**: Support for light and dark themes with independent customization
3. **Backward Compatibility**: Default colors match current design
4. **Performance**: Efficient loading and caching of color preferences
5. **User Experience**: Simple, visual interface with live preview

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Color Customization UI  │  Portfolio Components           │
│  - Color Picker          │  - ChatPortfolio                │
│  - Theme Switcher        │  - TraditionalPortfolio         │
│  - Live Preview          │  - Widgets                      │
│  - Export/Import         │                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Existing)                    │
├─────────────────────────────────────────────────────────────┤
│  GET  /settings            - Get user settings + colors    │
│  PUT  /settings            - Update settings + colors      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Firebase Firestore: user_settings collection              │
│  - username, is_public, color_preferences, etc.            │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Color Token Configuration

**File**: `packages/template-components/src/config/color-tokens.ts`

This file defines all color tokens extracted from the current implementation:

```typescript
export interface ColorTokens {
  // Base colors
  background: string;
  foreground: string;

  // Card colors
  card: string;
  cardForeground: string;

  // Popover colors
  popover: string;
  popoverForeground: string;

  // Primary colors
  primary: string;
  primaryForeground: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;

  // Muted colors
  muted: string;
  mutedForeground: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Destructive colors
  destructive: string;

  // Border and input colors
  border: string;
  input: string;
  ring: string;

  // Chart colors
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface ThemeColors {
  light: ColorTokens;
  dark: ColorTokens;
}

// Default color values (extracted from current CSS)
export const DEFAULT_COLORS: ThemeColors = {
  light: {
    background: "oklch(0.99 0 0)",
    foreground: "oklch(0.18 0 0)",
    card: "oklch(0.985 0 0)",
    cardForeground: "oklch(0.18 0 0)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.18 0 0)",
    primary: "oklch(0.28 0.02 260)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.96 0 0)",
    secondaryForeground: "oklch(0.18 0 0)",
    muted: "oklch(0.96 0 0)",
    mutedForeground: "oklch(0.48 0 0)",
    accent: "oklch(0.96 0 0)",
    accentForeground: "oklch(0.18 0 0)",
    destructive: "oklch(0.62 0.22 25)",
    border: "oklch(0.92 0 0 / 80%)",
    input: "oklch(0.92 0 0 / 85%)",
    ring: "oklch(0.72 0 0)",
    chart1: "oklch(0.64 0.22 41)",
    chart2: "oklch(0.6 0.12 185)",
    chart3: "oklch(0.46 0.08 228)",
    chart4: "oklch(0.83 0.19 84)",
    chart5: "oklch(0.77 0.19 70)",
  },
  dark: {
    background: "oklch(0.22 0.01 260)",
    foreground: "oklch(0.96 0 0)",
    card: "oklch(0.255 0.01 260)",
    cardForeground: "oklch(0.96 0 0)",
    popover: "oklch(0.26 0.01 260)",
    popoverForeground: "oklch(0.96 0 0)",
    primary: "oklch(0.88 0.03 260)",
    primaryForeground: "oklch(0.22 0.01 260)",
    secondary: "oklch(0.3 0.005 260)",
    secondaryForeground: "oklch(0.96 0 0)",
    muted: "oklch(0.3 0.005 260)",
    mutedForeground: "oklch(0.78 0 0)",
    accent: "oklch(0.32 0.01 260)",
    accentForeground: "oklch(0.96 0 0)",
    destructive: "oklch(0.66 0.18 22)",
    border: "oklch(1 0 0 / 14%)",
    input: "oklch(1 0 0 / 18%)",
    ring: "oklch(0.62 0 0)",
    chart1: "oklch(0.62 0.2 265)",
    chart2: "oklch(0.7 0.16 162)",
    chart3: "oklch(0.75 0.18 70)",
    chart4: "oklch(0.66 0.22 304)",
    chart5: "oklch(0.68 0.22 16)",
  },
};
```

### 2. Color Provider Hook

**File**: `packages/template-components/src/hooks/useColors.ts`

React hook for accessing and applying color preferences:

```typescript
export interface UseColorsReturn {
  colors: ThemeColors;
  isLoading: boolean;
  error: string | null;
  applyColors: (colors: ThemeColors) => void;
  resetColors: () => void;
  exportColors: () => string;
  importColors: (json: string) => Promise<void>;
}

export function useColors(username?: string): UseColorsReturn;
```

This hook:

- Fetches user color preferences from API
- Applies colors to CSS custom properties
- Handles caching and error states
- Provides export/import functionality

### 3. Backend Schema Extensions

**File**: `backend/app/schemas/user_settings.py`

Add color preferences to UserSettings:

```python
class ColorPreferences(BaseModel):
    """Color preferences for light and dark themes."""
    light: Dict[str, str] = Field(default_factory=dict)
    dark: Dict[str, str] = Field(default_factory=dict)

    @validator('light', 'dark')
    def validate_color_values(cls, v):
        """Validate color format (hex, rgb, hsl, oklch)."""
        for key, value in v.items():
            if not is_valid_color(value):
                raise ValueError(f"Invalid color value for {key}: {value}")
        return v

class UserSettings(BaseModel):
    # ... existing fields ...
    color_preferences: Optional[ColorPreferences] = Field(
        None, description="Custom color preferences for portfolio"
    )
```

### 4. Backend Service Extensions

**File**: `backend/app/services/user_settings_service.py`

Add methods for color management:

```python
def get_color_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
    """Get user's color preferences."""

def update_color_preferences(
    self, user_id: str, colors: Dict[str, Any]
) -> None:
    """Update user's color preferences."""

def reset_color_preferences(self, user_id: str) -> None:
    """Reset colors to defaults."""
```

### 5. Backend API Routes

**File**: `backend/app/routes/user_settings.py`

Extend existing endpoints to include color preferences:

```python
# Existing endpoint - extend response to include color_preferences
@router.get("/settings")
async def get_user_settings(user_id: str = Depends(get_current_user)):
    """Get user settings including color preferences."""
    # Returns: { username, is_public, color_preferences, ... }

# Existing endpoint - extend to accept color_preferences in update
@router.put("/settings")
async def update_user_settings(
    settings: UserSettingsUpdate,  # Now includes optional color_preferences
    user_id: str = Depends(get_current_user)
):
    """Update user settings including color preferences."""
```

No new endpoints needed - we'll extend the existing `/settings` endpoints to handle color preferences as part of the user settings object.

### 6. Color Customization UI Component

**File**: `apps/main/src/components/edit/ColorCustomizer.tsx`

Main UI component for color customization:

```typescript
interface ColorCustomizerProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export function ColorCustomizer({ onSave, onCancel }: ColorCustomizerProps) {
  // Component structure:
  // - Theme tabs (Light/Dark)
  // - Color category sections
  // - Color pickers for each token
  // - Preview panel
  // - Save/Reset/Export/Import buttons
}
```

## Data Models

### Color Preferences Storage

Firestore document structure in `user_settings` collection:

```json
{
  "user_id": "firebase_user_123",
  "username": "johndoe",
  "is_public": true,
  "color_preferences": {
    "light": {
      "background": "oklch(0.99 0 0)",
      "foreground": "oklch(0.18 0 0)",
      "primary": "oklch(0.28 0.02 260)"
      // ... all other tokens
    },
    "dark": {
      "background": "oklch(0.22 0.01 260)",
      "foreground": "oklch(0.96 0 0)",
      "primary": "oklch(0.88 0.03 260)"
      // ... all other tokens
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Color Token Categories

For UI organization:

```typescript
export const COLOR_CATEGORIES = {
  base: {
    label: "Base Colors",
    description: "Background and foreground colors",
    tokens: ["background", "foreground"],
  },
  surfaces: {
    label: "Surfaces",
    description: "Cards, popovers, and elevated surfaces",
    tokens: ["card", "cardForeground", "popover", "popoverForeground"],
  },
  interactive: {
    label: "Interactive Elements",
    description: "Buttons, links, and interactive components",
    tokens: [
      "primary",
      "primaryForeground",
      "secondary",
      "secondaryForeground",
    ],
  },
  muted: {
    label: "Muted & Accents",
    description: "Subtle backgrounds and accent colors",
    tokens: ["muted", "mutedForeground", "accent", "accentForeground"],
  },
  borders: {
    label: "Borders & Inputs",
    description: "Border colors and input fields",
    tokens: ["border", "input", "ring"],
  },
  feedback: {
    label: "Feedback",
    description: "Error and destructive actions",
    tokens: ["destructive"],
  },
  charts: {
    label: "Charts & Data Visualization",
    description: "Colors for charts and graphs",
    tokens: ["chart1", "chart2", "chart3", "chart4", "chart5"],
  },
};
```

## Error Handling

### Frontend Error Handling

1. **Loading Failures**: Show default colors, display error toast
2. **Save Failures**: Preserve user changes, show retry option
3. **Invalid Colors**: Validate before save, show inline errors
4. **Network Errors**: Implement retry logic with exponential backoff

### Backend Error Handling

1. **Invalid Color Format**: Return 400 with validation details
2. **Missing User**: Return 404 with clear message
3. **Database Errors**: Return 500, log error, maintain data integrity
4. **Concurrent Updates**: Use Firestore transactions

## Testing Strategy

### Unit Tests

1. **Color Token Extraction**: Verify all tokens extracted correctly
2. **Color Validation**: Test valid/invalid color formats
3. **Default Values**: Ensure defaults match current design
4. **Color Application**: Test CSS custom property updates

### Integration Tests

1. **API Endpoints**: Test CRUD operations for color preferences
2. **Firebase Storage**: Verify data persistence and retrieval
3. **Public Portfolio**: Test color application on public portfolios
4. **Theme Switching**: Verify light/dark theme transitions

### E2E Tests

1. **Color Customization Flow**: User selects colors, saves, sees changes
2. **Export/Import**: User exports colors, imports on another account
3. **Reset Functionality**: User resets to defaults
4. **Public View**: Visitor sees custom colors on public portfolio

## Performance Considerations

### Optimization Strategies

1. **Caching**: Cache color preferences in localStorage
2. **Lazy Loading**: Load color customizer only when needed
3. **Debouncing**: Debounce color picker changes for live preview
4. **CSS Variables**: Use CSS custom properties for instant updates
5. **Batch Updates**: Group multiple color changes into single API call

### Loading Strategy

```typescript
// Priority loading order:
// 1. Load from cache (instant)
// 2. Apply cached colors to DOM
// 3. Fetch from API in background
// 4. Update cache and DOM if different
```

## Security Considerations

1. **Authentication**: All color endpoints require authentication
2. **Validation**: Strict validation of color values
3. **Rate Limiting**: Limit color update frequency
4. **Input Sanitization**: Sanitize color strings before storage
5. **Public Access**: Public portfolios load colors without auth

## Migration Strategy

### Phase 1: Extract Colors

- Create color-tokens.ts with defaults
- Update CSS module to use tokens
- Verify no visual changes

### Phase 2: Backend Implementation

- Add schema extensions
- Implement service methods
- Create API endpoints
- Add tests

### Phase 3: Frontend Integration

- Create useColors hook
- Update components to use hook
- Test with default colors

### Phase 4: UI Implementation

- Build ColorCustomizer component
- Add to edit page
- Implement export/import
- Add documentation

### Phase 5: Public Portfolio Integration

- Load colors for public portfolios
- Test performance
- Monitor usage

## Accessibility Considerations

1. **Contrast Checking**: Warn users about low contrast ratios
2. **WCAG Compliance**: Suggest AA/AAA compliant combinations
3. **Color Blindness**: Provide color blindness simulation
4. **Keyboard Navigation**: Full keyboard support in color picker
5. **Screen Readers**: Proper ARIA labels for all controls

## Implementation Notes

### Backend Package Manager

- **Always use `uv` package manager** for all backend Python dependencies
- Commands: `uv pip install`, `uv run pytest`, etc.
- Never use pip directly

### Settings Update Strategy

- **Partial Updates**: Only send changed fields to backend, not entire settings object
- This applies to all settings updates, including color preferences
- Reduces payload size and improves performance

### Testing Strategy

- **Backend Only**: Write tests for backend color validation and storage
- **No Frontend Tests**: Skip frontend unit tests for this feature
- Focus on integration testing through manual checkpoints

### Documentation

- **No Intermediate Files**: Do not create README.md or other documentation files during implementation
- Keep implementation focused on code only
- Documentation updates happen after feature completion

## Implementation Checkpoints

The implementation will be divided into clear checkpoints for manual verification:

**Checkpoint 1**: Settings Partial Update

- Update `/edit` page to send only changed settings fields
- Verify backend receives and processes partial updates correctly
- Test with username, visibility, and other existing settings

**Checkpoint 2**: Color Token Extraction

- Extract all colors into centralized configuration file
- Update CSS module to use tokens
- Verify no visual changes in portfolio components

**Checkpoint 3**: Schema and Storage Integration

- Update backend schemas to include color_preferences
- Update frontend types to match
- Verify Firebase storage and retrieval
- Test that color preferences persist and load correctly

**Checkpoint 4**: Full Integration

- Integrate ColorCustomizer UI into edit page
- Connect all pieces (UI → API → Storage → Display)
- Test complete flow: customize → save → view public portfolio
- Verify light/dark theme switching

## Future Enhancements

1. **Color Themes**: Pre-built color themes (Ocean, Forest, Sunset, etc.)
2. **AI Suggestions**: AI-powered color palette generation
3. **Gradient Support**: Support for gradient backgrounds
4. **Animation Colors**: Customize animation and transition colors
5. **Component-Specific**: Override colors for specific components
6. **Sharing**: Share color schemes with community
7. **Version History**: Track color scheme changes over time

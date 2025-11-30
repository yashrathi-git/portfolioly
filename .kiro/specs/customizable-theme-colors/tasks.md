# Implementation Plan

## Checkpoint 1: Settings Partial Update

- [x] 1. Implement partial settings update in frontend

  - Update `apps/main/src/lib/api/portfolio.ts` to track changed fields
  - Modify settings update functions to send only changed fields
  - Update `apps/main/src/app/edit/page.tsx` to use partial updates
  - _Requirements: 2.1, 2.2_

- [x] 2. Update backend to handle partial settings updates

  - Modify `backend/app/schemas/user_settings.py` UserSettingsUpdate to make all fields optional
  - Update `backend/app/services/user_settings_service.py` update_user_settings to handle partial updates
  - Ensure only provided fields are updated in Firestore
  - _Requirements: 2.1, 2.2_

- [ ]\* 2.1 Write backend tests for partial updates
  - Test updating only username
  - Test updating only visibility
  - Test updating multiple fields
  - Test with empty update (no changes)
  - _Requirements: 2.1, 2.2_

**CHECKPOINT 1 VERIFICATION**: Manually test that changing username or visibility in edit page only sends changed fields to backend. Check network tab and Firebase to verify.

---

## Checkpoint 2: Color Token Extraction

- [ ] 3. Create centralized color token configuration

  - Create `packages/template-components/src/config/color-tokens.ts`
  - Define ColorTokens interface with all 23 color properties
  - Add detailed JSDoc comments for each token explaining its purpose and usage
  - Define ThemeColors interface (light + dark)
  - Export DEFAULT_COLORS constant with current values from CSS
  - Export COLOR_CATEGORIES for UI organization with descriptions
  - Include inline comments showing where each color is used in components
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 4. Update CSS module to use color tokens

  - Modify `packages/template-components/src/components/portfolio-theme.module.css`
  - Keep CSS custom properties but reference them from tokens
  - Ensure no visual changes occur
  - _Requirements: 1.3, 1.4_

- [ ] 5. Create color utility functions
  - Create `packages/template-components/src/lib/colors.ts`
  - Implement applyColorsToDOM function to set CSS custom properties
  - Implement validateColorFormat function (hex, rgb, hsl, oklch)
  - Implement color export/import functions (JSON)
  - _Requirements: 1.4, 1.6, 8.1, 8.2_

**CHECKPOINT 2 VERIFICATION**: Manually verify that portfolio components look identical to before. No visual changes should occur. Check both light and dark themes.

---

## Checkpoint 3: Schema and Storage Integration

- [ ] 6. Update backend schemas for color preferences

  - Add ColorPreferences model to `backend/app/schemas/user_settings.py`
  - Add color_preferences field to UserSettings model
  - Add color_preferences field to UserSettingsUpdate model
  - Implement color format validation in ColorPreferences
  - _Requirements: 2.3, 2.4, 3.1, 3.2, 3.3_

- [ ] 7. Update backend service for color management

  - Update `backend/app/services/user_settings_service.py`
  - Modify get_user_settings to include color_preferences
  - Modify update_user_settings to handle color_preferences updates
  - Add helper method to validate color preferences structure
  - _Requirements: 2.5, 3.4, 3.5_

- [ ]\* 7.1 Write backend tests for color preferences

  - Test saving valid color preferences
  - Test invalid color format rejection
  - Test partial color updates
  - Test retrieving color preferences
  - Use `uv run pytest` for all tests
  - _Requirements: 2.3, 2.4, 3.1, 3.2_

- [ ] 8. Update frontend types for color preferences

  - Create `packages/template-components/src/types/colors.ts`
  - Define ColorTokens, ThemeColors, ColorPreferences types
  - Update `packages/template-components/src/types/index.ts` UserSettings to include color_preferences
  - _Requirements: 2.1, 2.6_

- [ ] 9. Create useColors hook for color management

  - Create `packages/template-components/src/hooks/useColors.ts`
  - Implement hook to fetch color preferences from API
  - Implement applyColors function to update DOM
  - Implement resetColors function to restore defaults
  - Add caching logic using localStorage
  - Handle loading and error states
  - _Requirements: 2.1, 2.2, 2.6, 7.1, 7.2, 7.3_

- [ ] 10. Update portfolio components to use colors hook
  - Update `packages/template-components/src/components/ChatPortfolio.tsx` to use useColors
  - Update `packages/template-components/src/components/TraditionalPortfolio.tsx` to use useColors
  - Apply colors on component mount
  - Handle theme switching (light/dark)
  - _Requirements: 2.6, 7.1, 7.2, 7.3, 7.4_

**CHECKPOINT 3 VERIFICATION**: Manually test that color preferences can be saved to Firebase and retrieved. Use browser console to test setting custom colors and verify they persist after page reload. Check Firestore directly to see color_preferences field.

---

## Checkpoint 4: Full Integration

- [ ] 11. Create ColorCustomizer UI component

  - Create `apps/main/src/components/edit/ColorCustomizer.tsx`
  - Implement theme tabs (Light/Dark)
  - Implement color category sections using COLOR_CATEGORIES
  - Add color picker for each token (use native input type="color" or library)
  - Add live preview functionality
  - Add Save, Reset, Export, Import buttons
  - Show loading and error states
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 12. Integrate ColorCustomizer into edit page

  - Update `apps/main/src/app/edit/page.tsx` to include ColorCustomizer
  - Add new tab or section for "Theme Colors"
  - Connect to useColors hook for state management
  - Handle save operation with partial updates
  - Show success/error toasts
  - _Requirements: 4.1, 4.5, 4.6, 4.7_

- [ ] 13. Implement export/import functionality

  - Add export button to download colors as JSON file
  - Add import button to upload and apply JSON file
  - Validate imported JSON structure
  - Show preview before applying imported colors
  - Add confirmation dialog for import
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 14. Add contrast checking and accessibility warnings

  - Create `packages/template-components/src/lib/contrast.ts`
  - Implement WCAG contrast ratio calculation
  - Add warnings in ColorCustomizer for low contrast
  - Show AA/AAA compliance indicators
  - _Requirements: 6.1, 6.2_

- [ ] 15. Test public portfolio color application
  - Verify custom colors load on public portfolios
  - Test with missing color preferences (should use defaults)
  - Test theme switching on public portfolios
  - Verify no layout shifts or flashing
  - Test fallback behavior when colors fail to load
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

**CHECKPOINT 4 VERIFICATION**: Complete end-to-end test:

1. Open edit page and customize colors
2. Save changes and verify success message
3. View public portfolio and verify custom colors appear
4. Switch between light/dark themes
5. Export colors to JSON file
6. Import colors on different account
7. Reset colors to defaults
8. Verify all changes persist across page reloads

---

## Notes

- Do NOT create intermediate README.md or documentation files during implementation
- Always use `uv` package manager for backend operations (e.g., `uv run pytest`)
- No frontend unit tests required for this feature
- Focus on manual testing at each checkpoint
- Ensure backward compatibility - portfolios without custom colors should use defaults
- All color values should support oklch, hex, rgb, and hsl formats

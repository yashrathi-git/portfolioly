# Implementation Plan

- [x] 1. Create shared component infrastructure

  - Create `packages/template-components/src/components/shared/` directory
  - Create animation constants file for consistent timing
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [-] 2. Extract and create shared ProjectsSection component

  - [x] 2.1 Create `ProjectsSection.tsx` in shared directory

    - Extract logic from `portfolio-traditional/Projects.tsx`
    - Support both 'traditional' and 'widget' variants
    - Include project overlay modal functionality
    - Apply BlurFade animations with consistent timing
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2_

  - [x] 2.2 Refactor traditional Projects component to use ProjectsSection

    - Update `portfolio-traditional/Projects.tsx` to use shared component
    - Pass variant="traditional" prop
    - Verify existing functionality is preserved
    - _Requirements: 3.1, 9.1, 9.4_

  - [x] 2.3 Update ProjectsWidget to use ProjectsSection
    - Refactor `widgets/ProjectsWidget.tsx` to use shared component
    - Pass variant="widget" prop
    - Remove gradient backgrounds
    - Apply glass-themed styling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 3. Extract and create shared WorkExperienceSection component

  - [x] 3.1 Create `WorkExperienceSection.tsx` in shared directory

    - Extract logic from `portfolio-traditional/WorkExperience.tsx`
    - Support both 'traditional' and 'widget' variants
    - Use ResumeCard component for consistency
    - Apply BlurFade animations with consistent timing
    - Format date ranges consistently
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2_

  - [x] 3.2 Refactor traditional WorkExperience component to use WorkExperienceSection

    - Update `portfolio-traditional/WorkExperience.tsx` to use shared component
    - Pass variant="traditional" prop
    - Verify existing functionality is preserved
    - _Requirements: 4.1, 9.1, 9.4_

  - [x] 3.3 Update WorkExperienceWidget to use WorkExperienceSection
    - Refactor `widgets/WorkExperienceWidget.tsx` to use shared component
    - Pass variant="widget" prop
    - Remove gradient backgrounds and timeline styling
    - Apply glass-themed styling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 4. Enhance AboutWidget with skills tags

  - [x] 4.1 Add skills prop to AboutWidget interface

    - Update `AboutWidgetProps` to include optional `skills?: string[]`
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Implement skills tags display

    - Add skills tags section below location field
    - Use small, compact tag styling (text-xs, px-2 py-0.5)
    - Implement flex wrap layout with gap-1.5
    - Limit to 10 tags with truncation indicator if needed
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 4.3 Apply BlurFade animation to AboutWidget

    - Wrap widget in BlurFade component
    - Use consistent animation timing
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.4 Remove gradient backgrounds from AboutWidget
    - Remove gradient glow effects
    - Apply glass-themed styling
    - _Requirements: 7.3, 7.4, 7.5_

- [x] 5. Simplify SkillsWidget to tag-only display

  - [x] 5.1 Refactor SkillsWidget interface

    - Update to accept simple `skills: string[]` array
    - Remove any categorization or grouping logic
    - _Requirements: 5.1, 5.4_

  - [x] 5.2 Implement simple tag layout

    - Display skills as Badge components
    - Use flex wrap layout
    - Apply staggered BlurFade animations to each tag
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 5.3 Apply glass-themed styling
    - Remove gradient backgrounds
    - Use consistent border and background styling
    - _Requirements: 7.3, 7.4, 7.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 6. Redesign ContactWidget with streamlined layout

  - [x] 6.1 Update ContactWidget interface

    - Simplify to only linkedin, email, and github props
    - Remove other contact methods
    - _Requirements: 6.1, 6.5_

  - [x] 6.2 Implement clean contact link layout

    - Create ContactLink sub-component
    - Display only LinkedIn, Email, and GitHub
    - Use appropriate icons for each platform
    - Apply consistent styling and spacing
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 6.3 Apply glass-themed styling and animations
    - Wrap in BlurFade component
    - Remove gradient backgrounds
    - Apply hover states to contact links
    - _Requirements: 1.1, 7.3, 7.4, 7.5, 10.4_

- [x] 7. Extract and create shared EducationSection component

  - [x] 7.1 Create `EducationSection.tsx` in shared directory

    - Extract logic from `portfolio-traditional/Education.tsx`
    - Support both 'traditional' and 'widget' variants
    - Use ResumeCard component for consistency
    - Apply BlurFade animations with consistent timing
    - Format date ranges consistently
    - Handle school logos with GraduationCap fallback icon
    - Display grade information in description field
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 12.2, 12.3, 12.4, 12.5_

  - [x] 7.2 Refactor traditional Education component to use EducationSection

    - Update `portfolio-traditional/Education.tsx` to use shared component
    - Pass variant="traditional" prop
    - Verify existing functionality is preserved
    - _Requirements: 11.1, 9.1, 9.4_

  - [x] 7.3 Update EducationWidget to use EducationSection
    - Refactor `widgets/EducationWidget.tsx` to use shared component
    - Pass variant="widget" prop
    - Remove timeline styling (border-s, dots, etc.)
    - Apply glass-themed styling via shared component
    - Ensure logos display properly in widget context
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 12.2, 12.3, 12.4, 12.5, 7.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8. Verify logo URL support across all widgets

  - Verify WorkExperienceWidget displays logos correctly
  - Verify EducationWidget displays logos correctly
  - Test with missing/invalid logo URLs to ensure fallback icons work
  - Ensure logo sizing and styling is consistent
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 9. Update chat Thread component message styling

  - [x] 9.1 Apply glass theme to assistant messages

    - Update message container styling for widgets
    - Use bg-card/80 with backdrop-blur-sm
    - Remove any gradient backgrounds
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.2 Improve user message styling
    - Update sender message colors to complement glass theme
    - Use bg-primary/10 with border-primary/30
    - Ensure proper contrast and readability
    - Apply consistent padding and spacing
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Create animation constants file

  - Create `lib/constants/animations.ts`
  - Define WIDGET_BLUR_FADE_DELAY, WIDGET_ANIMATION_DURATION, etc.
  - Export constants for use across all widgets
  - Update all widgets to use shared constants
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.2_

- [x] 11. Visual polish and consistency pass
      NOTE for this task - The animation which are currently there are not even showing and not very good. Revamp them and make them better.

  - [x] 11.1 Verify typography consistency

    - Ensure all widgets use typography utility from lib/typography
    - Check heading sizes are consistent
    - Verify body text sizing
    - _Requirements: 10.1_

  - [x] 11.2 Verify spacing consistency

    - Check padding is consistent (p-5 sm:p-6)
    - Verify gap spacing between elements
    - Ensure margin consistency
    - _Requirements: 10.2_

  - [x] 11.3 Verify color palette consistency

    - Check all widgets use same color variables
    - Verify border colors are consistent
    - Ensure background opacity is uniform
    - _Requirements: 10.3_

  - [x] 11.4 Verify interactive states

    - Test hover states on all clickable elements
    - Ensure focus states are visible
    - Check transition timing is consistent
    - _Requirements: 10.4_

  - [x] 11.5 Verify border radius and shadows
    - Ensure all widgets use rounded-2xl
    - Check shadow-sm is applied consistently
    - Verify border styling matches
    - _Requirements: 10.5_

- [ ]\* 12. Testing and validation

  - [ ]\* 12.1 Visual regression testing

    - Test each widget with sample data
    - Verify animations are smooth
    - Test responsive layouts (mobile, tablet, desktop)
    - Test light and dark mode
    - Test empty states
    - Test logo display in WorkExperience and Education widgets
    - _Requirements: All_

  - [ ]\* 12.2 Component integration testing

    - Test AboutWidget with/without skills
    - Test ProjectsWidget with various project counts
    - Test WorkExperienceWidget with different data and logos
    - Test EducationWidget with different data and logos
    - Test SkillsWidget with 1, 10, 50+ skills
    - Test ContactWidget with different combinations
    - _Requirements: All_

  - [ ]\* 12.3 Performance testing

    - Verify animation performance
    - Check bundle size impact
    - Test rendering performance with many widgets
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]\* 12.4 Accessibility testing
    - Test keyboard navigation
    - Verify focus management
    - Check color contrast on glass backgrounds
    - _Requirements: 10.1, 10.3_

- [ ]\* 13. Documentation updates
  - Update component documentation with new props
  - Document shared component usage patterns
  - Add examples of glass-themed styling
  - Document animation constants
  - Document logo URL support
  - _Requirements: 9.5_

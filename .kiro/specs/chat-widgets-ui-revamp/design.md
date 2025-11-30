# Design Document

## Overview

This design document outlines the comprehensive UI revamp for chat portfolio widgets to create a sleek, professional, and consistent experience. The redesign focuses on:

1. Implementing consistent BlurFade animations across all widgets
2. Enhancing the About widget with skills tags
3. Reusing traditional portfolio components for Projects and Work Experience
4. Simplifying Skills display to tag-only format
5. Streamlining Contact widget to essential platforms
6. Applying professional glass-themed styling throughout
7. Removing gradients and creating a clean, modern aesthetic

## Architecture

### Component Hierarchy

```
ChatPortfolio
├── Thread
│   ├── Message (Assistant)
│   │   ├── AboutWidget (enhanced)
│   │   ├── ProjectsWidget (reuses Projects component)
│   │   ├── WorkExperienceWidget (reuses WorkExperience component)
│   │   ├── SkillsWidget (simplified)
│   │   ├── EducationWidget (glass-themed)
│   │   └── ContactWidget (streamlined)
│   └── Message (User)
└── Composer
```

### Shared Components Strategy

To maximize code reuse and maintain consistency:

1. **Projects**: Create a shared `ProjectsSection` component that both `TraditionalPortfolio` and `ProjectsWidget` can use
2. **Work Experience**: Create a shared `WorkExperienceSection` component for both layouts
3. **Skills**: Create a shared `SkillsTags` component for tag rendering
4. **Animation**: Use consistent BlurFade parameters across all widgets

## Components and Interfaces

### 1. Animation System

**BlurFade Configuration:**

```typescript
const WIDGET_BLUR_FADE_DELAY = 0.04;
const WIDGET_ANIMATION_DURATION = 0.4;
const WIDGET_Y_OFFSET = 6;
const WIDGET_BLUR = "6px";
```

**Implementation Pattern:**

```typescript
<BlurFade
  delay={WIDGET_BLUR_FADE_DELAY * index}
  duration={WIDGET_ANIMATION_DURATION}
  yOffset={WIDGET_Y_OFFSET}
  blur={WIDGET_BLUR}
>
  {/* Widget content */}
</BlurFade>
```

### 2. AboutWidget Enhancement

**Current Structure:**

- Profile photo
- Name
- Title
- Location
- Summary

**Enhanced Structure:**

- Profile photo
- Name
- Title
- Location
- **Skills tags (NEW)**
- Summary

**Skills Tags Design:**

```typescript
interface AboutWidgetProps {
  // ... existing props
  skills?: string[]; // NEW: array of skill strings
}
```

**Visual Design:**

- Tags positioned below location, above summary
- Small, compact size (text-xs, px-2 py-0.5)
- Flex wrap layout with gap-1.5
- Consistent with technology tags in projects
- Maximum 10 tags displayed (truncate with "..." if more)

**Styling:**

```css
.skill-tag {
  font-size: 0.75rem; /* text-xs */
  padding: 0.125rem 0.5rem; /* px-2 py-0.5 */
  border-radius: 9999px; /* rounded-full */
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
}
```

### 3. Shared Projects Component

**New Component: `ProjectsSection.tsx`**

Location: `packages/template-components/src/components/shared/ProjectsSection.tsx`

```typescript
export interface ProjectsSectionProps {
  items: DisplayProject[];
  heading?: string;
  variant?: "traditional" | "widget";
  className?: string;
}

export const ProjectsSection = ({
  items,
  heading = "Projects",
  variant = "traditional",
  className,
}: ProjectsSectionProps) => {
  // Shared implementation
  // Supports both traditional full-width and widget compact layouts
};
```

**Key Features:**

- Reuses existing project card logic
- Supports project overlay modal
- Applies BlurFade animations
- Responsive grid layout
- Hover effects and transitions

**Refactoring:**

- Extract current `Projects.tsx` logic into `ProjectsSection`
- Update `Projects.tsx` to use `ProjectsSection` with variant="traditional"
- Update `ProjectsWidget.tsx` to use `ProjectsSection` with variant="widget"

### 4. Shared Work Experience Component

**New Component: `WorkExperienceSection.tsx`**

Location: `packages/template-components/src/components/shared/WorkExperienceSection.tsx`

```typescript
export interface WorkExperienceSectionProps {
  items: DisplayWorkExperience[];
  heading?: string;
  variant?: "traditional" | "widget";
  className?: string;
}

export const WorkExperienceSection = ({
  items,
  heading = "Work Experience",
  variant = "traditional",
  className,
}: WorkExperienceSectionProps) => {
  // Shared implementation using ResumeCard
};
```

**Key Features:**

- Uses ResumeCard component
- Applies BlurFade animations
- Formats dates consistently
- Handles logo URLs
- Displays technologies as badges

**Refactoring:**

- Extract current `WorkExperience.tsx` logic into `WorkExperienceSection`
- Update `WorkExperience.tsx` to use `WorkExperienceSection` with variant="traditional"
- Update `WorkExperienceWidget.tsx` to use `WorkExperienceSection` with variant="widget"

### 4.5. Shared Education Component

**New Component: `EducationSection.tsx`**

Location: `packages/template-components/src/components/shared/EducationSection.tsx`

```typescript
export interface EducationSectionProps {
  items: DisplayEducation[];
  heading?: string;
  variant?: "traditional" | "widget";
  className?: string;
}

export const EducationSection = ({
  items,
  heading = "Education",
  variant = "traditional",
  className,
}: EducationSectionProps) => {
  // Shared implementation using ResumeCard
};
```

**Key Features:**

- Uses ResumeCard component for consistency
- Applies BlurFade animations
- Formats dates consistently
- Handles school logo URLs with fallback to GraduationCap icon
- Displays grade information in description field

**Refactoring:**

- Extract current `Education.tsx` logic into `EducationSection`
- Update `Education.tsx` to use `EducationSection` with variant="traditional"
- Update `EducationWidget.tsx` to use `EducationSection` with variant="widget"
- Remove timeline styling from EducationWidget in favor of ResumeCard layout

### 5. Skills Widget Simplification

**New Implementation:**

```typescript
export interface SkillsWidgetProps {
  heading?: string;
  skills: string[];
}

export const SkillsWidget = ({
  heading = "Skills",
  skills,
}: SkillsWidgetProps) => {
  if (!skills || skills.length === 0) return null;

  return (
    <BlurFade delay={WIDGET_BLUR_FADE_DELAY}>
      <div className="rounded-2xl border bg-card/80 backdrop-blur p-5 sm:p-6">
        <h3 className="font-semibold mb-4">{heading}</h3>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, idx) => (
            <BlurFade key={skill} delay={WIDGET_BLUR_FADE_DELAY + idx * 0.02}>
              <Badge variant="secondary">{skill}</Badge>
            </BlurFade>
          ))}
        </div>
      </div>
    </BlurFade>
  );
};
```

**Design Decisions:**

- Remove all categorization/grouping
- Simple flat list of skills
- Use Badge component for consistency
- Stagger animations for visual interest
- Clean, scannable layout

### 6. Contact Widget Redesign

**Simplified Interface:**

```typescript
export interface ContactWidgetProps {
  heading?: string;
  linkedin?: string;
  email?: string;
  github?: string;
}

export const ContactWidget = ({
  heading = "Get in Touch",
  linkedin,
  email,
  github,
}: ContactWidgetProps) => {
  // Only render if at least one contact method exists
  const hasContact = linkedin || email || github;
  if (!hasContact) return null;

  return (
    <BlurFade delay={WIDGET_BLUR_FADE_DELAY}>
      <div className="rounded-2xl border bg-card/80 backdrop-blur p-5 sm:p-6">
        <h3 className="font-semibold mb-4">{heading}</h3>
        <div className="flex flex-col gap-3">
          {linkedin && (
            <ContactLink icon={<Linkedin />} label="LinkedIn" href={linkedin} />
          )}
          {email && (
            <ContactLink
              icon={<Mail />}
              label="Email"
              href={`mailto:${email}`}
            />
          )}
          {github && (
            <ContactLink icon={<Github />} label="GitHub" href={github} />
          )}
        </div>
      </div>
    </BlurFade>
  );
};
```

**ContactLink Component:**

```typescript
const ContactLink = ({ icon, label, href }: ContactLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/50 hover:bg-secondary transition-colors"
  >
    <span className="text-muted-foreground">{icon}</span>
    <span className="font-medium">{label}</span>
  </a>
);
```

### 7. Glass Theme Styling System

**Important**: All styles are scoped to template-components package using Tailwind utility classes. No global CSS variables are modified. Styles only affect components within this package.

**Widget Container Styling:**

```typescript
const widgetBaseClasses = cn(
  "rounded-2xl border",
  "bg-card/80 backdrop-blur-sm",
  "border-border",
  "p-5 sm:p-6",
  "shadow-sm"
);
```

**Message Container Styling:**

Assistant Messages (Widgets):

```typescript
const assistantMessageClasses = cn(
  "rounded-2xl border",
  "bg-card/80 backdrop-blur-sm",
  "border-border",
  "p-4 sm:p-5",
  "shadow-sm"
);
```

User Messages:

```typescript
const userMessageClasses = cn(
  "rounded-2xl border",
  "bg-primary/10 backdrop-blur-sm",
  "border-primary/30",
  "p-4 sm:p-5",
  "ml-auto max-w-[80%]"
);
```

**Gradient Removal:**

- Remove all `bg-gradient-to-*` classes
- Remove all gradient glow effects (`.pointer-events-none.absolute` divs)
- Use solid colors with opacity for depth
- Rely on backdrop-blur for glass effect

## Data Models

### Enhanced Widget Props

**AboutWidget:**

```typescript
export interface AboutWidgetProps {
  profile_photo_url?: string;
  name?: string;
  title?: string;
  location?: string;
  summary?: string;
  skills?: string[]; // NEW
  largeImage?: boolean;
}
```

**ProjectsWidget:**

```typescript
export interface ProjectsWidgetProps {
  heading?: string;
  projects: DisplayProject[];
}
// Uses shared ProjectsSection component
```

**WorkExperienceWidget:**

```typescript
export interface WorkExperienceWidgetProps {
  heading?: string;
  items: DisplayWorkExperience[];
}
// Uses shared WorkExperienceSection component
```

**SkillsWidget:**

```typescript
export interface SkillsWidgetProps {
  heading?: string;
  skills: string[];
}
```

**ContactWidget:**

```typescript
export interface ContactWidgetProps {
  heading?: string;
  linkedin?: string;
  email?: string;
  github?: string;
}
```

## Error Handling

### Missing Data Scenarios

1. **Empty Skills Array**: Don't render skills section in AboutWidget
2. **No Projects**: Don't render ProjectsWidget
3. **No Work Experience**: Don't render WorkExperienceWidget
4. **No Contact Info**: Don't render ContactWidget
5. **Invalid URLs**: Validate and sanitize all external links

### Animation Fallbacks

1. **Reduced Motion**: Respect `prefers-reduced-motion` media query
2. **Performance**: Disable animations on low-end devices if needed
3. **Hydration**: Ensure animations work correctly with SSR

## Testing Strategy

### Visual Regression Testing

1. **Widget Rendering**: Verify each widget renders correctly with sample data
2. **Animation Timing**: Ensure BlurFade animations are smooth and consistent
3. **Responsive Layout**: Test on mobile, tablet, and desktop viewports
4. **Theme Switching**: Verify glass theme works in light and dark modes
5. **Empty States**: Test widgets with missing/empty data

### Component Testing

1. **AboutWidget**: Test with/without skills, various photo sizes
2. **ProjectsWidget**: Test project cards, overlay modal, empty state
3. **WorkExperienceWidget**: Test with various date formats, logos
4. **SkillsWidget**: Test with 1, 10, 50+ skills
5. **ContactWidget**: Test with different combinations of contact methods

### Integration Testing

1. **Chat Flow**: Test widget rendering in chat message context
2. **Data Mapping**: Verify portfolio data correctly maps to widget props
3. **Animation Sequence**: Test multiple widgets animating in sequence
4. **User Interactions**: Test project overlay, contact links, etc.

### Accessibility Testing

1. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
2. **Focus Management**: Test focus states for all interactive elements
3. **Color Contrast**: Ensure text meets WCAG AA standards on glass backgrounds

## Implementation Plan

### Phase 1: Shared Components (Foundation)

1. Create `shared/` directory in components
2. Extract and create `ProjectsSection.tsx`
3. Extract and create `WorkExperienceSection.tsx`
4. Create `SkillsTags.tsx` component
5. Update traditional portfolio to use shared components

### Phase 2: Widget Enhancements

1. Update `AboutWidget.tsx` with skills tags
2. Refactor `ProjectsWidget.tsx` to use `ProjectsSection`
3. Refactor `WorkExperienceWidget.tsx` to use `WorkExperienceSection`
4. Simplify `SkillsWidget.tsx` to tag-only display
5. Redesign `ContactWidget.tsx` with streamlined layout

### Phase 3: Animation System

1. Define animation constants
2. Apply BlurFade to all widgets
3. Implement staggered animations for lists
4. Add reduced-motion support
5. Test animation performance

### Phase 4: Glass Theme Styling

1. Remove all gradient backgrounds
2. Apply glass-themed styling to widgets
3. Update message container styling
4. Refine user message colors
5. Test in light and dark modes

### Phase 5: Polish and Testing

1. Visual regression testing
2. Accessibility audit
3. Performance optimization
4. Documentation updates
5. Final QA pass

## Design Decisions and Rationales

### Why Reuse Traditional Components?

**Decision**: Create shared components for Projects and Work Experience instead of duplicating code.

**Rationale**:

- Maintains visual consistency across layouts
- Reduces maintenance burden
- Ensures bug fixes apply to both contexts
- Follows DRY principle
- Makes future updates easier

### Why Remove Gradients?

**Decision**: Remove all gradient backgrounds and glow effects.

**Rationale**:

- Modern, professional aesthetic
- Better readability
- Cleaner visual hierarchy
- Reduces visual noise
- Aligns with glass theme philosophy
- Improves accessibility

### Why Simplify Skills Display?

**Decision**: Show skills as simple tags without categorization.

**Rationale**:

- Faster scanning for users
- Reduces complexity
- Consistent with other tag displays
- Works better in limited space
- Easier to maintain

### Why Limit Contact Methods?

**Decision**: Only show LinkedIn, Email, and GitHub.

**Rationale**:

- These are the most professional/relevant platforms
- Reduces clutter
- Focuses on primary contact methods
- Cleaner UI
- Most users only need these three

### Why Glass Theme?

**Decision**: Apply translucent backgrounds with backdrop blur.

**Rationale**:

- Modern, premium feel
- Creates depth without gradients
- Works well in light and dark modes
- Distinguishes widgets from background
- Professional aesthetic

### Why Consistent Animations?

**Decision**: Use BlurFade with consistent timing across all widgets.

**Rationale**:

- Creates cohesive experience
- Matches traditional portfolio
- Smooth, professional feel
- Guides user attention
- Enhances perceived performance

## File Structure

```
packages/template-components/src/
├── components/
│   ├── shared/                          # NEW: Shared components
│   │   ├── ProjectsSection.tsx          # NEW: Shared projects component
│   │   ├── WorkExperienceSection.tsx    # NEW: Shared work experience
│   │   ├── EducationSection.tsx         # NEW: Shared education component
│   │   └── SkillsTags.tsx               # NEW: Shared skills tags
│   ├── widgets/
│   │   ├── AboutWidget.tsx              # UPDATED: Add skills tags
│   │   ├── ProjectsWidget.tsx           # UPDATED: Use ProjectsSection
│   │   ├── WorkExperienceWidget.tsx     # UPDATED: Use WorkExperienceSection
│   │   ├── SkillsWidget.tsx             # UPDATED: Simplify to tags only
│   │   ├── ContactWidget.tsx            # UPDATED: Streamline to 3 platforms
│   │   └── EducationWidget.tsx          # UPDATED: Use EducationSection
│   ├── portfolio-traditional/
│   │   ├── Projects.tsx                 # UPDATED: Use ProjectsSection
│   │   ├── WorkExperience.tsx           # UPDATED: Use WorkExperienceSection
│   │   └── Education.tsx                # UPDATED: Use EducationSection
│   └── chat/
│       └── Thread.tsx                   # UPDATED: Apply glass theme to messages
└── lib/
    └── constants/
        └── animations.ts                # NEW: Animation constants
```

## Migration Path

### Backward Compatibility

All changes maintain backward compatibility:

1. **AboutWidget**: `skills` prop is optional
2. **Shared Components**: Existing components continue to work
3. **Props**: No breaking changes to existing props
4. **Styling**: CSS variables allow gradual migration

### Rollout Strategy

1. Deploy shared components first
2. Update traditional portfolio to use shared components
3. Update widgets to use shared components
4. Apply glass theme styling
5. Add animation enhancements
6. Monitor for issues and iterate

## Performance Considerations

### Animation Performance

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Implement `will-change` hints for animated elements
- Respect `prefers-reduced-motion`
- Lazy load heavy components

### Bundle Size

- Shared components reduce duplication
- Tree-shaking removes unused code
- Consider code-splitting for large widgets

### Rendering Performance

- Memoize expensive computations
- Use React.memo for pure components
- Optimize re-renders with proper key props
- Implement virtualization for long lists if needed

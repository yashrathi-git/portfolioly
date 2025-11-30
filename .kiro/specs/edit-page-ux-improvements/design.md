# Design Document

## Overview

This design document outlines the comprehensive UX/UI improvements for the portfolio edit page. The enhancement transforms the current single-page scrollable form into a modern, tabbed navigation interface with a fixed sidebar for desktop users and a responsive full-page view for mobile users. The design prioritizes usability, visual appeal, and accessibility while maintaining consistency with the existing application design system.

## Architecture

### Component Hierarchy

```
EditPage (apps/main/src/app/edit/page.tsx)
├── Header Section (Title, User Greeting, Save Button)
├── Toast Notifications (Success/Error)
└── Enhanced PortfolioEditor
    ├── Desktop Layout (≥768px)
    │   ├── NavigationSidebar (Fixed Left)
    │   │   ├── Section Navigation Items
    │   │   └── Preview Navigation Item
    │   └── Content Area (Right)
    │       ├── Active Form Section
    │       └── Preview Component
    └── Mobile Layout (<768px)
        └── Scrollable Form Sections (All visible)
```

### Layout Strategy

#### Desktop Layout (≥768px)

- **Sidebar**: Fixed position, 240px width, left side
- **Content Area**: Flexible width, right side with left margin
- **Navigation**: Vertical tab list with icons and labels
- **Active Section**: Single form section displayed at a time

#### Mobile Layout (<768px)

- **No Sidebar**: Navigation hidden completely
- **Full Width Forms**: All sections stacked vertically
- **Continuous Scroll**: Users scroll through all sections
- **Sticky Header**: Save button remains accessible

## Components and Interfaces

### 1. Enhanced PortfolioEditor Component

**File**: `apps/main/src/components/edit/PortfolioEditor.tsx`

#### New Props Interface

```typescript
export interface PortfolioEditorProps {
  initial?: PortfolioData;
  onChange?: (next: PortfolioData) => void;
  onSave?: () => Promise<void>; // New: Handle save from within editor
  isSaving?: boolean; // New: Show loading state
}
```

#### Navigation Configuration

```typescript
interface NavigationSection {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
  hasData: (data: PortfolioData) => boolean; // For completion indicator
}

const sections: NavigationSection[] = [
  {
    id: "personal",
    label: "Personal Info",
    icon: User,
    component: PersonalInfoForm,
    hasData: (data) => Boolean(data.personal_info?.full_name),
  },
  {
    id: "photo",
    label: "Profile Photo",
    icon: Camera,
    component: ProfilePhotoSection,
    hasData: (data) => Boolean(data.personal_info?.profile_photo_url),
  },
  {
    id: "profiles",
    label: "Social Links",
    icon: Link,
    component: ProfilesForm,
    hasData: (data) => (data.personal_info?.profiles?.length ?? 0) > 0,
  },
  {
    id: "experience",
    label: "Work Experience",
    icon: Briefcase,
    component: WorkExperienceForm,
    hasData: (data) => (data.work_experiences?.length ?? 0) > 0,
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderGit2,
    component: ProjectsForm,
    hasData: (data) => (data.projects?.length ?? 0) > 0,
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    component: EducationForm,
    hasData: (data) => (data.education?.length ?? 0) > 0,
  },
  {
    id: "certifications",
    label: "Certifications",
    icon: Award,
    component: CertificationsForm,
    hasData: (data) => (data.certifications?.length ?? 0) > 0,
  },
  {
    id: "context",
    label: "Additional Info",
    icon: FileText,
    component: TextBlobsForm,
    hasData: (data) =>
      Boolean(
        data.text_blobs?.achievements || data.text_blobs?.additional_context
      ),
  },
  {
    id: "layout",
    label: "Layout Settings",
    icon: Layout,
    component: LayoutSettingsForm,
    hasData: (data) => Boolean(data.layout_settings),
  },
];
```

### 2. NavigationSidebar Component

**File**: `apps/main/src/components/edit/NavigationSidebar.tsx` (New)

```typescript
interface NavigationSidebarProps {
  sections: NavigationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  portfolioData: PortfolioData;
  showPreview: boolean;
  onPreviewToggle: () => void;
}
```

#### Visual Design

- **Width**: 240px fixed
- **Position**: Fixed left side
- **Background**: Card background with subtle border
- **Padding**: 16px vertical, 12px horizontal
- **Item Height**: 44px for comfortable touch targets
- **Spacing**: 4px gap between items

#### Navigation Item States

1. **Default**: Muted text, no background
2. **Hover**: Light background, smooth transition (150ms)
3. **Active**: Primary background, white text, left border accent
4. **With Data**: Small dot indicator (green) on the right
5. **Empty**: No indicator or subtle gray dot

#### Styling Classes

```css
.nav-sidebar {
  @apply fixed left-0 top-[64px] h-[calc(100vh-64px)] w-60 
         border-r bg-card overflow-y-auto;
}

.nav-item {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-md 
         text-sm font-medium transition-all duration-150
         hover:bg-accent hover:text-accent-foreground
         focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-ring;
}

.nav-item-active {
  @apply bg-primary text-primary-foreground 
         border-l-4 border-primary-foreground/20;
}

.nav-item-indicator {
  @apply ml-auto h-2 w-2 rounded-full;
}

.nav-item-indicator-filled {
  @apply bg-green-500;
}

.nav-item-indicator-empty {
  @apply bg-muted;
}
```

### 3. Content Area Layout

**Responsive Behavior**:

```css
.content-area {
  /* Desktop: Account for sidebar */
  @apply ml-60 p-6;

  /* Mobile: Full width */
  @media (max-width: 768px) {
    @apply ml-0 p-4;
  }
}

.form-section {
  @apply max-w-4xl mx-auto;
}
```

### 4. Enhanced Save Button

**Location**: Fixed in header, top-right corner

**States**:

1. **Disabled**: No changes, gray, not clickable
2. **Enabled**: Changes detected, primary color
3. **Saving**: Loading spinner, disabled
4. **Success**: Brief green flash (handled by toast)

```typescript
<Button
  onClick={handleSave}
  disabled={saving || !hasUnsavedChanges}
  className="flex items-center gap-2 min-w-[120px]"
>
  {saving ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="h-4 w-4" />
      Save Changes
    </>
  )}
</Button>
```

### 5. Toast Notification System

**Implementation**: Use existing Sonner toast library

**Success Toast**:

```typescript
import { toast } from "sonner";

toast.success("Portfolio saved successfully!", {
  duration: 3000,
  position: "bottom-right",
});
```

**Error Toast**:

```typescript
toast.error("Failed to save portfolio", {
  description: error.message,
  duration: 5000,
  position: "bottom-right",
});
```

**Remove Alert Components**: Delete the success Alert from EditPage

## Data Models

### Active Section State

```typescript
interface EditorState {
  activeSection: string; // Current section ID
  showPreview: boolean; // Preview mode toggle
  hasUnsavedChanges: boolean;
  isSaving: boolean;
}
```

### Section Completion Tracking

```typescript
interface SectionCompletion {
  [sectionId: string]: boolean;
}

// Computed from portfolio data
const getSectionCompletion = (data: PortfolioData): SectionCompletion => {
  return sections.reduce((acc, section) => {
    acc[section.id] = section.hasData(data);
    return acc;
  }, {} as SectionCompletion);
};
```

## Visual Design Specifications

### Color Palette

- **Primary Action**: `hsl(var(--primary))` - Save button, active nav
- **Success**: `hsl(142, 76%, 36%)` - Toast, completion indicators
- **Error**: `hsl(var(--destructive))` - Error toast, validation
- **Muted**: `hsl(var(--muted))` - Inactive nav items
- **Border**: `hsl(var(--border))` - Dividers, card borders

### Typography

- **Nav Items**: 14px (text-sm), medium weight (font-medium)
- **Section Titles**: 20px (text-xl), semibold (font-semibold)
- **Form Labels**: 14px (text-sm), medium weight
- **Helper Text**: 12px (text-xs), muted color

### Spacing System

- **Section Gap**: 24px (gap-6)
- **Form Field Gap**: 16px (gap-4)
- **Card Padding**: 24px (p-6)
- **Nav Item Padding**: 10px vertical, 12px horizontal

### Animations

- **Nav Hover**: 150ms ease-in-out
- **Section Transition**: 200ms ease-in-out with fade
- **Toast**: Slide in from bottom-right
- **Button States**: 150ms ease-in-out

### Responsive Breakpoints

- **Desktop**: ≥768px (md breakpoint)
- **Mobile**: <768px

## Error Handling

### Form Validation

- **Real-time**: Validate on blur, not on every keystroke
- **Visual Feedback**: Red border, error message below field
- **Toast on Save**: Show validation errors in toast if save fails

### Network Errors

- **Save Failure**: Error toast with retry option
- **Load Failure**: Existing error handling in EditPage
- **Offline Detection**: Disable save button when offline

### State Recovery

- **Unsaved Changes**: Warn before navigation
- **Failed Save**: Keep form data, allow retry
- **Session Timeout**: Redirect to login, preserve draft in localStorage

## Accessibility

### Keyboard Navigation

- **Tab Order**: Sidebar → Content → Save button
- **Arrow Keys**: Navigate between sidebar items (optional enhancement)
- **Enter/Space**: Activate navigation items
- **Escape**: Close any open modals/dialogs

### Screen Reader Support

```typescript
<nav aria-label="Portfolio sections">
  <button
    role="tab"
    aria-selected={isActive}
    aria-controls={`section-${id}`}
    aria-label={`${label} section${hasData ? ', completed' : ', empty'}`}
  >
    {/* Nav item content */}
  </button>
</nav>

<div
  role="tabpanel"
  id={`section-${id}`}
  aria-labelledby={`tab-${id}`}
>
  {/* Form content */}
</div>
```

### Focus Management

- **Section Change**: Focus first input of new section
- **Save Success**: Announce via toast (screen reader accessible)
- **Visible Focus**: Clear focus indicators on all interactive elements

### Color Contrast

- **WCAG AA**: Minimum 4.5:1 for text
- **Active States**: Sufficient contrast for visibility
- **Icons**: Paired with text labels

## Performance Considerations

### State Management

- **Debounced Updates**: Debounce onChange handlers (300ms)
- **Memoization**: Memoize section completion calculations
- **Optimistic Updates**: Update UI before API response

### Mobile Optimization

- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Scroll Performance**: Use CSS transforms for smooth scrolling
- **Image Optimization**: Compress uploads before sending

## Implementation Notes

### Migration Strategy

1. Create new NavigationSidebar component
2. Update PortfolioEditor with responsive layout
3. Replace Alert with toast notifications
4. Add section completion indicators
5. Test responsive behavior
6. Add keyboard navigation
7. Accessibility audit

### Backward Compatibility

- Maintain existing form component interfaces
- Keep existing data structure unchanged
- Preserve all current functionality
- No breaking changes to API

### Testing Checklist

- [ ] Desktop navigation works correctly
- [ ] Mobile view displays all sections
- [ ] Section completion indicators update
- [ ] Toast notifications appear and dismiss
- [ ] Save button states work correctly
- [ ] Keyboard navigation functional
- [ ] Screen reader announces changes
- [ ] Responsive breakpoints work
- [ ] Preview functionality maintained
- [ ] Form validation works
- [ ] Unsaved changes warning works

## Mobile-First UX Enhancements

### 1. Icon-Only Buttons for Mobile

**Design Philosophy**: On mobile devices, screen real estate is precious. Icon-only buttons provide clear affordances while maximizing content space.

#### Button Variants by Viewport

**Desktop (≥768px)**:

```typescript
<Button size="sm" variant="secondary">
  <Plus className="h-4 w-4 mr-2" />
  Add Experience
</Button>

<Button size="sm" variant="destructive">
  <Trash2 className="h-4 w-4 mr-2" />
  Remove
</Button>
```

**Mobile (<768px)**:

```typescript
<Button size="icon" variant="secondary" title="Add experience">
  <Plus className="h-4 w-4" />
  <span className="sr-only">Add experience</span>
</Button>

<Button size="icon" variant="ghost" title="Remove">
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Remove</span>
</Button>
```

#### Icon Mapping

- **Add Actions**: `Plus` icon from lucide-react
- **Remove Actions**: `Trash2` icon for destructive actions
- **Close/Cancel**: `X` icon for dismissing or canceling
- **Upload**: `Upload` icon for file selection
- **Edit**: `Pencil` icon for edit actions

#### Accessibility

- Use `title` attribute for native tooltips
- Include `sr-only` span for screen readers
- Maintain minimum 44x44px touch targets
- Ensure sufficient color contrast (4.5:1 minimum)

### 2. Simplified Image Upload Components

**Current Issues**:

- Too many UI elements (preview, buttons, progress, drag area)
- Verbose button text takes up space
- Multiple error display methods

**New Design**:

#### Compact Upload Button

```typescript
interface CompactImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspectRatio?: "square" | "wide" | "portrait";
}

// Primary upload button
<div className="space-y-2">
  <Label>{label || "Image"}</Label>
  <div className="flex items-center gap-2">
    {value ? (
      <>
        <div className="relative size-16 rounded overflow-hidden border">
          <img src={value} alt="" className="object-cover w-full h-full" />
        </div>
        <Button size="sm" variant="outline" onClick={handleChoose}>
          <Upload className="h-4 w-4 mr-2" />
          Change
        </Button>
        <Button size="sm" variant="ghost" onClick={handleRemove}>
          <X className="h-4 w-4" />
        </Button>
      </>
    ) : (
      <Button size="sm" variant="outline" onClick={handleChoose}>
        <Upload className="h-4 w-4 mr-2" />
        Choose Image
      </Button>
    )}
  </div>
  {uploading && <Progress value={progress} className="h-1" />}
</div>;
```

#### Mobile Optimization

```css
@media (max-width: 768px) {
  .image-upload-button {
    @apply w-full justify-center;
  }

  .image-preview {
    @apply size-12; /* Smaller preview on mobile */
  }
}
```

#### Error Handling

- Remove all `Alert` components from image upload components
- Use `toast.error()` for all upload errors
- Show inline progress bar only (no percentage text)

```typescript
try {
  const url = await uploadImage(file);
  onChange(url);
  toast.success("Image uploaded successfully");
} catch (error) {
  toast.error("Failed to upload image", {
    description: parseError(error).userMessage,
  });
}
```

### 3. Toast-Based Error Handling

**Migration Strategy**: Replace all `Alert` components in form sections with toast notifications.

#### Error Categories

**Validation Errors**:

```typescript
toast.error("Invalid input", {
  description: "Please enter a valid email address",
  duration: 4000,
});
```

**Network Errors**:

```typescript
toast.error("Connection failed", {
  description: "Please check your internet connection and try again",
  duration: 5000,
  action: {
    label: "Retry",
    onClick: handleRetry,
  },
});
```

**Upload Errors**:

```typescript
toast.error("Upload failed", {
  description: "File size exceeds 5MB limit",
  duration: 5000,
});
```

#### Toast Configuration

```typescript
// In layout or root component
<Toaster
  position="bottom-right"
  toastOptions={{
    style: {
      background: "var(--background)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
    },
    className: "text-sm",
  }}
/>
```

### 4. Simple Date Input (MM/YYYY)

**Problem**: Native `<input type="month">` has poor browser support and inconsistent UX.

**Solution**: Custom text input with format validation.

#### Component Design

```typescript
interface SimpleDateInputProps {
  value?: DateInfo | null;
  onChange: (date: DateInfo | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SimpleDateInput({
  value,
  onChange,
  placeholder,
  disabled,
}: SimpleDateInputProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (value?.month && value?.year) {
      setInputValue(`${String(value.month).padStart(2, "0")}/${value.year}`);
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Auto-format: add slash after 2 digits
    if (val.length === 2 && !val.includes("/")) {
      val = val + "/";
    }

    // Limit to MM/YYYY format
    if (val.length > 7) {
      val = val.slice(0, 7);
    }

    setInputValue(val);
  };

  const handleBlur = () => {
    const match = inputValue.match(/^(\d{1,2})\/(\d{4})$/);

    if (!match) {
      if (inputValue) {
        toast.error("Invalid date format", {
          description: "Please use MM/YYYY format (e.g., 03/2024)",
        });
      }
      onChange(undefined);
      return;
    }

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);

    if (month < 1 || month > 12) {
      toast.error("Invalid month", {
        description: "Month must be between 01 and 12",
      });
      onChange(undefined);
      return;
    }

    onChange({ month, year });
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder || "MM/YYYY"}
      disabled={disabled}
      maxLength={7}
      className="font-mono"
    />
  );
}
```

#### Visual Design

- Use monospace font for better digit alignment
- Show placeholder "MM/YYYY" in muted color
- Auto-insert slash after 2 digits
- Validate on blur, not on every keystroke

### 5. Compact Header Design

**Current Issues**:

- Sticky header consumes vertical space
- Large padding and margins
- Buttons take up too much room

**New Design Philosophy**: Minimal, elegant, space-efficient.

#### Desktop Header (≥768px)

```typescript
<header className="border-b bg-background">
  <div className="container mx-auto px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <h1 className="text-lg font-semibold">Edit Portfolio</h1>
      <Badge variant="outline" className="text-xs">
        {hasUnsavedChanges ? "Unsaved changes" : "Saved"}
      </Badge>
    </div>

    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handlePreview}>
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!hasUnsavedChanges || saving}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save
          </>
        )}
      </Button>
    </div>
  </div>
</header>
```

**Height**: ~52px (reduced from ~80px)

#### Mobile Header (<768px)

```typescript
<header className="border-b bg-background">
  <div className="px-4 py-2 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <h1 className="text-base font-semibold">Edit</h1>
      {hasUnsavedChanges && (
        <div
          className="size-2 rounded-full bg-orange-500"
          title="Unsaved changes"
        />
      )}
    </div>

    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePreview}
        title="Preview"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={!hasUnsavedChanges || saving}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
</header>
```

**Height**: ~44px (minimal)

#### Styling

```css
.edit-header {
  /* Remove sticky positioning */
  position: relative;

  /* Minimal padding */
  @apply py-2 md:py-3;

  /* Subtle border */
  @apply border-b border-border/50;

  /* Clean background */
  @apply bg-background/95 backdrop-blur-sm;
}

.edit-header-title {
  /* Compact typography */
  @apply text-base md:text-lg font-semibold;

  /* Subtle color */
  @apply text-foreground/90;
}

.edit-header-badge {
  /* Minimal badge */
  @apply text-xs px-2 py-0.5 rounded-full;
  @apply bg-orange-500/10 text-orange-600 border-orange-500/20;
}
```

## Responsive Design System

### Breakpoint Strategy

```typescript
const breakpoints = {
  mobile: "< 768px",
  tablet: "768px - 1024px",
  desktop: "≥ 1024px",
};
```

### Component Adaptations

#### Form Cards

**Desktop**: Full padding, side-by-side fields

```css
.form-card-desktop {
  @apply p-6 space-y-4;
}

.form-grid-desktop {
  @apply grid grid-cols-2 gap-4;
}
```

**Mobile**: Reduced padding, stacked fields

```css
.form-card-mobile {
  @apply p-4 space-y-3;
}

.form-grid-mobile {
  @apply grid grid-cols-1 gap-3;
}
```

#### Button Groups

**Desktop**: Horizontal layout with text

```typescript
<div className="flex items-center gap-2">
  <Button size="sm">
    <Plus className="h-4 w-4 mr-2" />
    Add Item
  </Button>
  <Button size="sm" variant="destructive">
    <Trash2 className="h-4 w-4 mr-2" />
    Remove
  </Button>
</div>
```

**Mobile**: Icon-only, compact spacing

```typescript
<div className="flex items-center gap-1">
  <Button size="icon" variant="secondary">
    <Plus className="h-4 w-4" />
  </Button>
  <Button size="icon" variant="ghost">
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

## Visual Design Refinements

### Color Palette

- **Primary Actions**: `hsl(var(--primary))` - Save, Add buttons
- **Destructive**: `hsl(var(--destructive))` - Remove, Delete
- **Muted**: `hsl(var(--muted))` - Disabled states, placeholders
- **Success**: `hsl(142, 76%, 36%)` - Success toasts
- **Warning**: `hsl(38, 92%, 50%)` - Unsaved changes indicator

### Typography Scale

- **Header Title**: 16px mobile, 18px desktop
- **Section Titles**: 16px (text-base)
- **Form Labels**: 14px (text-sm)
- **Helper Text**: 12px (text-xs)
- **Button Text**: 14px (text-sm)

### Spacing System

- **Header Padding**: 8px mobile, 12px desktop
- **Card Padding**: 16px mobile, 24px desktop
- **Form Field Gap**: 12px mobile, 16px desktop
- **Button Gap**: 4px mobile, 8px desktop

### Animation Principles

- **Duration**: 150ms for micro-interactions, 200ms for transitions
- **Easing**: ease-in-out for smooth, natural motion
- **Toast Animations**: Slide in from bottom-right with fade
- **Button Hover**: Scale 1.02 with subtle shadow increase

## Future Enhancements

### Phase 2 Considerations

- **Auto-save**: Periodic automatic saving
- **Section Search**: Quick search/filter in sidebar
- **Progress Bar**: Overall completion percentage
- **Keyboard Shortcuts**: Cmd/Ctrl+S to save
- **Section Reordering**: Drag-and-drop navigation items
- **Collapsible Sidebar**: Toggle sidebar visibility
- **Dark Mode**: Enhanced dark mode styling
- **Section Templates**: Pre-fill sections with templates
- **Gesture Support**: Swipe gestures for mobile navigation
- **Offline Mode**: Edit portfolio offline with sync when online

## Enhanced Visual Design & Code Architecture

### Advanced Image Upload Design

**Philosophy**: Hover-based interactions, minimal permanent UI, elegant animations.

#### Compact Upload with Hover Overlay

```typescript
interface CompactImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function CompactImageUpload({
  value,
  onChange,
  label,
  size = "md",
}: CompactImageUploadProps) {
  const sizeClasses = {
    sm: "size-16",
    md: "size-20",
    lg: "size-24",
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <div className="group relative">
        {value ? (
          <div
            className={cn(
              "relative rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all duration-200",
              sizeClasses[size]
            )}
          >
            <img
              src={value}
              alt={label || "Upload"}
              className="object-cover w-full h-full"
            />

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 hover:scale-110 transition-transform"
                onClick={handleReplace}
                title="Replace image"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 hover:scale-110 transition-transform"
                onClick={handleRemove}
                title="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleChoose}
            className={cn(
              "rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 group",
              sizeClasses[size]
            )}
          >
            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
              Upload
            </span>
          </button>
        )}
      </div>

      {/* Inline progress bar (minimal) */}
      {uploading && <Progress value={progress} className="h-1" />}
    </div>
  );
}
```

**Key Features**:

- Hover overlay reveals actions (no permanent buttons cluttering UI)
- Smooth scale animations on hover for tactile feedback
- Loading state with backdrop blur for elegance
- Minimal, professional appearance
- Touch-friendly on mobile (tap to reveal actions)

### Enhanced Header with Glassmorphism

**Design Goal**: Modern, space-efficient, visually stunning.

```typescript
<header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
  <div className="container mx-auto px-4 md:px-6">
    <div className="flex h-14 md:h-16 items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <h1 className="text-base md:text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Edit Portfolio
        </h1>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 animate-in fade-in duration-200">
            <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 hidden md:inline">
              Unsaved
            </span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreview}
          className="hidden md:flex hover:bg-accent/50 transition-colors"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreview}
          className="md:hidden hover:bg-accent/50 transition-colors"
          title="Preview portfolio"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasUnsavedChanges || saving}
          className="relative overflow-hidden group"
        >
          {/* Shimmer effect during save */}
          {saving && (
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          )}
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
              <span className="hidden md:inline">Saving</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Save</span>
            </>
          )}
        </Button>
      </div>
    </div>
  </div>
</header>
```

**Features**:

- Glassmorphism with backdrop-blur for modern aesthetic
- Gradient text for visual interest
- Animated unsaved indicator with pulse effect
- Shimmer effect during save operation
- Responsive button text (icon-only on mobile)
- Height: 56px mobile, 64px desktop (compact yet elegant)

### Advanced Date Input with Visual Feedback

**Design Goal**: Clear, intuitive, with real-time validation feedback.

```typescript
export function SimpleDateInput({
  value,
  onChange,
  disabled,
  placeholder,
}: SimpleDateInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (value?.month && value?.year) {
      setInputValue(`${String(value.month).padStart(2, "0")}/${value.year}`);
      setIsValid(true);
    } else {
      setInputValue("");
      setIsValid(null);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d/]/g, ""); // Only digits and slash

    // Auto-format: add slash after 2 digits
    if (val.length === 2 && !val.includes("/")) {
      val = val + "/";
    }

    // Limit to MM/YYYY format
    if (val.length > 7) {
      val = val.slice(0, 7);
    }

    setInputValue(val);
    setIsValid(null); // Reset validation on change
  };

  const validate = () => {
    if (!inputValue) {
      setIsValid(null);
      onChange(undefined);
      return;
    }

    const match = inputValue.match(/^(\d{2})\/(\d{4})$/);
    if (!match) {
      setIsValid(false);
      toast.error("Invalid date format", {
        description: "Use MM/YYYY format (e.g., 03/2024)",
        duration: 3000,
      });
      return;
    }

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);

    if (month < 1 || month > 12) {
      setIsValid(false);
      toast.error("Invalid month", {
        description: "Month must be between 01 and 12",
        duration: 3000,
      });
      return;
    }

    setIsValid(true);
    onChange({ month, year });
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={validate}
        placeholder={placeholder || "MM/YYYY"}
        disabled={disabled}
        maxLength={7}
        className={cn(
          "font-mono pr-10 transition-all duration-200",
          isValid === true &&
            "border-emerald-500 focus-visible:ring-emerald-500/20",
          isValid === false && "border-red-500 focus-visible:ring-red-500/20"
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {isValid === true && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in duration-200" />
        )}
        {isValid === false && (
          <XCircle className="h-4 w-4 text-red-500 animate-in zoom-in duration-200" />
        )}
        {isValid === null && (
          <Calendar className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
```

**Features**:

- Visual validation feedback with color-coded borders
- Icon indicators (checkmark, error, calendar)
- Auto-formatting (adds slash automatically)
- Monospace font for better digit alignment
- Smooth animations on validation state changes
- Toast notifications for errors

### Reusable Component Architecture

**Design System Components** for consistency and maintainability:

#### 1. ActionButton Component

```typescript
interface ActionButtonProps {
  action: "add" | "remove" | "edit" | "upload" | "save";
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}

export function ActionButton({
  action,
  label,
  onClick,
  variant,
  disabled,
  loading,
}: ActionButtonProps) {
  const iconMap = {
    add: Plus,
    remove: Trash2,
    edit: Pencil,
    upload: Upload,
    save: Save,
  };

  const Icon = iconMap[action];

  return (
    <>
      {/* Desktop: Icon + Text */}
      <Button
        variant={variant}
        size="sm"
        onClick={onClick}
        disabled={disabled || loading}
        className="hidden md:flex"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Icon className="h-4 w-4 mr-2" />
        )}
        {label}
      </Button>

      {/* Mobile: Icon Only */}
      <Button
        variant={variant || "ghost"}
        size="icon"
        onClick={onClick}
        disabled={disabled || loading}
        className="md:hidden"
        title={label}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        <span className="sr-only">{label}</span>
      </Button>
    </>
  );
}
```

#### 2. FormSection Component

```typescript
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  actions,
  className,
}: FormSectionProps) {
  return (
    <Card
      className={cn(
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
```

#### 3. Custom Hooks

```typescript
// Centralized image upload logic
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    file: File,
    uploadFn: (file: File) => Promise<string>
  ) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(30);
      const optimized = await optimizeImage(file);
      setProgress(60);
      const url = await uploadFn(optimized);
      setProgress(100);
      toast.success("Image uploaded successfully");
      return url;
    } catch (err) {
      const error = parseError(err);
      setError(error.userMessage);
      toast.error("Upload failed", {
        description: error.userMessage,
      });
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return { upload, uploading, progress, error };
}

// Centralized toast notifications
export function useToast() {
  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  };

  const showError = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  };

  const showInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  };

  return { showSuccess, showError, showInfo };
}
```

### Micro-interactions & Animations

**Button Press Feedback**:

```css
.button-press {
  @apply active:scale-[0.98] transition-transform duration-100;
}
```

**Card Hover Effect**:

```css
.card-hover {
  @apply hover:shadow-md hover:-translate-y-0.5 transition-all duration-200;
}
```

**Input Focus Glow**:

```css
.input-focus {
  @apply focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200;
}
```

**Toast Animations**:

```typescript
// Sonner configuration with custom animations
<Toaster
  position="bottom-right"
  toastOptions={{
    className: "animate-in slide-in-from-bottom-5 fade-in",
    duration: 3000,
  }}
/>
```

### Elevation & Shadow System

```css
/* Level 0: Flat */
.elevation-0 {
  @apply shadow-none;
}

/* Level 1: Resting cards */
.elevation-1 {
  @apply shadow-sm;
}

/* Level 2: Hover state */
.elevation-2 {
  @apply shadow-md;
}

/* Level 3: Modals, dropdowns */
.elevation-3 {
  @apply shadow-lg;
}

/* Level 4: Tooltips, popovers */
.elevation-4 {
  @apply shadow-xl;
}
```

### Responsive Spacing System

```typescript
const spacing = {
  mobile: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },
  desktop: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
};
```

### Color Semantic System

```typescript
const semanticColors = {
  success: "hsl(142, 76%, 36%)", // Emerald-500
  error: "hsl(0, 84%, 60%)", // Red-500
  warning: "hsl(38, 92%, 50%)", // Amber-500
  info: "hsl(221, 83%, 53%)", // Blue-500
  neutral: "hsl(215, 16%, 47%)", // Slate-500
};
```

### Accessibility Enhancements

**Focus Indicators**:

```css
.focus-visible {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
}
```

**Screen Reader Support**:

```typescript
// Always include sr-only text for icon-only buttons
<Button size="icon">
  <Plus className="h-4 w-4" />
  <span className="sr-only">Add item</span>
</Button>
```

**Keyboard Navigation**:

- Tab order follows visual flow
- Enter/Space activates buttons
- Escape closes modals/dialogs
- Arrow keys navigate lists

**Color Contrast**:

- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Minimum 3:1 for UI components

### Performance Optimizations

**Component Memoization**:

```typescript
export const FormSection = React.memo(FormSectionComponent);
export const ActionButton = React.memo(ActionButtonComponent);
```

**Debounced Inputs**:

```typescript
const debouncedOnChange = useMemo(() => debounce(onChange, 300), [onChange]);
```

**Lazy Loading**:

```typescript
const PortfolioPreview = lazy(() => import("./PortfolioPreview"));
```

**Image Optimization**:

```typescript
// Use next/image for automatic optimization
<Image
  src={imageUrl}
  alt={alt}
  width={size}
  height={size}
  className="object-cover"
  loading="lazy"
/>
```

# @portfolioly/template-components Integration Guide

This guide provides step-by-step instructions for integrating the Portfolioly template components into your application.

## Table of Contents

- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [CSS Integration](#css-integration)
- [Component Usage](#component-usage)
- [TypeScript Configuration](#typescript-configuration)
- [Styling and Theming](#styling-and-theming)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Installation

### 1. Install the Package

```bash
# If using in a monorepo with workspace protocol
npm install @portfolioly/template-components@workspace:*

# Or if published to npm
npm install @portfolioly/template-components
```

### 2. Install Peer Dependencies

The package requires these peer dependencies:

```bash
npm install react@>=18 react-dom@>=18 framer-motion@^12.23.12 lucide-react@^0.544.0
```

## Basic Setup

### 1. Import Components

```tsx
import {
  ChatPortfolio,
  TraditionalPortfolio,
} from "@portfolioly/template-components";
import type {
  PortfolioData,
  Profile,
  Suggestion,
} from "@portfolioly/template-components";
```

### 2. Import Styles

**Option A: Import in your component (Recommended)**

```tsx
import "@portfolioly/template-components/style.css";
```

**Option B: Import in your global CSS**

```css
@import "@portfolioly/template-components/style.css";
```

## CSS Integration

### Tailwind CSS Setup

If you're using Tailwind CSS, add the template components source to your scanning:

```css
/* In your global CSS file */
@import "tailwindcss";
@source "path/to/node_modules/@portfolioly/template-components/src";
@import "@portfolioly/template-components/style.css";
```

### Next.js Integration

For Next.js applications, ensure CSS imports are supported (they are by default):

```tsx
// In your component or _app.tsx
import "@portfolioly/template-components/style.css";
```

## Component Usage

### Chat Portfolio

```tsx
import { ChatPortfolio } from "@portfolioly/template-components";
import type {
  Profile,
  Suggestion,
  PortfolioData,
} from "@portfolioly/template-components";

function MyPortfolio({ data }: { data: PortfolioData }) {
  const profile: Profile = {
    name: data.profile.name,
    badge: "Chat Portfolio",
    links: [
      {
        type: "github",
        href:
          data.profile.socials.find((s) => s.type === "github")?.href || "#",
      },
      {
        type: "mail",
        href: `mailto:${
          data.profile.socials.find((s) => s.type === "mail")?.href
        }`,
      },
      {
        type: "link",
        href:
          data.profile.socials.find((s) => s.type === "website")?.href || "#",
      },
    ],
  };

  const suggestions: Suggestion[] = [
    { id: "me", label: "About Me", icon: "user" },
    { id: "projects", label: "Projects", icon: "folderGit2" },
    { id: "skills", label: "Skills", icon: "wrench" },
    { id: "contact", label: "Contact", icon: "mail" },
  ];

  const presets: Record<string, string> = {
    "About Me": "I'm a passionate developer...",
    Projects: "Here are some of my recent projects...",
    Skills: "My technical skills include...",
    Contact: "Feel free to reach out...",
  };

  return (
    <ChatPortfolio
      profile={profile}
      suggestions={suggestions}
      presets={presets}
      portfolioData={data}
    />
  );
}
```

### Traditional Portfolio

```tsx
import { TraditionalPortfolio } from "@portfolioly/template-components";
import type { PortfolioData } from "@portfolioly/template-components";

function MyTraditionalPortfolio({ data }: { data: PortfolioData }) {
  return <TraditionalPortfolio data={data} />;
}
```

### Portfolio Dock (Navigation)

```tsx
import { PortfolioDock } from "@portfolioly/template-components";

function MyApp() {
  return (
    <div>
      {/* Your app content */}
      <PortfolioDock />
    </div>
  );
}
```

## TypeScript Configuration

### Data Types

The package exports comprehensive TypeScript types:

```tsx
import type {
  PortfolioData,
  PortfolioProfile,
  PortfolioProject,
  EducationItem,
  ExperienceItem,
  SocialLink,
  SocialType,
  Profile,
  Suggestion,
  Message,
  PortfolioConfig,
} from "@portfolioly/template-components";
```

### Example Data Structure

```tsx
const portfolioData: PortfolioData = {
  profile: {
    name: "John Doe",
    headline: "Full Stack Developer",
    location: "San Francisco, CA",
    profile_url: "https://example.com/photo.jpg", // optional
    socials: [
      { type: "github", href: "https://github.com/johndoe", label: "johndoe" },
      {
        type: "linkedin",
        href: "https://linkedin.com/in/johndoe",
        label: "johndoe",
      },
      {
        type: "mail",
        href: "mailto:john@example.com",
        label: "john@example.com",
      },
    ],
  },
  projects: [
    {
      name: "My Awesome Project",
      role: "Lead Developer",
      one_line_description: "A revolutionary web application",
      highlights: ["Built with React", "Deployed on AWS"],
      technologies: ["React", "TypeScript", "Node.js"],
      github: "https://github.com/johndoe/project",
      live_link: "https://project.example.com",
    },
  ],
  education: [
    {
      school: "University of Technology",
      degree: "B.S. Computer Science",
      start: "2018",
      end: "2022",
      location: "San Francisco, CA",
    },
  ],
  experience: [
    {
      companyName: "Tech Corp",
      role: "Senior Developer",
      location: "San Francisco, CA",
      start: "Jan 2022",
      end: "Present",
      points: ["Led development of key features", "Mentored junior developers"],
    },
  ],
  skills: ["React", "TypeScript", "Node.js"],
  achievements: ["Winner - Hackathon 2023"],
  certificates: ["AWS Certified Developer"],
};
```

## Styling and Theming

### Custom Theme

The components come with a built-in portfolio theme that provides:

- **Light Mode**: Warmer neutrals, softer borders
- **Dark Mode**: Softer dark palette with better legibility
- **Scoped Styling**: Isolated from your app's theme using CSS modules

### Scrollbar Utilities

The package includes thin scrollbar utilities:

```tsx
<div className="thin-scrollbar">{/* Content with custom scrollbars */}</div>
```

### CSS Custom Properties

The portfolio theme uses these CSS custom properties:

```css
/* Light mode */
--background: oklch(0.99 0 0);
--foreground: oklch(0.18 0 0);
--card: oklch(0.985 0 0);
--primary: oklch(0.28 0.02 260);
/* ... and more */

/* Dark mode */
.dark {
  --background: oklch(0.22 0.01 260);
  --foreground: oklch(0.96 0 0);
  /* ... and more */
}
```

## Configuration

### Portfolio Configuration

```tsx
import { defaultPortfolioConfig } from "@portfolioly/template-components";
import type { PortfolioConfig } from "@portfolioly/template-components";

const config: PortfolioConfig = {
  enableChatPortfolio: true,
  enableTraditionalPortfolio: true,
};
```

## Troubleshooting

### Common Issues

#### 1. Styles Not Loading

**Problem**: Portfolio components don't have the correct styling.

**Solution**: Ensure you're importing the CSS:

```tsx
import "@portfolioly/template-components/style.css";
```

#### 2. TypeScript Errors

**Problem**: TypeScript can't find type declarations.

**Solution**: Ensure the package is properly installed and types are imported:

```tsx
import type { PortfolioData } from "@portfolioly/template-components";
```

#### 3. CSS Module Issues

**Problem**: CSS modules not working in your build system.

**Solution**: The package handles CSS modules internally. Just import the compiled CSS:

```tsx
import "@portfolioly/template-components/style.css";
```

#### 4. Peer Dependency Warnings

**Problem**: Missing peer dependencies.

**Solution**: Install all required peer dependencies:

```bash
npm install react@>=18 react-dom@>=18 framer-motion@^12.23.12 lucide-react@^0.544.0
```

### Build Configuration

#### Vite

```ts
// vite.config.ts
export default defineConfig({
  // CSS modules are handled automatically
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
```

#### Next.js

```ts
// next.config.ts
const nextConfig = {
  // CSS imports are supported by default
  experimental: {
    // Enable if using CSS modules in your own code
    cssModules: true,
  },
};
```

## API Reference

### Components

#### `<ChatPortfolio>`

Interactive chat-style portfolio interface.

**Props:**

- `profile: Profile` - User profile information
- `suggestions: Suggestion[]` - Chat suggestions
- `presets: Record<string, string>` - Preset responses
- `portfolioData: PortfolioData` - Complete portfolio data

#### `<TraditionalPortfolio>`

Traditional portfolio layout.

**Props:**

- `data: PortfolioData` - Complete portfolio data

#### `<PortfolioDock>`

Navigation dock for switching between portfolio views.

**Props:** None (uses configuration)

### Types

#### `PortfolioData`

Main data structure containing all portfolio information.

#### `Profile`

Chat profile configuration for the chat interface.

#### `Suggestion`

Chat suggestion with icon and label.

### Utilities

#### `cn(...inputs: ClassValue[])`

Utility function for combining class names (re-exported from clsx + tailwind-merge).

## Best Practices

1. **Always import the CSS** to ensure proper styling
2. **Use TypeScript types** for better development experience
3. **Provide complete data** for the best user experience
4. **Test in both light and dark modes** to ensure proper theming
5. **Keep suggestions concise** for better chat UX
6. **Provide meaningful presets** for chat responses

## Support

For issues and questions:

1. Check this integration guide
2. Review the troubleshooting section
3. Check the component source code for implementation details
4. Ensure all peer dependencies are installed and up to date

## Version Compatibility

- **React**: >=18
- **TypeScript**: ^5
- **Node.js**: >=16
- **Next.js**: >=13 (if using Next.js)
- **Vite**: >=4 (if using Vite)

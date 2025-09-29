# @portfolioly/template-components Integration Guide

This comprehensive guide provides step-by-step instructions for integrating the Portfolioly template components into your application.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Component Usage](#component-usage)
- [Advanced Configuration](#advanced-configuration)
- [Data Providers](#data-providers)
- [TypeScript Configuration](#typescript-configuration)
- [Styling and Theming](#styling-and-theming)
- [Server-Side Rendering](#server-side-rendering)
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

## Quick Start

### Basic Chat Portfolio

```tsx
import {
  ChatPortfolio,
  TemplateProvider,
  PortfolioProvider,
} from "@portfolioly/template-components";
import "@portfolioly/template-components/style.css";

function MyPortfolio({ data }) {
  const profile = {
    name: data.profile?.name,
    badge: data.profile?.name ? "Chat Portfolio" : undefined,
    links: data.profile?.socials?.map((social) => ({
      type: social.type,
      href: social.href,
    })),
  };

  const suggestions = [
    { id: "me", label: "About Me", icon: "user" },
    { id: "projects", label: "Projects", icon: "folderGit2" },
    { id: "skills", label: "Skills", icon: "wrench" },
    { id: "contact", label: "Contact", icon: "mail" },
  ];

  const presets = {
    "About Me": profile.name
      ? `I'm ${profile.name}.`
      : "Tell me what you'd like to know!",
  };

  return (
    <TemplateProvider>
      <PortfolioProvider portfolioData={data}>
        <ChatPortfolio
          profile={profile}
          suggestions={suggestions}
          presets={presets}
        />
      </PortfolioProvider>
    </TemplateProvider>
  );
}
```

### Basic Traditional Portfolio

```tsx
import {
  TraditionalPortfolio,
  TemplateProvider,
  PortfolioProvider,
} from "@portfolioly/template-components";
import "@portfolioly/template-components/style.css";

function MyTraditionalPortfolio({ data }) {
  return (
    <TemplateProvider>
      <PortfolioProvider portfolioData={data}>
        <TraditionalPortfolio />
      </PortfolioProvider>
    </TemplateProvider>
  );
}
```

## Component Usage

### Available Components

The package exports several components for different use cases:

```tsx
import {
  // Main portfolio components
  ChatPortfolio,
  TraditionalPortfolio,
  PortfolioDock,

  // UI components
  ThemeToggle,
  UsernameSelector,
  VisibilityToggle,
  ErrorBoundary,

  // Chat components (for custom implementations)
  Composer,
  EmptyState,
  Header,
  Thread,
  Suggestions,

  // Data and configuration
  TemplateProvider,
  PortfolioProvider,
} from "@portfolioly/template-components";
```

### Chat Portfolio with Custom Configuration

```tsx
import { ChatPortfolio } from "@portfolioly/template-components";
import type {
  PortfolioData,
  Profile,
  Suggestion,
} from "@portfolioly/template-components";

function CustomChatPortfolio({ data }: { data: PortfolioData }) {
  const profile: Profile = {
    name: data.profile.name,
    badge: "Software Engineer",
    links: data.profile.socials.map((social) => ({
      type: social.type,
      href: social.href,
    })),
  };

  // Dynamic suggestions based on available data
  const suggestions: Suggestion[] = [
    { id: "me", label: "About Me", icon: "user" },
    ...(data.projects.length > 0
      ? [{ id: "projects", label: "Projects", icon: "folderGit2" }]
      : []),
    ...(data.experience && data.experience.length > 0
      ? [{ id: "experience", label: "Experience", icon: "briefcase" }]
      : []),
    ...(data.education.length > 0
      ? [{ id: "education", label: "Education", icon: "graduationCap" }]
      : []),
    ...(data.skills && data.skills.length > 0
      ? [{ id: "skills", label: "Skills", icon: "wrench" }]
      : []),
    { id: "contact", label: "Contact", icon: "mail" },
  ];

  // Dynamic presets based on actual data
  const presets: Record<string, string> = {
    "About Me": `I'm ${data.profile.name}, ${data.profile.headline}. ${
      data.profile.location ? `Based in ${data.profile.location}.` : ""
    } I'm passionate about creating innovative solutions and building great user experiences.`,

    ...(data.projects.length > 0 && {
      Projects: `I've worked on ${data.projects.length} project${
        data.projects.length > 1 ? "s" : ""
      } including ${data.projects[0].name}. ${
        data.projects[0].highlights?.[0] || "Check out my work!"
      }`,
    }),

    ...(data.experience &&
      data.experience.length > 0 && {
        Experience: `I'm currently working as ${data.experience[0].role} at ${
          data.experience[0].companyName
        }. ${
          data.experience[0].points?.[0] ||
          "I have valuable experience in my field."
        }`,
      }),

    ...(data.education.length > 0 && {
      Education: `I studied ${data.education[0].degree} at ${data.education[0].school}. My education provided a strong foundation for my career.`,
    }),

    ...(data.skills &&
      data.skills.length > 0 && {
        Skills: `My technical skills include ${data.skills
          .slice(0, 6)
          .join(", ")}${
          data.skills.length > 6 ? ", and more" : ""
        }. I'm always learning new technologies.`,
      }),

    Contact: `Feel free to reach out via ${data.profile.socials
      .map((s) => s.type)
      .join(
        " or "
      )}. I'm always open to discussing new opportunities and interesting projects!`,
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

### Portfolio with Theme Toggle

```tsx
import { ChatPortfolio, ThemeToggle } from "@portfolioly/template-components";

function ThemedPortfolio({ data }: { data: PortfolioData }) {
  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <ChatPortfolio
        profile={profile}
        suggestions={suggestions}
        presets={presets}
        portfolioData={data}
      />
    </div>
  );
}
```

## Advanced Configuration

### Template Configuration

For advanced use cases, you can use the configuration system:

```tsx
import {
  HydrationProvider,
  ChatPortfolio,
} from "@portfolioly/template-components";
import type { TemplateConfig } from "@portfolioly/template-components/config";

const config: TemplateConfig = {
  dataSource: "api", // "api" | "json" | "hybrid"
  apiEndpoints: {
    authenticatedPortfolio: "/api/portfolio",
    publicPortfolio: "/api/public/portfolio",
    usernameCheck: "/api/public/username",
  },
  authToken: "your-jwt-token", // Optional for authenticated requests
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  enableDebugLogging: process.env.NODE_ENV === "development",
};

function ConfiguredPortfolio({ username }: { username: string }) {
  return (
    <HydrationProvider config={config} username={username}>
      <ChatPortfolio
        profile={profile}
        suggestions={suggestions}
        presets={presets}
        portfolioData={null} // Will be loaded by HydrationProvider
      />
    </HydrationProvider>
  );
}
```

### Error Boundary Integration

```tsx
import { ErrorBoundary, ChatPortfolio } from "@portfolioly/template-components";

function SafePortfolio({ data }: { data: PortfolioData }) {
  return (
    <ErrorBoundary>
      <ChatPortfolio
        profile={profile}
        suggestions={suggestions}
        presets={presets}
        portfolioData={data}
      />
    </ErrorBoundary>
  );
}
```

## Data Providers

The package includes several data providers for different use cases:

### API Data Provider

```tsx
import { HydrationProvider } from "@portfolioly/template-components";
import type { TemplateConfig } from "@portfolioly/template-components/config";

const apiConfig: TemplateConfig = {
  dataSource: "api",
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
  },
};

function ApiPortfolio({ username }: { username: string }) {
  return (
    <HydrationProvider config={apiConfig} username={username}>
      <ChatPortfolio {...props} />
    </HydrationProvider>
  );
}
```

### JSON Data Provider

```tsx
const jsonConfig: TemplateConfig = {
  dataSource: "json",
  jsonFiles: {
    portfolioData: "/data/portfolio.json",
  },
};
```

### Hybrid Data Provider

```tsx
const hybridConfig: TemplateConfig = {
  dataSource: "hybrid", // API with JSON fallback
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
  },
  jsonFiles: {
    portfolioData: "/data/portfolio.json",
  },
};
```

## TypeScript Configuration

### Core Types

```tsx
import type {
  // Main data types
  PortfolioData,
  BackendPortfolioData,
  PortfolioProfile,
  PortfolioProject,

  // Individual item types
  PersonalInfo,
  WorkExperience,
  Project,
  Education,
  Certification,

  // Social and profile types
  SocialLink,
  SocialType,
  Profile,
  ProfileType,

  // Chat types
  Suggestion,
  Message,

  // Configuration types
  TemplateConfig,
  DataSourceType,

  // Utility types
  DateInfo,
  TextBlobs,
} from "@portfolioly/template-components";
```

### Data Structure Examples

#### Frontend Portfolio Data (Legacy)

```tsx
const portfolioData: PortfolioData = {
  profile: {
    name: "Alex Chen",
    headline: "Frontend Engineer",
    location: "San Francisco, CA",
    socials: [
      {
        type: "github",
        href: "https://github.com/alexchen",
        label: "alexchen",
      },
      {
        type: "linkedin",
        href: "https://linkedin.com/in/alexchen",
        label: "alexchen",
      },
      {
        type: "mail",
        href: "mailto:alex@example.com",
        label: "alex@example.com",
      },
    ],
  },
  projects: [
    {
      name: "Aura",
      role: "Creator",
      one_line_description: "A minimalist AI notes app with semantic search",
      highlights: [
        "Fast, offline-first editor with sync",
        "Semantic search and tagging",
      ],
      technologies: ["Next.js", "TypeScript", "Tailwind"],
      github: "https://github.com/alexchen/aura",
      live_link: "https://aura.example.com",
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
      companyName: "Acme Inc.",
      role: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      start: "Jan 2022",
      end: "Present",
      points: [
        "Led migration to Next.js App Router",
        "Built design system components",
      ],
    },
  ],
  skills: ["React", "Next.js", "TypeScript", "Tailwind"],
  achievements: ["Winner – Hackathon XYZ 2024"],
  certificates: ["AWS Certified Cloud Practitioner"],
};
```

#### Backend Portfolio Data (Current)

```tsx
const backendData: BackendPortfolioData = {
  personal_info: {
    full_name: "Alex Chen",
    headline: "Frontend Engineer",
    summary: "Passionate about creating beautiful, functional UIs",
    email: "alex@example.com",
    location: "San Francisco, CA",
    profiles: [
      {
        type: "github",
        url: "https://github.com/alexchen",
        label: "alexchen",
      },
      {
        type: "linkedin",
        url: "https://linkedin.com/in/alexchen",
        label: "alexchen",
      },
    ],
  },
  work_experiences: [
    {
      organization: "Acme Inc.",
      title: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      start_date: { month: 1, year: 2022 },
      is_current: true,
      highlights: [
        "Led migration to Next.js App Router",
        "Built design system components",
      ],
      technologies: ["React", "Next.js", "TypeScript"],
    },
  ],
  projects: [
    {
      name: "Aura",
      role: "Creator",
      highlights: [
        "Fast, offline-first editor with sync",
        "Semantic search and tagging",
      ],
      technologies: ["Next.js", "TypeScript", "Tailwind"],
      github: "https://github.com/alexchen/aura",
      live_link: "https://aura.example.com",
    },
  ],
  education: [
    {
      institution: "University of Technology",
      degree: "B.S. Computer Science",
      start_date: { month: 9, year: 2018 },
      end_date: { month: 5, year: 2022 },
      location: "San Francisco, CA",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Cloud Practitioner",
      link: "https://aws.amazon.com/certification/",
    },
  ],
  text_blobs: {
    achievements: "Winner – Hackathon XYZ 2024\nSpeaker – JSConf Mini on RSC",
    additional_context: "Passionate about performance and accessibility",
  },
};
```

## Styling and Theming

### CSS Integration

**Option 1: Component-level import (Recommended)**

```tsx
import "@portfolioly/template-components/style.css";
```

**Option 2: Global CSS import**

```css
/* In your global CSS file */
@import "@portfolioly/template-components/style.css";
```

### Custom Styling

The components use CSS modules for scoped styling. You can override styles using CSS custom properties:

```css
/* Custom theme overrides */
:root {
  --portfolio-primary: #your-color;
  --portfolio-background: #your-bg-color;
  --portfolio-foreground: #your-text-color;
}

.dark {
  --portfolio-primary: #your-dark-color;
  --portfolio-background: #your-dark-bg;
  --portfolio-foreground: #your-dark-text;
}
```

### Tailwind CSS Integration

If using Tailwind CSS, the components work seamlessly:

```tsx
// The components include their own Tailwind classes
// No additional configuration needed
import { ChatPortfolio } from "@portfolioly/template-components";
```

## Server-Side Rendering

### Next.js App Router

```tsx
// app/portfolio/[username]/page.tsx
import { getServerSidePortfolioProps } from "@portfolioly/template-components/providers";
import { ChatPortfolio } from "@portfolioly/template-components";
import type { TemplateConfig } from "@portfolioly/template-components/config";

const config: TemplateConfig = {
  dataSource: "api",
  apiEndpoints: {
    publicPortfolio: "/api/public/portfolio",
  },
};

export default async function PortfolioPage({
  params,
}: {
  params: { username: string };
}) {
  const { portfolioData, notFound } = await getServerSidePortfolioProps(
    config,
    params.username
  );

  if (notFound) {
    return <div>Portfolio not found</div>;
  }

  return (
    <ChatPortfolio
      profile={profile}
      suggestions={suggestions}
      presets={presets}
      portfolioData={portfolioData}
    />
  );
}
```

### Static Generation

```tsx
// For static site generation
import {
  getStaticPortfolioPaths,
  getStaticPortfolioProps,
} from "@portfolioly/template-components/providers";

export async function generateStaticParams() {
  const paths = await getStaticPortfolioPaths(config);
  return paths.map((username) => ({ username }));
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}) {
  const { portfolioData } = await getStaticPortfolioProps(
    config,
    params.username
  );

  return {
    title: `${portfolioData?.profile.name} - Portfolio`,
    description: portfolioData?.profile.headline,
  };
}
```

## Troubleshooting

### Common Issues

#### 1. Styles Not Loading

**Problem**: Components appear unstyled.

**Solutions**:

- Ensure CSS import: `import "@portfolioly/template-components/style.css"`
- Check build configuration for CSS handling
- Verify no conflicting CSS resets

#### 2. TypeScript Errors

**Problem**: Type errors when using components.

**Solutions**:

```tsx
// Ensure proper type imports
import type { PortfolioData } from "@portfolioly/template-components";

// Use type assertions if needed
const data = portfolioData as PortfolioData;
```

#### 3. Hydration Mismatches (SSR)

**Problem**: Server/client rendering differences.

**Solutions**:

```tsx
// Use dynamic imports for client-only components
import dynamic from "next/dynamic";

const ChatPortfolio = dynamic(
  () =>
    import("@portfolioly/template-components").then((mod) => mod.ChatPortfolio),
  { ssr: false }
);
```

#### 4. Performance Issues

**Problem**: Slow rendering with large datasets.

**Solutions**:

```tsx
// Use React.memo for expensive components
import { memo } from "react";

const MemoizedChatPortfolio = memo(ChatPortfolio);

// Implement virtualization for large lists
// Consider data pagination
```

### Build Configuration

#### Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  optimizeDeps: {
    include: ["@portfolioly/template-components"],
  },
});
```

#### Next.js

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@portfolioly/template-components"],
  experimental: {
    optimizePackageImports: ["@portfolioly/template-components"],
  },
};

module.exports = nextConfig;
```

#### Webpack

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
```

## API Reference

### Components

#### `<ChatPortfolio>`

Interactive chat-style portfolio interface.

**Props:**

- `profile: Profile` - User profile for chat header
- `suggestions: Suggestion[]` - Chat suggestion buttons
- `presets: Record<string, string>` - Preset responses for suggestions
- `portfolioData: PortfolioData` - Complete portfolio data

#### `<TraditionalPortfolio>`

Traditional portfolio layout.

**Props:**

- `data: PortfolioData` - Complete portfolio data

#### `<PortfolioDock>`

Navigation dock component.

**Props:** None (uses internal configuration)

#### `<ThemeToggle>`

Dark/light mode toggle button.

**Props:** None

#### `<ErrorBoundary>`

Error boundary wrapper for components.

**Props:**

- `children: ReactNode` - Components to wrap
- `fallback?: ReactNode` - Custom error UI

### Providers

#### `<HydrationProvider>`

Data provider for server-side rendering and client hydration.

**Props:**

- `config: TemplateConfig` - Configuration object
- `username?: string` - Username for data fetching
- `initialData?: PortfolioData` - Initial data for SSR
- `children: ReactNode` - Child components

### Utilities

#### `cn(...inputs: ClassValue[])`

Utility for combining CSS classes.

```tsx
import { cn } from "@portfolioly/template-components";

const className = cn("base-class", condition && "conditional-class");
```

#### Data Mapping Utilities

```tsx
import {
  mapBackendToFrontend,
  mapFrontendToBackend,
} from "@portfolioly/template-components/utils";

// Convert backend data to frontend format
const frontendData = mapBackendToFrontend(backendData);

// Convert frontend data to backend format
const backendData = mapFrontendToBackend(frontendData);
```

### Configuration Types

#### `TemplateConfig`

```tsx
interface TemplateConfig {
  dataSource: "api" | "json" | "hybrid";
  apiEndpoints?: {
    authenticatedPortfolio?: string;
    publicPortfolio?: string;
    usernameCheck?: string;
    setUsername?: string;
    setVisibility?: string;
  };
  jsonFiles?: {
    portfolioData?: string;
  };
  authToken?: string;
  enableCache?: boolean;
  cacheTimeout?: number;
  enableDebugLogging?: boolean;
  enableDummyData?: boolean;
}
```

## Best Practices

### Performance

1. **Use React.memo** for expensive components
2. **Implement proper loading states** during data fetching
3. **Consider virtualization** for large datasets
4. **Optimize images** in portfolio data

### Accessibility

1. **Provide alt text** for images
2. **Use semantic HTML** in custom components
3. **Test with screen readers**
4. **Ensure keyboard navigation** works properly

### SEO

1. **Use proper meta tags** for portfolio pages
2. **Implement structured data** for better search results
3. **Optimize for Core Web Vitals**
4. **Use server-side rendering** when possible

### Development

1. **Use TypeScript** for better development experience
2. **Implement error boundaries** for graceful error handling
3. **Add loading and error states** for better UX
4. **Test components** in isolation

## Version Compatibility

- **React**: >=18.0.0
- **TypeScript**: ^5.0.0
- **Node.js**: >=16.0.0
- **Next.js**: >=13.0.0 (if using Next.js)
- **Vite**: >=4.0.0 (if using Vite)

## Support

For issues and questions:

1. Check this integration guide
2. Review the [troubleshooting section](#troubleshooting)
3. Check the component source code for implementation details
4. Ensure all peer dependencies are installed and compatible

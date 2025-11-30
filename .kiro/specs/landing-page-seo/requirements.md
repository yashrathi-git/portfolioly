# Requirements Document

## Introduction

This feature implements SEO best practices for the Portfolioly landing page to improve search engine visibility, reduce JavaScript bundle size for crawlers, and enable proper indexing by search engines and AI assistants like Perplexity. The implementation follows the "Firewall of Relevance" pattern to isolate the landing page from heavy dashboard logic.

## Glossary

- **Landing_Page**: The public marketing page at the root URL (`/`) that serves as the entry point for new visitors
- **SSG (Static Site Generation)**: Pre-rendering pages at build time for optimal performance and SEO
- **JSON-LD**: JavaScript Object Notation for Linked Data, a structured data format for search engines
- **Crawl_Budget**: The number of pages search engines will crawl on a site within a given timeframe
- **First_Load_JS**: The amount of JavaScript that must be downloaded and executed before a page becomes interactive
- **AuthProvider**: The React context provider that manages Firebase authentication state
- **Route_Group**: Next.js feature using parentheses in folder names to organize routes without affecting URL structure

## Requirements

### Requirement 1

**User Story:** As a search engine crawler, I want the landing page to load without unnecessary JavaScript, so that I can efficiently index the page content.

#### Acceptance Criteria

1. WHEN the landing page is rendered THEN the Landing_Page SHALL NOT include AuthProvider in its component tree
2. WHEN the landing page is built THEN the Landing_Page SHALL be statically generated at build time
3. WHEN the landing page is served THEN the First_Load_JS SHALL be less than 100KB

### Requirement 2

**User Story:** As a search engine, I want to understand the structured data about Portfolioly, so that I can display rich results in search listings.

#### Acceptance Criteria

1. WHEN the landing page is rendered THEN the Landing_Page SHALL include JSON-LD structured data with SoftwareApplication schema
2. WHEN the JSON-LD is parsed THEN the structured data SHALL include application name, category, pricing, and description
3. WHEN the JSON-LD is parsed THEN the structured data SHALL include author information

### Requirement 3

**User Story:** As a search engine, I want proper metadata and canonical URLs, so that I can correctly index and rank the page.

#### Acceptance Criteria

1. WHEN the landing page is rendered THEN the Landing_Page SHALL include a metadataBase URL for proper Open Graph resolution
2. WHEN the landing page is rendered THEN the Landing_Page SHALL include a canonical URL pointing to the root path
3. WHEN the landing page is rendered THEN the Landing_Page SHALL include Open Graph metadata with title, description, and image
4. WHEN the landing page is rendered THEN the Landing_Page SHALL include relevant keywords for portfolio builder searches

### Requirement 4

**User Story:** As a search engine crawler, I want clear guidance on which pages to crawl, so that I can efficiently use my Crawl_Budget.

#### Acceptance Criteria

1. WHEN a crawler requests robots.txt THEN the system SHALL return a valid robots.txt file
2. WHEN the robots.txt is parsed THEN the file SHALL allow crawling of the root path
3. WHEN the robots.txt is parsed THEN the file SHALL disallow crawling of dashboard, API, and settings paths
4. WHEN the robots.txt is parsed THEN the file SHALL include a reference to the sitemap

### Requirement 5

**User Story:** As a search engine, I want a sitemap of all public pages, so that I can discover and index all relevant content.

#### Acceptance Criteria

1. WHEN a crawler requests sitemap.xml THEN the system SHALL return a valid XML sitemap
2. WHEN the sitemap is parsed THEN the sitemap SHALL include the landing page with highest priority
3. WHEN the sitemap is parsed THEN the sitemap SHALL include lastModified dates for each URL

### Requirement 6

**User Story:** As a developer, I want the landing page layout isolated from the app shell, so that SEO optimizations don't affect authenticated pages.

#### Acceptance Criteria

1. WHEN the landing page layout is rendered THEN the layout SHALL be a Server Component
2. WHEN the landing page layout is rendered THEN the layout SHALL only include SEO-critical fonts and minimal styles
3. WHEN the app shell pages are rendered THEN the pages SHALL continue to use AuthProvider and full functionality

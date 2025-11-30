# Implementation Plan

- [x] 1. Restructure layout hierarchy to isolate landing page from AuthProvider

  - [x] 1.1 Update root layout to remove RootProviders wrapper
    - Modify `apps/main/src/app/layout.tsx` to render children directly without RootProviders
    - Keep theme initialization script and preconnect hints
    - Ensure body styling remains intact
    - _Requirements: 1.1, 6.1, 6.2_
  - [x] 1.2 Update appShell layout to include RootProviders
    - Modify `apps/main/src/app/(appShell)/layout.tsx` to wrap children with RootProviders
    - Import RootProviders component
    - Ensure AuthProvider and ThemeProvider are available for dashboard pages
    - _Requirements: 6.3_

- [x] 2. Implement landing page SEO metadata and JSON-LD

  - [x] 2.1 Add comprehensive metadata to landing layout
    - Update `apps/main/src/app/(landing)/layout.tsx` with full Metadata export
    - Include metadataBase, title, description, alternates, openGraph, twitter, robots, keywords
    - Ensure layout remains a Server Component (no "use client")
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 2.2 Add JSON-LD structured data to landing layout
    - Add WebApplication schema with all required fields per Google guidelines
    - Include name, applicationCategory, offers, description, author, featureList
    - Use Next.js Script component with type="application/ld+json"
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]\* 2.3 Write property test for JSON-LD schema validity
    - **Property 1: JSON-LD Schema Validity**
    - **Property 2: JSON-LD Required Fields**
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Mark landing page as statically generated

  - [x] 3.1 Add static generation exports to landing page
    - Update `apps/main/src/app/(landing)/page.tsx` with `export const dynamic = 'force-static'`
    - Add `export const revalidate = false` to prevent revalidation
    - Remove unused FeaturesSection import
    - _Requirements: 1.2_

- [x] 4. Implement robots.txt and sitemap.xml

  - [x] 4.1 Create robots.ts configuration
    - Create `apps/main/src/app/robots.ts` with MetadataRoute.Robots export
    - Allow root path, disallow dashboard/api/settings/edit/upload paths
    - Include sitemap reference
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 4.2 Create sitemap.ts configuration
    - Create `apps/main/src/app/sitemap.ts` with MetadataRoute.Sitemap export
    - Include landing page with priority 1 and lastModified date
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]\* 4.3 Write property tests for robots and sitemap
    - **Property 3: Robots Allow Root**
    - **Property 4: Robots Disallow Protected Paths**
    - **Property 5: Robots Sitemap Reference**
    - **Property 6: Sitemap Landing Priority**
    - **Property 7: Sitemap LastModified**
    - **Validates: Requirements 4.2, 4.3, 4.4, 5.2, 5.3**

- [x] 5. Checkpoint - Verify build and bundle size

  - Ensure all tests pass, ask the user if questions arise.
  - Run `yarn build` in apps/main and verify:
    - Landing page (/) is marked with ○ (Static)
    - First Load JS for / is under 100KB
    - No build warnings about metadata
  - _Requirements: 1.2, 1.3_

- [x] 6. Final verification and cleanup

  - [x] 6.1 Test landing page in browser
    - Verify landing page loads without AuthProvider errors
    - Verify theme toggle still works (uses inline script, not provider)
    - Verify dashboard pages still have full auth functionality
    - _Requirements: 1.1, 6.3_
  - [x] 6.2 Validate structured data
    - Use Google Rich Results Test to validate JSON-LD
    - Verify all required fields are present
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Final Checkpoint - Make sure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

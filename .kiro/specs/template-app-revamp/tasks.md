# Implementation Plan

- [x] 1. Create PortfolioWrapper component in template-components

  - Create `packages/template-components/src/components/PortfolioWrapper.tsx`
  - Implement props interface extending PortfolioProps with optional portfolioData
  - Add state management for data, loading, and error
  - Implement conditional logic: use provided data OR fetch from API
  - Create PublicApiClient instance with proper configuration
  - Call getPublicPortfolioData with username and publicToken
  - Transform backend data using mapBackendToDisplay
  - Handle all error cases with proper error messages
  - Pass all props through to Portfolio component
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Export PortfolioWrapper from template-components package

  - Add export statement to `packages/template-components/src/index.ts`
  - Export PortfolioWrapperProps type
  - Verify exports are included in build output
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 3. Update template app page.tsx

  - Replace existing implementation with PortfolioWrapper usage
  - Read environment variables (username, apiBaseUrl, publicToken)
  - Remove all manual data fetching logic
  - Remove all data transformation logic
  - Keep TemplateProvider wrapper
  - Import styles from template-components
  - Ensure implementation is under 50 lines
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Update template app environment configuration

  - Update `.env.example` with clear documentation
  - Document NEXT_PUBLIC_USERNAME as required
  - Document NEXT_PUBLIC_API_BASE_URL with default value
  - Document NEXT_PUBLIC_PUBLIC_TOKEN as optional
  - Add helpful comments explaining each variable
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Clean up template app dependencies

  - Remove @portfolioly/schema from dependencies (if present)
  - Remove duplicate UI library dependencies
  - Keep only essential dependencies (Next.js, React, template-components)
  - Verify @portfolioly/template-components is workspace dependency
  - Update to match React/Next.js versions from main app
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Remove obsolete template app files

  - Delete `src/lib/api/publicPortfolio.ts` (no longer needed)
  - Delete `src/components/` directory if it exists (using template-components)
  - Keep only `src/app/` and `src/lib/env.ts`
  - Clean up any unused imports
  - _Requirements: 4.3, 4.5_

- [x] 7. Update template app env.ts helper

  - Simplify environment variable helpers
  - Make publicToken optional (return undefined if not set)
  - Keep username and apiBaseUrl helpers
  - Remove error throwing for optional publicToken
  - Add helpful error messages for required variables
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 8. Build and verify template-components package

  - Run build command for template-components
  - Verify PortfolioWrapper is in build output
  - Verify types are generated correctly
  - Check for any build errors or warnings
  - _Requirements: 7.3, 7.4_

- [ ] 9. Test template app in development mode

  - Start template app with `yarn dev`
  - Verify it loads without errors
  - Test with valid username and token
  - Test with invalid username (error handling)
  - Test with missing environment variables
  - Verify loading state displays correctly
  - Verify error state displays correctly
  - Verify portfolio renders correctly when data loads
  - _Requirements: 2.3, 2.4, 4.1, 4.2, 6.5_

- [ ] 10. Test template app build

  - Run `yarn build` for template app
  - Verify build completes without errors
  - Verify no TypeScript errors
  - Verify no missing dependency errors
  - Check build output size is reasonable
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Update template app README
  - Document the simplified setup process
  - Add environment variable configuration instructions
  - Add example usage with PortfolioWrapper
  - Document how to get a public token
  - Add troubleshooting section
  - _Requirements: 7.4_

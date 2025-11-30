# Implementation Plan

## NOTE

1. Always use `uv` package manager for backend
2. Do not create intermediate markdown files

- [x] 1. Create TypeScript portfolio schema

  - Create `apps/main/src/types/portfolio.ts` with interfaces matching backend schema
  - Define all interfaces as optional fields (DateInfo, Profile, PersonalInfo, WorkExperience, Project, Education, Certification, TextBlobs, PortfolioMetadata, PortfolioData)
  - Include ProfileType enum with all supported profile types
  - Add example data constant for development
  - _Requirements: 4.1, 4.2_

- [x] 2. Update existing edit components with correct imports

  - [x] 2.1 Update PersonalInfoForm component imports

    - Fix import paths to use new portfolio types from `@/types/portfolio`
    - Update component props to use correct TypeScript interfaces
    - Ensure form fields match PersonalInfo interface
    - _Requirements: 4.3_

  - [x] 2.2 Update ProfilesForm component imports

    - Fix import paths to use Profile and ProfileType from portfolio types
    - Update component to handle optional profile fields
    - Ensure ProfileType enum values match backend
    - _Requirements: 4.3_

  - [x] 2.3 Update WorkExperienceForm component imports

    - Fix import paths to use WorkExperience and DateInfo types
    - Update component to handle optional work experience fields
    - Ensure date handling matches DateInfo interface
    - _Requirements: 4.3_

  - [x] 2.4 Update ProjectsForm component imports

    - Fix import paths to use Project type from portfolio schema
    - Update component to handle optional project fields
    - Ensure all project properties are properly typed
    - _Requirements: 4.3_

  - [x] 2.5 Update EducationForm component imports

    - Fix import paths to use Education and DateInfo types
    - Update component to handle optional education fields
    - Ensure date handling is consistent with other forms
    - _Requirements: 4.3_

  - [x] 2.6 Update CertificationsForm component imports

    - Fix import paths to use Certification type
    - Update component to handle optional certification fields
    - Ensure proper typing for certification properties
    - _Requirements: 4.3_

  - [x] 2.7 Update TextBlobForm component imports

    - Fix import paths to use TextBlobs type
    - Update component to handle optional text blob fields
    - Ensure proper typing for unstructured text data
    - _Requirements: 4.3_

  - [x] 2.8 Update PortfolioEditor component imports
    - Fix import paths to use PortfolioData type
    - Update component to coordinate all form sections
    - Ensure proper state management for portfolio data
    - _Requirements: 4.3_

- [x] 3. Create Firebase portfolio service

  - Create `apps/main/src/lib/services/portfolioService.ts` for Firebase operations
  - Implement getUserPortfolio function to fetch user's portfolio data
  - Implement saveUserPortfolio function to persist portfolio changes
  - Add error handling for Firebase operations
  - Include user authentication checks in service methods
  - _Requirements: 1.1, 2.4_

- [ ] 4. Create protected edit page route

  - Create `apps/main/src/app/edit/page.tsx` as main edit page component
  - Implement route protection using existing auth guards
  - Add loading states for data fetching
  - Handle authentication redirects for unauthenticated users
  - _Requirements: 1.1, 5.1_

- [x] 5. Implement portfolio data management in edit page

  - Add state management for portfolio data in edit page
  - Implement data fetching on component mount using portfolioService
  - Handle loading, error, and success states for data operations
  - Add graceful handling for missing or incomplete portfolio data
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 6. Integrate PortfolioEditor with data management

  - Connect PortfolioEditor component to portfolio data state
  - Implement onChange handlers to update local state
  - Add debounced auto-save functionality for better UX
  - Handle form validation and error display
  - _Requirements: 2.1, 2.2_

- [x] 7. Implement save functionality

  - Add save button and save operation handling
  - Implement optimistic updates for better user experience
  - Add success and error notifications for save operations
  - Handle unsaved changes warning when navigating away
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 8. Create portfolio preview integration

  - Create data transformation function to convert PortfolioData to ChatPortfolio props
  - Implement preview component using ChatPortfolio from template-components
  - Add fallback content for missing portfolio data in preview
  - Ensure preview updates in real-time as user edits forms
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 9. Add responsive design and accessibility

  - Ensure edit page works properly on mobile devices
  - Implement proper keyboard navigation for all form elements
  - Add appropriate ARIA labels and descriptions for screen readers
  - Test and fix any accessibility issues with form components
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Integrate edit page with app navigation
  - Update app navigation to include link to edit page
  - Ensure edit page is only accessible to authenticated users
  - Add proper page titles and meta information
  - Test navigation flow from other parts of the application
  - _Requirements: 1.1_

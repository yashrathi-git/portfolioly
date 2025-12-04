# Implementation Plan

- [x] 1. Set up ResumeData schema and types

  - [x] 1.1 Create ResumeData TypeScript interfaces in `apps/main/src/types/resume.ts`
    - Define ResumeData, ResumePersonalInfo, ResumeWorkExperience, ResumeEducation, ResumeProject, ResumeSkills, ResumeCertification interfaces
    - Define SectionType union type
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 1.2 Create Pydantic ResumeData schema in `backend/app/schemas/resume.py`
    - Mirror TypeScript interfaces in Python
    - Add validation for required fields
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ]\* 1.3 Write property test for ResumeData schema validation
    - **Property 5: Resume Save/Load Round Trip**
    - **Validates: Requirements 6.3**

- [x] 2. Implement ResumeTransformer

  - [x] 2.1 Create ResumeTransformer in `apps/main/src/lib/resume/resumeTransformer.ts`
    - Implement `fromLinkedIn()` to convert LinkedIn extracted data to ResumeData
    - Implement `fromGitHub()` to convert GitHub repos to partial ResumeData
    - Implement `fromPortfolio()` to convert existing PortfolioData to ResumeData
    - Implement `mergeGitHubProjects()` to add GitHub repos to existing resume
    - _Requirements: 1.1, 1.2, 2.3_
  - [x] 2.2 Write property test for LinkedIn transformation
    - **Property 1: LinkedIn to ResumeData Transformation Preserves Data**
    - **Validates: Requirements 1.1, 1.2**
  - [x] 2.3 Write property test for GitHub repos in projects
    - **Property 3: Selected Repos Appear in Projects**
    - **Validates: Requirements 2.3**

- [x] 3. Checkpoint - Make sure all tests are passing

  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Resume Service (Backend)

  - [x] 4.1 Create ResumeService in `backend/app/services/resume_service.py`
    - Implement `create_resume()` with unique ID generation
    - Implement `get_resume()` for single resume retrieval
    - Implement `list_resumes()` for user's resume list
    - Implement `update_resume()` for saving changes
    - Implement `delete_resume()` for removal
    - Implement `duplicate_resume()` for copying
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 4.2 Create Resume API routes in `backend/app/routes/resume.py`
    - POST `/api/resumes` - Create new resume
    - GET `/api/resumes` - List user's resumes
    - GET `/api/resumes/{resume_id}` - Get single resume
    - PUT `/api/resumes/{resume_id}` - Update resume
    - DELETE `/api/resumes/{resume_id}` - Delete resume
    - POST `/api/resumes/{resume_id}/duplicate` - Duplicate resume
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 4.3 Write property test for unique ID generation
    - **Property 10: Resume Creation Generates Unique ID**
    - **Validates: Requirements 10.1**
  - [x] 4.4 Write property test for duplication
    - **Property 11: Resume Duplication Preserves Content**
    - **Validates: Requirements 10.3**
  - [x] 4.5 Write property test for deletion
    - **Property 12: Resume Deletion Removes from Storage**
    - **Validates: Requirements 10.4**

- [x] 5. Checkpoint - Make sure all tests are passing

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Template System

  - [x] 6.1 Create Template Registry in `apps/main/src/components/resume/templates/registry.ts`
    - Define TemplateDefinition interface
    - Create template registry with getTemplate() and getDefaultTemplate()
    - _Requirements: 9.1, 9.3_
  - [x] 6.2 Create ResumeTemplateProps interface in `apps/main/src/components/resume/templates/types.ts`
    - Define standard props interface for all templates
    - _Requirements: 9.1_
  - [x] 6.3 Create Classic Template in `apps/main/src/components/resume/templates/ClassicTemplate.tsx`
    - Implement traditional resume layout with serif fonts
    - Add print-optimized CSS with @media print
    - Use semantic HTML (h1, h2, h3) for ATS compatibility
    - _Requirements: 4.1, 7.1, 7.2, 7.3, 7.4_
  - [x] 6.4 Create Modern Template in `apps/main/src/components/resume/templates/ModernTemplate.tsx`
    - Implement clean, modern layout with sans-serif fonts
    - Add print-optimized CSS
    - Ensure ATS compatibility/
    - _Requirements: 4.1, 7.1, 7.2, 7.3, 7.4_
  - [x] 6.5 Create Minimal Template in `apps/main/src/components/resume/templates/MinimalTemplate.tsx`
    - Implement minimalist layout with maximum whitespace
    - Add print-optimized CSS
    - Ensure ATS compatibility
    - _Requirements: 4.1, 7.1, 7.2, 7.3, 7.4_
  - [x] 6.6 Write property test for ATS-friendly HTML structure
    - **Property 7: ATS-Friendly HTML Structure**
    - **Validates: Requirements 7.1, 7.2**
  - [x] 6.7 Write property test for selectable text content
    - **Property 8: All Template Content is Selectable Text**
    - **Validates: Requirements 7.3**
  - [x] 6.8 Write property test for standard section headings
    - **Property 9: Standard Section Headings**
    - **Validates: Requirements 7.4**
  - [x] 6.9 Write property test for template registry
    - **Property 13: Registered Templates Appear in Selector**
    - **Validates: Requirements 9.3**

- [x] 7. Checkpoint - Make sure all tests are passing

  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Resume Builder UI Components

  - [x] 8.1 Create Template Selector component in `apps/main/src/components/resume/TemplateSelector.tsx`
    - Display thumbnail previews of each template
    - Handle template selection with callback
    - _Requirements: 4.2, 4.3_
  - [x] 8.2 Create Live Preview component in `apps/main/src/components/resume/LivePreview.tsx`
    - Render selected template with current ResumeData
    - Add zoom controls for preview scaling
    - Support print mode toggle
    - _Requirements: 3.1, 3.4_
  - [x] 8.3 Create Section Reorder component in `apps/main/src/components/resume/SectionReorder.tsx`
    - Implement drag-and-drop section reordering
    - Update section_order in ResumeData
    - _Requirements: 8.1, 8.2_
  - [x] 8.4 Write property test for section ordering
    - **Property 6: Section Order Determines Render Order**
    - **Validates: Requirements 8.2, 8.3**

- [x] 9. Implement Resume Editor Panel

  - [x] 9.1 Create Resume Editor component in `apps/main/src/components/resume/ResumeEditor.tsx`
    - Personal info editing form
    - Summary/objective editing
    - Work experience editing with bullet point management
    - Education editing
    - Projects editing
    - Skills category management
    - Certifications editing
    - _Requirements: 6.1, 6.2_
  - [x] 9.2 Create useResumeEditor hook in `apps/main/src/hooks/useResumeEditor.ts`
    - Manage resume state with undo/redo
    - Handle dirty state tracking
    - Auto-save functionality
    - _Requirements: 6.3, 6.4_

- [x] 10. Implement Import Flow

  - [x] 10.1 Create LinkedIn Import component in `apps/main/src/components/resume/import/LinkedInImport.tsx`
    - Reuse existing PDF upload UI patterns
    - Call LinkedIn extractor and transform to ResumeData
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 10.2 Create GitHub Import component in `apps/main/src/components/resume/import/GitHubImport.tsx`
    - Username input with validation
    - Repository selection with star sorting
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 10.3 Write property test for GitHub sorting
    - **Property 2: GitHub Repositories Sorted by Stars**
    - **Validates: Requirements 2.2**
  - [x] 10.4 Create Portfolio Import component in `apps/main/src/components/resume/import/PortfolioImport.tsx`
    - Check for existing portfolio data
    - Transform portfolio to ResumeData
    - _Requirements: 1.4_

- [x] 11. Implement Resume Builder Page

  - [x] 11.1 Create Resume Builder page in `apps/main/src/app/(appShell)/resume-builder/page.tsx`
    - Integrate all components (editor, preview, template selector)
    - Handle resume loading and saving
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 11.2 Create Resume List page in `apps/main/src/app/(appShell)/resume-builder/list/page.tsx`
    - Display saved resumes with names and dates
    - Handle create, duplicate, delete actions
    - _Requirements: 10.2, 10.3, 10.4_
  - [x] 11.3 Create Resume Builder layout in `apps/main/src/app/(appShell)/resume-builder/layout.tsx`
    - Add metadata for SEO
    - _Requirements: N/A_

- [x] 12. Implement PDF Export

  - [x] 12.1 Create PDF Export utility in `apps/main/src/lib/resume/pdfExport.ts`
    - Use window.print() with print-specific CSS
    - Generate filename in format "resume-{name}.pdf"
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 12.2 Add Download button to Resume Builder
    - Trigger PDF export on click
    - _Requirements: 5.1, 5.4_

- [x] 13. Implement Template Persistence

  - [x] 13.1 Add template_id persistence to resume save/load
    - Save template_id with resume data
    - Load and apply template on resume open
    - _Requirements: 4.4_
  - [x] 13.2 Write property test for template persistence
    - **Property 4: Template Selection Persistence Round Trip**
    - **Validates: Requirements 4.4**

- [x] 14. Final Checkpoint - Make sure all tests are passing

  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Frontend API Integration
  - [x] 15.1 Create Resume API client in `apps/main/src/lib/api/resume.ts`
    - Implement createResume, getResume, listResumes, updateResume, deleteResume, duplicateResume
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 15.2 Create useResume hook in `apps/main/src/hooks/useResume.ts`
    - Handle API calls with loading/error states
    - Cache resume data
    - _Requirements: 10.1, 10.2_

# Implementation Plan

- [x] 1. Update Schema Package with new fields

  - [x] 1.1 Add tags and chatfolio_headline to PersonalInfoSchema

    - Modify `packages/schema/src/schemas/personal.ts`
    - Add `tags` field as optional array of strings with default empty array
    - Add `chatfolio_headline` field as optional nullable string
    - _Requirements: 1.1, 1.5, 2.1, 2.5_

  - [x] 1.2 Add logo_url to WorkExperienceSchema

    - Modify `packages/schema/src/schemas/work.ts`
    - Add `logo_url` field as optional nullable string
    - _Requirements: 3.1, 3.5_

  - [x] 1.3 Add logo_url to EducationSchema

    - Modify `packages/schema/src/schemas/education.ts`
    - Add `logo_url` field as optional nullable string
    - _Requirements: 4.1, 4.5_

  - [x] 1.4 Add card_image_url to ProjectSchema

    - Modify `packages/schema/src/schemas/project.ts`
    - Add `card_image_url` field as optional nullable string
    - _Requirements: 5.1, 5.5_

  - [x] 1.5 Rebuild schema package
    - Run build command to generate updated TypeScript types
    - Verify no build errors
    - _Requirements: All schema requirements_

- [x] 2. Update Backend Pydantic Models

  - [x] 2.1 Add tags and chatfolio_headline to PersonalInfo model

    - Modify `backend/app/schemas/portfolio.py`
    - Add `tags` field as optional list with default factory
    - Add `chatfolio_headline` field as optional string
    - Update example in model_config if present
    - _Requirements: 1.2, 2.2_

  - [x] 2.2 Add logo_url to WorkExperience model

    - Modify `backend/app/schemas/portfolio.py`
    - Add `logo_url` field as optional string
    - _Requirements: 3.2_

  - [x] 2.3 Add logo_url to Education model

    - Modify `backend/app/schemas/portfolio.py`
    - Add `logo_url` field as optional string
    - _Requirements: 4.2_

  - [x] 2.4 Add card_image_url to Project model
    - Modify `backend/app/schemas/portfolio.py`
    - Add `card_image_url` field as optional string with description
    - _Requirements: 5.2_

- [x] 3. Update PersonalInfoForm component

  - [x] 3.1 Add ChatFolio Headline input field

    - Modify `apps/main/src/components/edit/PersonalInfoForm.tsx`
    - Add Input field after headline field
    - Set label to "ChatFolio Headline"
    - Add helper text: "This headline will be shown on the front page of your chat portfolio"
    - Wire up value and onChange handlers
    - _Requirements: 2.3, 2.4_

  - [x] 3.2 Add Technology Tags input field
    - Modify `apps/main/src/components/edit/PersonalInfoForm.tsx`
    - Add TagInput component after location field
    - Set label to "Technology Tags"
    - Add helper text: "These tags will be displayed on your chat portfolio page"
    - Wire up value and onChange handlers for tags array
    - _Requirements: 1.3, 1.4_

- [x] 4. Update WorkExperienceForm component

  - [x] 4.1 Add Company Logo URL input field
    - Modify `apps/main/src/components/edit/WorkExperienceForm.tsx`
    - Add Input field in the organization/title/location grid section
    - Set label to "Company Logo URL"
    - Add helper text: "URL to the company logo image"
    - Wire up value and onChange handlers
    - _Requirements: 3.3, 3.4_

- [x] 5. Update EducationForm component

  - [x] 5.1 Add Institution Logo URL input field
    - Modify `apps/main/src/components/edit/EducationForm.tsx`
    - Add Input field after grade field
    - Set label to "Institution Logo URL"
    - Add helper text: "URL to the institution logo image"
    - Wire up value and onChange handlers
    - _Requirements: 4.3, 4.4_

- [x] 6. Create ProjectCardImageUpload component

  - [x] 6.1 Create new component for single card image upload

    - Create `apps/main/src/components/edit/ProjectCardImageUpload.tsx`
    - Support single image upload (not array)
    - Accept JPEG, PNG, WebP, and GIF files
    - Display image preview with remove button
    - Reuse existing upload utilities from ProjectImageUpload
    - _Requirements: 5.3, 5.6_

  - [x] 6.2 Implement GIF-specific handling

    - Detect GIF files by MIME type or extension
    - Skip compression for GIF files to preserve animation
    - Apply compression/optimization for static images only
    - Validate file size (max 10MB)
    - _Requirements: 5.7, 5.8_

  - [x] 6.3 Integrate with image upload service
    - Use existing ImageUploadService API
    - Handle upload progress and errors
    - Store uploaded URL in component state
    - Display error messages via toast notifications
    - _Requirements: 5.3, 5.6_

- [x] 7. Update ProjectsForm component

  - [x] 7.1 Add Card Image upload field

    - Modify `apps/main/src/components/edit/ProjectsForm.tsx`
    - Add ProjectCardImageUpload component before project images section
    - Set label to "Card Image"
    - Add helper text: "This image will be shown on the project card. Supports static images and animated GIFs."
    - Wire up value and onChange handlers for card_image_url
    - _Requirements: 5.3, 5.4_

  - [x] 7.2 Update More Context field label and helper text
    - Modify `apps/main/src/components/edit/ProjectsForm.tsx`
    - Change Label text from "More context" to "Detailed Description"
    - Update helper text to: "This markdown-supported description will be shown when users click on the project card"
    - Keep field name as `more_context` (no code changes to field binding)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Verify end-to-end functionality

  - [ ] 8.1 Test PersonalInfo form with new fields

    - Open portfolio editor
    - Add technology tags using TagInput
    - Add ChatFolio headline
    - Save and verify data persists
    - _Requirements: 1.1-1.5, 2.1-2.5_

  - [ ] 8.2 Test WorkExperience form with logo URL

    - Add work experience entry
    - Add company logo URL
    - Save and verify data persists
    - _Requirements: 3.1-3.5_

  - [ ] 8.3 Test Education form with logo URL

    - Add education entry
    - Add institution logo URL
    - Save and verify data persists
    - _Requirements: 4.1-4.5_

  - [ ] 8.4 Test Project form with card image and updated labels

    - Add project entry
    - Upload card image (test both static and GIF)
    - Verify "Detailed Description" label displays correctly
    - Save and verify data persists
    - _Requirements: 5.1-5.8, 6.1-6.5_

  - [ ] 8.5 Test backward compatibility
    - Load existing portfolio without new fields
    - Verify forms display correctly with empty/default values
    - Verify no errors in console
    - _Requirements: All requirements_

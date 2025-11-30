# Implementation Plan

## NOTES

1. Always use `uv` package manager for backend related tasks
2. Do not write any summary document unless I instruct you to do so!

- [x] 1. Update configuration and create shared utilities

  - Create centralized upload configuration in backend (`backend/app/core/config.py`)
  - Create centralized upload configuration in frontend (`apps/main/src/config/uploadConfig.ts`)
  - Include MAX_PROJECT_IMAGES (5), MAX_IMAGE_CAPTION_LENGTH (100), GIF support, image quality settings
  - Create image validation utility for backend (`backend/app/utils/image_validation.py`)
  - Create image validation utility for frontend (`apps/main/src/lib/utils/imageValidation.ts`)
  - _Requirements: 1.1, 1.2, 8.1, 8.4_

- [x] 2. Implement image optimization utilities

  - Install compressorjs library (`yarn add compressorjs` in apps/main)
  - Create frontend image optimization utility (`apps/main/src/lib/utils/imageOptimization.ts`)
  - Implement compressorjs-based resizing and WebP conversion
  - Add special handling for GIFs (skip optimization, only validate size up to 800KB)
  - Install Pillow in backend dependencies (`uv add pillow`)
  - Create backend image optimization utility (`backend/app/utils/image_optimization.py`)
  - Implement Pillow-based resizing and WebP conversion
  - Add special handling for GIFs in backend (return as-is)
  - _Requirements: 5.5, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 3. Update Pydantic schemas

  - Update `Profile` model in `backend/app/schemas/portfolio.py` (remove profile_photo_url, tags, more_context)
  - Add `profile_photo_url` field to `PersonalInfo` model
  - Create `ProjectImage` model with url, caption (max 100 chars), and order fields
  - Update `Project` model: remove role, change highlights to str, add demo_video, update images to List[ProjectImage]
  - Update `WorkExperience` model: change highlights from List[str] to str
  - Add `issuer` field to `Certification` model
  - Update `TextBlobs` model: change achievements to str with markdown support
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 7.1_

- [x] 4. Update TypeScript schemas

  - Update `Profile` interface in `apps/main/src/types/portfolio.ts` (remove profile_photo_url, tags, more_context)
  - Add `profile_photo_url` field to `PersonalInfo` interface
  - Create `ProjectImage` interface with url, caption, and order fields
  - Update `Project` interface: remove role, change highlights to string, add demo_video, update images to ProjectImage[]
  - Update `WorkExperience` interface: change highlights from string[] to string
  - Add `issuer` field to `Certification` interface
  - Update `TextBlobs` interface: change achievements to string
  - Mirror all changes in `packages/template-components/src/types/portfolio.ts`
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 7.1_

- [x] 5. Enhance Azure Blob Storage service

  - Add `delete_user_profile_photo()` method to delete existing profile photos
  - Add `upload_profile_photo()` method with automatic replacement logic
  - Add `upload_project_image()` method with timestamp-based naming
  - Add `delete_blob_by_url()` method for deleting specific images
  - Ensure all methods are fully asynchronous
  - Add proper error handling and logging
  - _Requirements: 1.3, 1.4, 1.5, 5.6, 9.1, 9.2, 9.3, 9.4, 9.5, 12.1, 12.2, 12.3_

- [x] 6. Create backend API endpoints

  - Create `POST /api/portfolio/profile-photo` endpoint for profile photo upload
  - Integrate image validation and optimization (async)
  - Call Azure service to upload and update portfolio data
  - Create `POST /api/portfolio/project-images` endpoint for project image uploads
  - Implement concurrent upload processing using asyncio.gather
  - Enforce MAX_PROJECT_IMAGES limit
  - Create `DELETE /api/portfolio/profile-photo` endpoint
  - Create `DELETE /api/portfolio/project-images/{image_url}` endpoint with ownership verification
  - Add proper authentication and authorization checks
  - _Requirements: 1.3, 1.4, 1.6, 5.6, 5.7, 5.8, 12.1, 12.3, 12.4, 12.5_

- [x] 7. Create ProfilePhotoUpload component

  - Create `apps/main/src/components/edit/ProfilePhotoUpload.tsx`
  - Implement file selection with drag-and-drop support
  - Add client-side validation (size, type)
  - Implement image preview functionality
  - Add client-side image optimization before upload
  - Show upload progress indicator
  - Implement replace and delete functionality
  - Display clear error messages
  - _Requirements: 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 8. Create ProjectImageUpload component

  - Create `apps/main/src/components/edit/ProjectImageUpload.tsx`
  - Support multiple image selection (max 5)
  - Add caption input for each image (max 100 characters)
  - Implement drag-and-drop reordering for image order
  - Add client-side validation and optimization
  - Show upload progress for each image
  - Implement delete functionality for individual images
  - Display image gallery with captions
  - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 9. Update form components for schema changes

  - Update `WorkExperienceForm.tsx`: replace highlights array with textarea, add helper text about markdown
  - Update `ProjectsForm.tsx`: replace highlights array with textarea, remove role field, add demo_video input, add more_context textarea, integrate ProjectImageUpload component
  - Update `CertificationsForm.tsx`: add issuer input field
  - Update `TextBlobsForm.tsx`: update achievements to textarea with markdown helper text
  - Update validation logic in all forms
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3, 5.4, 6.2, 6.3, 7.2, 7.3_

- [x] 10. Integrate ProfilePhotoUpload into PortfolioEditor

  - Add ProfilePhotoUpload component to `apps/main/src/components/edit/PortfolioEditor.tsx`
  - Position it prominently in the personal info section
  - Wire up onChange handler to update portfolio data
  - Ensure proper data flow and state management
  - _Requirements: 1.6, 2.1_

- [x] 11. Update AboutWidget to use profile photo

  - Modify `packages/template-components/src/components/widgets/AboutWidget.tsx`
  - Use `personal_info.profile_photo_url` instead of avatarUrl
  - Maintain fallback to initials if no photo available
  - Ensure responsive image display
  - _Requirements: 1.7_

- [x] 12. Update project and experience widgets for markdown and create project overlay

  - The markdown support is likely already implemented. Simply verify properly that it has the markdown support and if it is using the new string schema properly.
  - Update `packages/template-components/src/components/widgets/ProjectsWidget.tsx`
  - Render highlights string using markdown-to-jsx library
  - Create animated overlay/modal that opens when user clicks on a project tile
  - Install embla-carousel-react in template-components (`yarn add embla-carousel-react` in packages/template-components)
  - Copy carousel UI component from `apps/main/src/components/ui/carousel.tsx` to `packages/template-components/src/components/ui/carousel.tsx`
  - Implement image carousel using shadcn carousel component with proper sizing (images should be sufficiently large and easily visible)
  - Structure overlay content: Image Carousel (top) → Demo Video section (if provided) → About The Project section (more_context markdown)
  - Display project images in carousel with captions below each image
  - Add YouTube embed for demo_video when available (display below carousel with proper aspect ratio)
  - Display more_context markdown with proper typography and spacing
  - Add smooth animations for overlay open/close transitions
  - Ensure overlay is responsive and accessible (ESC key to close, click outside to close)
  - Update `packages/template-components/src/components/widgets/WorkExperienceWidget.tsx`
  - Render highlights string using markdown-to-jsx library
  - Update traditional portfolio components similarly
  - _Requirements: 3.3, 3.4, 5.9, 5.10, 5.11_

- [x] 13. Update AI extraction prompts

  - Update `backend/app/constants/extraction_prompts.py`
  - Instruct LLM to format highlights as markdown strings (not arrays)
  - Instruct LLM to format achievements as markdown bullet points
  - Remove references to removed fields (role, tags, more_context in Profile)
  - Add instructions for extracting certification issuers
  - Add instructions for extracting demo_video YouTube links
  - Document that images are uploaded separately (not extracted)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 14. Update portfolio service methods

  - Add `update_profile_photo()` method to portfolio service
  - Ensure async database operations
  - Add proper error handling
  - Update any data transformation logic for new schema
  - _Requirements: 12.5_

- [x] 15. Update API client functions

  - Create `uploadProfilePhoto()` in `apps/main/src/lib/api/portfolio.ts`
  - Create `deleteProfilePhoto()` function
  - Create `uploadProjectImages()` function
  - Create `deleteProjectImage()` function
  - Add proper error handling and type safety
  - _Requirements: 1.3, 1.4_

- [x] 16. Add frontend error handling

  - Implement user-friendly error messages for all upload scenarios
  - Add retry functionality for failed uploads
  - Display validation errors inline
  - Show network error messages with offline detection
  - _Requirements: 2.7_

- [x] 17. Update data mappers and utilities

  - Update `apps/main/src/utils/portfolioDataMapper.ts` for new schema
  - Carefully scan for everything relying on schema and make sure we are using new schema properly.
  - Update `packages/template-components/src/utils/data-mapper.ts` for new schema
  - Ensure proper handling of ProjectImage objects
  - Handle markdown string rendering
  - _Requirements: 3.1, 3.2, 5.1, 5.2_

- [ ] 18. Test and validate implementation
  - Test profile photo upload, replace, and delete flows
  - Test project image upload with captions and ordering
  - Test GIF upload and display
  - Test markdown rendering in highlights and achievements
  - Test demo video embedding
  - Verify async operations don't block server
  - Test concurrent image uploads
  - Verify storage limits are enforced
  - Test error scenarios and user feedback
  - _Requirements: All_

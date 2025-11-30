# Requirements Document

## Introduction

This feature enhances the portfolio system with profile photo upload capabilities and refines the portfolio data schema for better content representation. Users will be able to upload profile photos that are securely stored in Azure Blob Storage, while the schema improvements will enable markdown-supported content fields and additional metadata for projects and certifications.

## Requirements

### Requirement 1: Profile Photo Upload and Storage

**User Story:** As a portfolio owner, I want to upload a profile photo so that my portfolio has a professional visual identity.

#### Acceptance Criteria

1. WHEN a user uploads a profile photo THEN the system SHALL validate that the file size does not exceed 800KB
2. WHEN a user uploads a profile photo THEN the system SHALL validate that the file is a valid image format (JPEG, PNG, WebP)
3. WHEN a user uploads a profile photo THEN the system SHALL store it in Azure Blob Storage with public read access
4. WHEN a user uploads a profile photo THEN the system SHALL return a publicly accessible URL
5. WHEN a user uploads a new profile photo THEN the system SHALL replace the existing photo in Azure Blob Storage to prevent storage bloat
6. WHEN a profile photo is successfully uploaded THEN the system SHALL store the URL in the portfolio data schema
7. WHEN the profile photo URL is available THEN the AboutWidget SHALL display the photo instead of the avatar fallback

### Requirement 2: Profile Photo Upload UI Component

**User Story:** As a portfolio owner, I want an intuitive interface to upload my profile photo so that I can easily manage my portfolio appearance.

#### Acceptance Criteria

1. WHEN a user accesses the portfolio editor THEN the system SHALL display a dedicated profile photo upload component
2. WHEN a user selects an image file THEN the system SHALL validate the file size on the frontend before upload
3. WHEN the file size exceeds 800KB THEN the system SHALL display a clear error message
4. WHEN a user uploads a photo THEN the system SHALL show upload progress feedback
5. WHEN the upload is successful THEN the system SHALL display a preview of the uploaded photo
6. WHEN a user has an existing profile photo THEN the system SHALL display it with an option to replace it
7. WHEN the upload fails THEN the system SHALL display a user-friendly error message with retry option

### Requirement 3: Schema Refinement - Highlights as Markdown

**User Story:** As a portfolio owner, I want to format my work experience and project highlights using markdown so that I can present information in a structured, readable format.

#### Acceptance Criteria

1. WHEN defining work experience highlights THEN the system SHALL accept a markdown-formatted string instead of a list
2. WHEN defining project highlights THEN the system SHALL accept a markdown-formatted string instead of a list
3. WHEN rendering work experience highlights THEN the system SHALL parse and display markdown formatting
4. WHEN rendering project highlights THEN the system SHALL parse and display markdown formatting
5. WHEN the AI extracts highlights from PDFs THEN it SHALL format them as markdown bullet points
6. WHEN a user edits highlights in the portfolio editor THEN the system SHALL provide a textarea supporting markdown syntax

### Requirement 4: Schema Refinement - Profile Model Cleanup

**User Story:** As a developer, I want a cleaner Profile schema so that the data model is more maintainable and focused.

#### Acceptance Criteria

1. WHEN the Profile model is updated THEN it SHALL NOT include the `profile_photo_url` field (moved to PersonalInfo)
2. WHEN the Profile model is updated THEN it SHALL NOT include the `more_context` field
3. WHEN the Profile model is updated THEN it SHALL NOT include the `tags` field
4. WHEN existing portfolio data is migrated THEN the system SHALL handle legacy fields gracefully
5. WHEN the AI prompt is updated THEN it SHALL reflect the new Profile schema structure

### Requirement 5: Schema Refinement - Project Model Updates

**User Story:** As a portfolio owner, I want to provide detailed project information including images and demo videos so that visitors can better understand my work.

#### Acceptance Criteria

1. WHEN the Project model is updated THEN it SHALL NOT include the `role` field
2. WHEN the Project model is updated THEN the `more_context` field SHALL support markdown formatting
3. WHEN the Project model is updated THEN it SHALL include an `images` field as a list of image URLs (max 5)
4. WHEN the Project model is updated THEN it SHALL include a `demo_video` field for YouTube links
5. WHEN a user uploads project images THEN the system SHALL optimize them for web use before storage
6. WHEN a user uploads project images THEN the system SHALL store them in Azure Blob Storage
7. WHEN a user uploads project images THEN the system SHALL validate each image is under 800KB
8. WHEN a user uploads more than 5 images THEN the system SHALL reject the upload with a clear error message
9. WHEN project images are available THEN the project widget SHALL display them in a gallery format
10. WHEN a user clicks on a project tile THEN the system SHALL display the markdown-formatted `more_context`
11. WHEN a demo video link is provided THEN the project widget SHALL display an embedded YouTube player

### Requirement 6: Schema Refinement - Certification Model Enhancement

**User Story:** As a portfolio owner, I want to specify who issued my certifications so that the credentials are more credible and verifiable.

#### Acceptance Criteria

1. WHEN the Certification model is updated THEN it SHALL include an `issuer` field
2. WHEN displaying certifications THEN the system SHALL show the issuer name (e.g., "Coursera", "Udemy")
3. WHEN the AI extracts certifications THEN it SHALL attempt to identify and populate the issuer field
4. WHEN a user edits certifications THEN the system SHALL provide an input field for the issuer

### Requirement 7: Schema Refinement - Achievements as Markdown

**User Story:** As a portfolio owner, I want to format my achievements using markdown so that each achievement is clearly separated and readable.

#### Acceptance Criteria

1. WHEN the TextBlobs achievements field is updated THEN it SHALL support markdown formatting
2. WHEN the AI extracts achievements THEN it SHALL format them as markdown bullet points with each achievement on its own line
3. WHEN rendering achievements THEN the system SHALL parse and display markdown formatting
4. WHEN a user edits achievements THEN the system SHALL provide a textarea supporting markdown syntax

### Requirement 8: Configuration Management

**User Story:** As a developer, I want centralized configuration for file upload limits so that constraints can be easily adjusted.

#### Acceptance Criteria

1. WHEN file size limits are defined THEN they SHALL be stored in a centralized configuration file
2. WHEN the backend validates file sizes THEN it SHALL reference the centralized configuration
3. WHEN the frontend validates file sizes THEN it SHALL reference the centralized configuration
4. WHEN the configuration is updated THEN both frontend and backend SHALL use the new limits
5. WHEN validation occurs THEN the system SHALL use the same 800KB limit across all image uploads

### Requirement 9: Azure Blob Storage Integration

**User Story:** As a system administrator, I want profile photos and project images stored securely in Azure Blob Storage so that the application scales efficiently.

#### Acceptance Criteria

1. WHEN images are uploaded THEN the system SHALL use the existing Azure Blob Storage service
2. WHEN storing profile photos THEN the system SHALL use a dedicated blob path structure (e.g., `{user_id}/profile-photo.jpg`)
3. WHEN storing project images THEN the system SHALL use a dedicated blob path structure (e.g., `{user_id}/projects/{project_id}/{image_name}`)
4. WHEN a user uploads a new profile photo THEN the system SHALL overwrite the existing blob to prevent duplication
5. WHEN images are stored THEN they SHALL have public read access
6. WHEN an upload fails THEN the system SHALL log the error and return a meaningful error message

### Requirement 10: AI Prompt Updates

**User Story:** As a system, I want the AI extraction prompts updated to reflect schema changes so that data extraction remains accurate.

#### Acceptance Criteria

1. WHEN the AI prompt is updated THEN it SHALL instruct the LLM to format highlights as markdown strings
2. WHEN the AI prompt is updated THEN it SHALL instruct the LLM to format achievements as markdown bullet points
3. WHEN the AI prompt is updated THEN it SHALL instruct the LLM to extract certification issuers
4. WHEN the AI prompt is updated THEN it SHALL NOT reference removed fields (role, tags, more_context in Profile)
5. WHEN the AI prompt is updated THEN it SHALL instruct the LLM about the new Project schema structure
6. WHEN the AI prompt is updated THEN it SHALL instruct the LLM to extract demo_video links for projects

### Requirement 11: Image Optimization

**User Story:** As a system administrator, I want all uploaded images optimized for web use so that the application performs well and storage costs are minimized.

#### Acceptance Criteria

1. WHEN an image is uploaded THEN the system SHALL optimize it before storing in Azure Blob Storage
2. WHEN optimizing images THEN the system SHALL resize images larger than 1920px to 1920px max dimension
3. WHEN optimizing images THEN the system SHALL maintain aspect ratio during resizing
4. WHEN optimizing images THEN the system SHALL convert images to WebP format for better compression
5. WHEN optimizing images THEN the system SHALL use 85% quality setting
6. WHEN optimizing images on the frontend THEN the system SHALL use canvas API for client-side optimization
7. WHEN optimizing images on the backend THEN the system SHALL use Pillow library for server-side optimization

### Requirement 12: Asynchronous Operations

**User Story:** As a system administrator, I want all heavy operations to be asynchronous so that the server remains responsive under load.

#### Acceptance Criteria

1. WHEN uploading images THEN all operations SHALL be fully asynchronous
2. WHEN optimizing images THEN the operation SHALL NOT block the server
3. WHEN uploading to Azure Blob Storage THEN the operation SHALL be asynchronous
4. WHEN uploading multiple project images THEN they SHALL be processed concurrently using asyncio.gather
5. WHEN updating portfolio data THEN the database operation SHALL be asynchronous
6. WHEN any heavy operation is performed THEN it SHALL use async/await patterns throughout

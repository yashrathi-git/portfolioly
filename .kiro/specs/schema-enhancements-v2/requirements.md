# Requirements Document

## Introduction

This feature enhances the portfolio schema to support additional fields that improve the visual presentation and user experience of portfolios. The enhancements include technology tags in personal info, company/institution logos, project card images, and improved field labeling for better user understanding.

## Glossary

- **Schema Package**: The `@portfolioly/schema` package that defines the single source of truth for portfolio data structures using Zod validation
- **Backend Schema**: Python Pydantic models in `backend/app/schemas/portfolio.py` that mirror the TypeScript schema
- **Edit Frontend**: The portfolio editor UI in `apps/main/src/components/edit/` where users modify their portfolio data
- **ChatFolio**: The chat-based portfolio layout mode
- **Card Image**: A visual thumbnail displayed on project cards in the portfolio grid view
- **Logo URL**: A URL pointing to a company or institution logo image

## Requirements

### Requirement 1: Personal Information Technology Tags

**User Story:** As a portfolio user, I want to add technology tags to my personal information, so that visitors can quickly see my key skills on the chat portfolio page.

#### Acceptance Criteria

1. WHEN a user edits their personal information, THE Schema Package SHALL include a `tags` field as an array of strings
2. WHEN a user edits their personal information, THE Backend Schema SHALL include a `tags` field as an optional list of strings with default empty list
3. WHEN a user views the personal information form, THE Edit Frontend SHALL display a tag input field with label "Technology Tags"
4. WHEN a user views the personal information form, THE Edit Frontend SHALL display helper text "These tags will be displayed on your chat portfolio page"
5. THE Schema Package SHALL validate that tags is an optional array with default empty array

### Requirement 2: ChatFolio Headline Field

**User Story:** As a portfolio user, I want to add a dedicated headline for my chat portfolio, so that I can customize the first impression visitors see in chat mode.

#### Acceptance Criteria

1. WHEN a user edits their personal information, THE Schema Package SHALL include a `chatfolio_headline` field as an optional nullable string
2. WHEN a user edits their personal information, THE Backend Schema SHALL include a `chatfolio_headline` field as an optional string
3. WHEN a user views the personal information form, THE Edit Frontend SHALL display an input field with label "ChatFolio Headline"
4. WHEN a user views the personal information form, THE Edit Frontend SHALL display helper text "This headline will be shown on the front page of your chat portfolio"
5. THE Schema Package SHALL validate that chatfolio_headline is an optional nullable string

### Requirement 3: Work Experience Company Logos

**User Story:** As a portfolio user, I want to add company logos to my work experience entries, so that my work history is more visually appealing and recognizable.

#### Acceptance Criteria

1. WHEN a user edits a work experience entry, THE Schema Package SHALL include a `logo_url` field as an optional nullable string
2. WHEN a user edits a work experience entry, THE Backend Schema SHALL include a `logo_url` field as an optional string
3. WHEN a user views the work experience form, THE Edit Frontend SHALL display an input field with label "Company Logo URL"
4. WHEN a user views the work experience form, THE Edit Frontend SHALL display helper text "URL to the company logo image"
5. THE Schema Package SHALL validate that logo_url is an optional nullable string

### Requirement 4: Education Institution Logos

**User Story:** As a portfolio user, I want to add institution logos to my education entries, so that my educational background is more visually distinctive.

#### Acceptance Criteria

1. WHEN a user edits an education entry, THE Schema Package SHALL include a `logo_url` field as an optional nullable string
2. WHEN a user edits an education entry, THE Backend Schema SHALL include a `logo_url` field as an optional string
3. WHEN a user views the education form, THE Edit Frontend SHALL display an input field with label "Institution Logo URL"
4. WHEN a user views the education form, THE Edit Frontend SHALL display helper text "URL to the institution logo image"
5. THE Schema Package SHALL validate that logo_url is an optional nullable string

### Requirement 5: Project Card Images

**User Story:** As a portfolio user, I want to add a card image to my projects, so that visitors see an attractive preview image (including animated GIFs) when browsing my project grid.

#### Acceptance Criteria

1. WHEN a user edits a project entry, THE Schema Package SHALL include a `card_image_url` field as an optional nullable string
2. WHEN a user edits a project entry, THE Backend Schema SHALL include a `card_image_url` field as an optional string
3. WHEN a user views the project form, THE Edit Frontend SHALL display an image upload field with label "Card Image"
4. WHEN a user views the project form, THE Edit Frontend SHALL display helper text "This image will be shown on the project card. Supports static images and animated GIFs."
5. THE Schema Package SHALL validate that card_image_url is an optional nullable string
6. THE Edit Frontend SHALL support uploading both static images and GIF files for card images
7. THE Edit Frontend SHALL apply the same compression and optimization logic as project images for static card images
8. THE Edit Frontend SHALL NOT apply compression to GIF files to preserve animation

### Requirement 6: Improved Field Labeling for More Context

**User Story:** As a portfolio user, I want clear labeling for the detailed description field in projects, so that I understand it supports markdown and appears when users click on project cards.

#### Acceptance Criteria

1. WHEN a user views the project form, THE Edit Frontend SHALL display the field label "Detailed Description" instead of "More Context"
2. WHEN a user views the project form, THE Edit Frontend SHALL display helper text "This markdown-supported description will be shown when users click on the project card"
3. THE Schema Package SHALL maintain the field name as `more_context` for backward compatibility
4. THE Backend Schema SHALL maintain the field name as `more_context` for backward compatibility
5. THE Edit Frontend SHALL only change the display label and helper text without modifying the underlying field name

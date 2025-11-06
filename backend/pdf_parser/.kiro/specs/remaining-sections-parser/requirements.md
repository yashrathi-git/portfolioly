# Requirements Document

## Introduction

This specification defines the requirements for parsing the remaining LinkedIn profile sections that are not yet handled by the extraction system. The system currently parses Experience and Education sections. This feature will add parsers for Contact, Languages, Certifications, Honors-Awards, and Top Skills sections, along with a unified API function for complete profile parsing.

## Glossary

- **LinkedIn Profile System**: The markdown extraction and parsing system that converts LinkedIn PDF exports into structured JSON
- **Section Parser**: A specialized module that transforms raw markdown text from a specific profile section into structured JSON
- **Contact Platform**: A social media or professional networking service (e.g., LinkedIn, GitHub, personal website)
- **Proficiency Level**: A descriptor indicating language skill level (e.g., Native, Professional, Limited)
- **before_h1 Section**: The markdown content appearing before the first H1 heading, containing Contact, Top Skills, Languages, Certifications, and Honors-Awards
- **Linebreak Handling**: The process of joining text fragments that were split across multiple lines due to PDF layout constraints
- **Unified Parser API**: A single function that orchestrates all section parsers and returns complete structured profile data

## Requirements

### Requirement 1

**User Story:** As a recruiter using the LinkedIn Profile System, I want contact information parsed into structured platform-profile pairs, so that I can programmatically access candidate contact details across multiple platforms

#### Acceptance Criteria

1. WHEN the Contact section contains a URL with a platform label in parentheses, THE LinkedIn Profile System SHALL extract the platform name and URL as a key-value pair
2. WHEN the Contact section contains an email address, THE LinkedIn Profile System SHALL extract the email and store it with the key "email"
3. WHEN the Contact section contains a phone number with a label in parentheses, THE LinkedIn Profile System SHALL extract the phone number and store it with the key "phone"
4. WHEN the Contact section contains URLs split across multiple lines, THE LinkedIn Profile System SHALL join the fragments into complete URLs before extraction
5. WHEN the Contact section contains a URL without a platform label, THE LinkedIn Profile System SHALL infer the platform from the domain name

### Requirement 2

**User Story:** As a hiring manager using the LinkedIn Profile System, I want language proficiency data structured as a list of dictionaries, so that I can filter candidates by language requirements

#### Acceptance Criteria

1. WHEN the Languages section contains language names with proficiency levels, THE LinkedIn Profile System SHALL extract each entry as a dictionary with "language" and "proficiency_level" keys
2. WHEN the Languages section contains a language name without a proficiency level, THE LinkedIn Profile System SHALL create an entry with "proficiency_level" set to null
3. WHEN the Languages section contains text split across multiple lines, THE LinkedIn Profile System SHALL join the fragments before parsing individual language entries
4. WHEN the Languages section is empty or missing, THE LinkedIn Profile System SHALL return an empty list

### Requirement 3

**User Story:** As a talent acquisition specialist using the LinkedIn Profile System, I want certifications extracted as a list, so that I can verify candidate qualifications

#### Acceptance Criteria

1. WHEN the Certifications section contains certification names, THE LinkedIn Profile System SHALL extract each certification as a string in a list
2. WHEN the Certifications section contains text split across multiple lines, THE LinkedIn Profile System SHALL join the fragments to form complete certification names
3. WHEN the Certifications section is empty or missing, THE LinkedIn Profile System SHALL return an empty list
4. WHEN the Certifications section contains multiple certifications, THE LinkedIn Profile System SHALL preserve the order as they appear in the source document

### Requirement 4

**User Story:** As a recruiter using the LinkedIn Profile System, I want honors and awards extracted as a list, so that I can identify high-achieving candidates

#### Acceptance Criteria

1. WHEN the Honors-Awards section contains award names, THE LinkedIn Profile System SHALL extract each award as a string in a list
2. WHEN the Honors-Awards section contains text split across multiple lines, THE LinkedIn Profile System SHALL join the fragments to form complete award names
3. WHEN the Honors-Awards section is empty or missing, THE LinkedIn Profile System SHALL return an empty list
4. WHEN the Honors-Awards section contains multiple awards, THE LinkedIn Profile System SHALL preserve the order as they appear in the source document

### Requirement 5

**User Story:** As a technical recruiter using the LinkedIn Profile System, I want top skills extracted as a list, so that I can quickly assess candidate technical capabilities

#### Acceptance Criteria

1. WHEN the Top Skills section contains skill names, THE LinkedIn Profile System SHALL extract each skill as a string in a list
2. WHEN the Top Skills section contains text split across multiple lines, THE LinkedIn Profile System SHALL join the fragments to form complete skill names
3. WHEN the Top Skills section is empty or missing, THE LinkedIn Profile System SHALL return an empty list
4. WHEN the Top Skills section contains multiple skills, THE LinkedIn Profile System SHALL preserve the order as they appear in the source document

### Requirement 6

**User Story:** As a developer integrating the LinkedIn Profile System, I want a single API function that parses all sections from raw markdown, so that I can extract complete profile data with one function call

#### Acceptance Criteria

1. WHEN the unified parser function receives raw markdown text, THE LinkedIn Profile System SHALL return a dictionary containing all parsed sections
2. WHEN a section parser encounters an error, THE LinkedIn Profile System SHALL return an empty value for that section without failing the entire parsing operation
3. WHEN a section parser partially succeeds, THE LinkedIn Profile System SHALL return the successfully parsed data for that section
4. WHEN the unified parser function is imported as a module, THE LinkedIn Profile System SHALL expose the function without requiring CLI invocation
5. THE LinkedIn Profile System SHALL include parsed data for Contact, Languages, Certifications, Honors-Awards, Top Skills, Experience, and Education sections in the unified parser output

### Requirement 7

**User Story:** As a data engineer using the LinkedIn Profile System, I want consistent handling of PDF layout artifacts, so that parsed data is clean and usable

#### Acceptance Criteria

1. WHEN any before_h1 section contains text split by linebreaks due to narrow PDF column width, THE LinkedIn Profile System SHALL join adjacent lines that form a single logical unit
2. WHEN joining lines, THE LinkedIn Profile System SHALL preserve intentional paragraph breaks
3. WHEN joining URL fragments, THE LinkedIn Profile System SHALL produce valid URLs without embedded whitespace
4. WHEN joining text fragments, THE LinkedIn Profile System SHALL insert appropriate spacing between words

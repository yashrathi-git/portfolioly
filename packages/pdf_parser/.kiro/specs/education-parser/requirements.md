# Requirements Document

## Introduction

The education-parser feature extends the linkedin-extractor system to parse the Education section from LinkedIn profile markdown exports. The parser must handle variable formatting where institution names are mandatory, but degree names and durations are optional. The parser must detect duration patterns to identify education entry boundaries and apply heuristics when durations are absent.

## Glossary

- **Education_Parser**: The software component that extracts structured education data from markdown text
- **Institution_Name**: The name of the educational institution (university, college, school)
- **Degree_Name**: The academic degree, diploma, or program name
- **Duration_Pattern**: A date range formatted as "(YYYY - YYYY)" or "(Month YYYY - Month YYYY)"
- **Education_Entry**: A single structured record representing one educational credential
- **Markdown_Extractor**: The existing system component that splits LinkedIn profile markdown into sections
- **Education_Section**: The H2-level markdown block containing all education entries

## Requirements

### Requirement 1

**User Story:** As a recruiter, I want to extract structured education data from LinkedIn profiles, so that I can populate candidate records in my ATS system

#### Acceptance Criteria

1. WHEN the Education_Parser receives an Education_Section, THE Education_Parser SHALL extract all education entries into a structured list
2. THE Education_Parser SHALL identify the Institution_Name as the first line of each Education_Entry
3. THE Education_Parser SHALL extract the Degree_Name when present between the Institution_Name and Duration_Pattern
4. THE Education_Parser SHALL extract start and end dates when a Duration_Pattern is detected
5. WHERE a Duration_Pattern is absent, THE Education_Parser SHALL apply boundary detection heuristics to determine the end of the Education_Entry

### Requirement 2

**User Story:** As a data analyst, I want education entries to include normalized date fields, so that I can perform timeline analysis and validation

#### Acceptance Criteria

1. WHEN the Education_Parser detects a Duration_Pattern matching "(YYYY - YYYY)", THE Education_Parser SHALL extract the start year and end year as integers
2. WHEN the Education_Parser detects a Duration_Pattern matching "(Month YYYY - Month YYYY)", THE Education_Parser SHALL extract the start month, start year, end month, and end year
3. THE Education_Parser SHALL normalize month names to a consistent format
4. WHERE a Duration_Pattern contains "Present" as the end date, THE Education_Parser SHALL mark the end date as null or ongoing
5. THE Education_Parser SHALL calculate the duration in months when both start and end dates are available

### Requirement 3

**User Story:** As a system integrator, I want the education parser to handle inline and multi-line degree formats, so that I can extract data from various LinkedIn export formats

#### Acceptance Criteria

1. WHEN the Degree_Name and Duration_Pattern appear on the same line separated by " · ", THE Education_Parser SHALL extract both fields correctly
2. WHEN the Degree_Name appears on a separate line from the Duration_Pattern, THE Education_Parser SHALL associate the Degree_Name with the correct Education_Entry
3. THE Education_Parser SHALL preserve all text between the Institution_Name and Duration_Pattern as the Degree_Name
4. WHERE multiple lines exist between Institution_Name and Duration_Pattern, THE Education_Parser SHALL concatenate them into a single Degree_Name field
5. THE Education_Parser SHALL trim whitespace from extracted Institution_Name and Degree_Name fields

### Requirement 4

**User Story:** As a developer, I want the parser to apply consistent heuristics when durations are missing, so that education entries are correctly separated

#### Acceptance Criteria

1. WHERE no Duration_Pattern is detected in an Education_Entry, THE Education_Parser SHALL treat the next line starting with a capital letter as a potential new Institution_Name
2. WHERE no Duration_Pattern is detected, THE Education_Parser SHALL limit the Degree_Name to a maximum of three lines
3. THE Education_Parser SHALL detect common degree indicators such as "Bachelor", "Master", "PhD", "Diploma", "Certificate" to identify Degree_Name boundaries
4. WHERE an Education_Entry contains only an Institution_Name with no additional lines, THE Education_Parser SHALL create an entry with null Degree_Name and null duration
5. THE Education_Parser SHALL flag Education_Entry records as incomplete when boundary detection relies on heuristics rather than Duration_Pattern detection

### Requirement 5

**User Story:** As a quality assurance engineer, I want the parser to output consistent JSON structures, so that downstream systems can reliably consume the data

#### Acceptance Criteria

1. THE Education_Parser SHALL output each Education_Entry as a JSON object with fields: institution, degree, start_date, end_date, duration_months, and incomplete
2. THE Education_Parser SHALL set the incomplete field to true when heuristics are used for boundary detection
3. THE Education_Parser SHALL set the incomplete field to false when a Duration_Pattern is detected
4. WHERE a field is not present in the source text, THE Education_Parser SHALL set the field value to null
5. THE Education_Parser SHALL return the list of Education_Entry objects under the key "Education" in the parsed_sections output

### Requirement 6

**User Story:** As a system operator, I want the parser to handle edge cases gracefully, so that malformed input does not cause system failures

#### Acceptance Criteria

1. WHEN the Education_Section is empty or contains only whitespace, THE Education_Parser SHALL return an empty list
2. WHEN the Education_Parser encounters unrecognized date formats, THE Education_Parser SHALL preserve the raw text in a separate field
3. THE Education_Parser SHALL continue processing remaining entries when one Education_Entry fails to parse
4. THE Education_Parser SHALL log warnings when heuristic-based parsing is applied
5. WHERE the Institution_Name cannot be identified, THE Education_Parser SHALL skip the malformed entry and continue processing

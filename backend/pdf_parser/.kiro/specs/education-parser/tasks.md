# Implementation Plan

- [x] 1. Create education parser module with core data structures

  - Create `src/extraction/parsers/education.py` file
  - Define `EducationEntry` dataclass with fields: institution, degree, start_text, start_iso, end_text, end_iso, duration_months, incomplete
  - Implement `as_dict()` method on `EducationEntry` to convert to JSON-serializable dictionary with null filtering
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Implement regular expression patterns and constants

  - Define `DURATION_RE` pattern to match "(YYYY - YYYY)" and "(Month YYYY - Month YYYY)" formats
  - Define `INLINE_DEGREE_DURATION_RE` pattern to match "Degree · (YYYY - YYYY)" format
  - Create `DEGREE_INDICATORS` list with common degree keywords (bachelor, master, phd, diploma, etc.)
  - Import `PAGE_FOOTER_RE` and `MONTH_MAP` from experience parser for reuse
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2_

- [x] 3. Implement utility functions for date parsing and normalization

  - Copy `_normalise_lines` function from experience parser to handle line cleanup and page footer removal
  - Copy `_parse_date_to_iso` function from experience parser to convert date strings to ISO format
  - Copy `_months_between` function from experience parser to calculate duration between dates
  - Implement `_next_non_empty` helper to find next non-blank line
  - Implement `_previous_non_empty` helper to find previous non-blank line
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 6.1_

- [x] 4. Implement duration line detection

  - Write function `_find_duration_lines` that scans all lines and returns a dictionary mapping line indices to parsed duration data
  - Extract start and end date text from duration patterns
  - Handle both parenthesized formats: "(YYYY - YYYY)" and "(Month YYYY - Month YYYY)"
  - _Requirements: 1.2, 1.4, 2.1, 2.2_

- [x] 5. Implement deterministic parsing for entries with durations

  - Write function `_parse_entry_with_duration` that processes entries where duration is detected
  - Search backward from duration line to find institution name (first non-empty, non-duration line)
  - Extract degree text from lines between institution and duration
  - Handle inline format where degree and duration are on same line
  - Parse dates to ISO format and calculate duration in months
  - Create `EducationEntry` with `incomplete=False`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.5, 3.1, 3.2, 3.3, 5.3_

- [x] 6. Implement heuristic parsing for entries without durations

  - Write function `_parse_entry_without_duration` that handles entries lacking duration patterns
  - Identify institution line by checking for capital letter start and absence of degree indicators
  - Look ahead up to 3 lines for degree text
  - Check for degree indicator keywords to determine degree boundaries
  - Detect next institution line to determine entry end
  - Create `EducationEntry` with `incomplete=True`
  - _Requirements: 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.2_

- [x] 7. Implement main parsing orchestration function

  - Write `parse_education_section` function that accepts raw markdown text
  - Normalize input lines using `_normalise_lines`
  - Handle empty input by returning empty list
  - Detect all duration lines using `_find_duration_lines`
  - Iterate through lines to identify entry boundaries
  - Route to deterministic parser when duration is present
  - Route to heuristic parser when duration is absent
  - Collect all parsed entries and return as list of dictionaries
  - _Requirements: 1.1, 1.5, 5.1, 5.5, 6.1, 6.3_

- [x] 8. Integrate education parser into CLI

  - Import `parse_education_section` in `bin/extract_markdown.py`
  - Extract "Education" section from `extraction.after_h1.sections`
  - Invoke `parse_education_section` with education section text
  - Store parsed results under `payload["parsed_sections"]["Education"]`
  - Handle case where Education section is not present
  - _Requirements: 5.5, 6.1_

- [x] 9. Add error handling and logging

  - Add try-except blocks around individual entry parsing to prevent one failure from stopping all parsing
  - Log warnings when heuristic parsing is applied
  - Log warnings when date parsing fails
  - Handle unrecognized date formats by preserving raw text
  - Skip entries where institution cannot be identified
  - _Requirements: 4.5, 6.2, 6.3, 6.4, 6.5_

- [ ]\* 10. Create unit tests for education parser

  - [ ]\* 10.1 Write tests for duration pattern matching
    - Test `DURATION_RE` with various formats: "(2022 - 2026)", "(March 2014 - March 2015)", "(April 2016 - Present)"
    - Test `INLINE_DEGREE_DURATION_RE` for inline degree formats
    - _Requirements: 2.1, 2.2, 3.1_
  - [ ]\* 10.2 Write tests for date normalization
    - Test `_parse_date_to_iso` with year-only inputs
    - Test `_parse_date_to_iso` with month-year inputs
    - Test `_parse_date_to_iso` with "Present" input
    - Test `_months_between` for duration calculation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ]\* 10.3 Write tests for entry parsing scenarios
    - Test complete entries with duration
    - Test partial entries without duration
    - Test minimal entries with institution only
    - Test inline degree formats
    - Test multi-line degree formats
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.2, 3.3, 3.4_
  - [ ]\* 10.4 Write tests for edge cases
    - Test empty input returns empty list
    - Test single institution line
    - Test consecutive entries without blank lines
    - Test entries with special characters
    - _Requirements: 4.4, 6.1, 6.5_

- [ ]\* 11. Create integration tests
  - [ ]\* 11.1 Write end-to-end parsing tests
    - Parse StatQuest.md education section and verify output structure
    - Parse YashRathiProfile.md education section and verify inline duration handling
    - Parse amritansh.md education section and verify mixed format handling
    - Verify `incomplete` flag is set correctly for heuristic-based entries
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]\* 11.2 Write CLI integration tests
    - Run `bin/extract_markdown.py` with sample markdown files
    - Verify `parsed_sections.Education` key exists in output
    - Verify JSON structure matches expected schema
    - Verify output file is created with correct formatting
    - _Requirements: 5.1, 5.5_

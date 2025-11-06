# Implementation Plan

- [x] 1. Create shared text normalization utilities

  - Create `src/extraction/parsers/utils.py` with functions for normalizing before_h1 text
  - Implement `normalize_before_h1_text()` using deterministic pattern: split on double linebreaks (`\n\n`) for items, join single linebreaks within items
  - Implement `extract_items()` to split text into logical items based on double linebreaks
  - Implement `join_single_linebreaks()` to join text fragments within each item (handles URLs, markdown links, regular text)
  - Pattern: double linebreak = item separator, single linebreak = text continuation from narrow PDF column
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 2. Implement Contact section parser

  - Create `src/extraction/parsers/contact.py` with `parse_contact_section()` function
  - Implement email extraction using regex pattern matching
  - Implement phone number extraction with label detection
  - Implement platform label extraction from parentheses (e.g., "(LinkedIn)")
  - Implement domain-based platform inference for URLs without labels
  - Handle markdown link syntax `[text](url)` and bare URLs
  - Use text normalization utilities to handle linebreaks in URLs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Implement Languages section parser

  - Create `src/extraction/parsers/languages.py` with `parse_languages_section()` function
  - Implement extraction of language names and proficiency levels from parentheses
  - Handle languages without proficiency levels (return null for proficiency_level)
  - Use text normalization utilities to handle linebreaks
  - Return empty list for missing or empty sections
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Implement simple list section parsers
- [x] 4.1 Create Certifications parser

  - Create `src/extraction/parsers/certifications.py` with `parse_certifications_section()` function
  - Extract each line as a certification name
  - Use text normalization utilities to handle linebreaks
  - Preserve order and return empty list for missing sections
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4.2 Create Honors-Awards parser

  - Create `src/extraction/parsers/honors_awards.py` with `parse_honors_awards_section()` function
  - Extract each line as an award name
  - Use text normalization utilities to handle linebreaks
  - Preserve order and return empty list for missing sections
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.3 Create Top Skills parser

  - Create `src/extraction/parsers/top_skills.py` with `parse_top_skills_section()` function
  - Extract each line as a skill name
  - Use text normalization utilities to handle linebreaks
  - Preserve order and return empty list for missing sections
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 5. Create unified parser API

  - Create `src/extraction/api.py` with `parse_profile()` function
  - Implement safe_parse helper function with try-except error handling
  - Call `extract_markdown_from_text()` to get base extraction
  - Extract name, headline, and location from base extraction
  - Call all section parsers (Contact, Top Skills, Languages, Certifications, Honors-Awards, Experience, Education) with error handling
  - Return structured dictionary with all parsed sections
  - Include raw sections for debugging/fallback
  - Return empty/null values for sections that fail to parse
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6. Update module exports

  - Update `src/extraction/__init__.py` to export new parser functions
  - Update `src/extraction/parsers/__init__.py` to export all parser modules
  - Export `parse_profile` from main extraction module
  - _Requirements: 6.4_

- [x] 7. Update CLI to use new parsers

  - Update `bin/extract_markdown.py` to call new section parsers
  - Add Contact, Languages, Certifications, Honors-Awards, and Top Skills to parsed output
  - Maintain backward compatibility with existing output format
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Create integration test script
  - Create test script that runs `parse_profile()` on sample markdown files
  - Test with `YashRathiProfile.md`, `SabestianPdf.md`, and `amritansh.md`
  - Verify all sections are parsed correctly
  - Print structured output for manual verification
  - _Requirements: 6.1, 6.5_

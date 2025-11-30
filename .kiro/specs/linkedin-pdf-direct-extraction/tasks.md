# Implementation Plan

- [x] 1. Install pdf_parser package in backend environment

  - Simply just make sure it is installed in the backend, no need for anything else.
  - Install pdf_parser package using `uv pip install -e ../packages/pdf_parser`

  - _Requirements: 1.1, 1.2, 1.5, 3.4, 3.5_

- [x] 2. Create LinkedInExtractor service in backend

  - Create `backend/app/services/linkedin_extractor.py`
  - Implement `LinkedInExtractor` class with `extract_from_markdown()` method that accepts markdown text
  - Add path configuration to import pdf_parser package
  - Import `parse_profile` from pdf_parser (no need for convert_pdf_to_markdown here)
  - Implement singleton pattern with `get_linkedin_extractor()` function
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2_

- [x] 3. Implement personal info mapping in LinkedInExtractor

  - Create `_map_personal_info()` method
  - Map contact information to PersonalInfo fields
  - Convert contact URLs to Profile objects
  - Map skills to tags array
  - Format languages into more_context field
  - _Requirements: 6.1, 6.6, 6.7_

- [x] 4. Implement work experience mapping in LinkedInExtractor

  - Create `_map_work_experiences()` method
  - Handle both standalone roles and company groups
  - Create `_create_work_experience()` helper method
  - Implement date parsing with `_parse_date()` method
  - Map all WorkExperience fields correctly
  - _Requirements: 6.2_

- [x] 5. Implement education and certification mapping

  - Create `_map_education()` method for Education objects
  - Create `_map_certifications()` method for Certification objects
  - Handle optional fields and missing data gracefully
  - Parse and format dates consistently
  - _Requirements: 6.3, 6.4_

- [x] 6. Implement GitHub repository merging logic

  - Create `_merge_github_repos()` method
  - Convert GitHubRepo objects to Project objects
  - Merge GitHub projects with existing LinkedIn projects
  - Prioritize GitHub data over LinkedIn project mentions
  - Add star count and language to project metadata
  - _Requirements: 5.3, 5.4, 6.5_

- [x] 7. Implement complete portfolio data mapping

  - Create `_map_to_portfolio_data()` method
  - Integrate all mapping methods (personal, work, education, certs)
  - Add metadata with source_type and extraction timestamp
  - Validate resulting PortfolioData against schema
  - _Requirements: 5.2, 6.7_

- [ ]\* 7.1 Write unit tests for LinkedInExtractor

  - Test personal info mapping with various contact combinations
  - Test work experience mapping with company groups and standalone roles
  - Test education and certification mapping
  - Test GitHub repo merging logic
  - Test date parsing edge cases
  - _Requirements: 9.2, 9.5_

- [x] 8. Update /ingest/pdf endpoint to use markdown_converter

  - Modify `backend/app/services/pdf_processor.py` to import and use `convert_pdf_to_markdown` from pdf_parser package
  - Update `_extract_text_with_pymupdf()` method to use markdown conversion for LinkedIn PDFs
  - Use the same logic for resume PDFs too, making sure it is consistent across linkedin and resume.
  - Ensure no Azure blob download is required - work directly with uploaded file bytes
  - Return markdown text in response for LinkedIn PDFs, plain text for resume PDFs
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Update /submit endpoint with routing logic

  - The logic is simple - whenever resume is involved AI processing is necessary.
  - Add logic to detect LinkedIn-only vs resume submissions
  - Implement routing to direct extraction path for LinkedIn + GitHub
  - Maintain existing AI processing path for resume PDFs
  - Maintain existing GitHub-only path
  - Add logging for processing path selection
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 10. Implement direct extraction processing function

  - If it is already implemented refactor it into proper file.
  - Create `_process_with_direct_extraction()` async function in upload.py
  - Integrate LinkedInExtractor service
  - Retrieve LinkedIn PDF markdown text from request (already extracted by /ingest/pdf)
  - Pass markdown text directly to LinkedInExtractor (no PDF bytes needed)
  - Call portfolio service to store data
  - Add background task for logo enrichment
  - Return success response with "direct_extraction" processing type
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Add comprehensive error handling

  - Handle markdown conversion failures with HTTP 422 in /ingest/pdf
  - Handle parsing failures with descriptive error messages in /submit
  - Handle mapping failures gracefully
  - Add detailed logging for debugging
  - Ensure errors don't expose sensitive information
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]\* 11.1 Write integration tests for direct extraction path

  - Test /ingest/pdf with LinkedIn PDF returns markdown
  - Test /submit with LinkedIn PDF markdown only
  - Test /submit with LinkedIn PDF markdown + GitHub repos
  - Test that AI processing is skipped for LinkedIn-only
  - Test that resume PDF still triggers AI processing
  - Test error handling for invalid LinkedIn PDFs
  - _Requirements: 9.3, 9.4, 9.5_

- [ ] 12. Verify AI processing path remains unchanged

  - Test that resume PDF submissions use AI processing
  - Test that LinkedIn + resume submissions use AI processing
  - Verify AI rate limiting still works correctly
  - Verify monthly quota tracking is unaffected
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 13. Performance testing and optimization

  - Measure direct extraction processing time (target < 3 seconds)
  - Compare with AI processing time
  - Test with various PDF sizes and complexities
  - Optimize any bottlenecks in parsing or mapping
  - _Requirements: 7.1_

- [ ] 14. Documentation and deployment preparation
  - Document pdf_parser package installation process
  - Update backend README with direct extraction feature
  - Document routing logic and processing paths
  - Create deployment checklist
  - Update API documentation with new processing types
  - _Requirements: All_

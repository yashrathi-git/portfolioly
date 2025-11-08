"""
Tests for the extraction processor service.

This module tests the post-processing of AI extraction results,
including profile type detection and error handling.
"""

import pytest
from datetime import datetime

from app.services.extraction_processor import ExtractionProcessor
from app.schemas.extraction import (
    PortfolioExtractionData,
    ExtractedPersonalInfo,
    ExtractedProfile,
    ExtractedWorkExperience,
    ExtractedProject,
    DateInfo,
)
from app.schemas.portfolio import ProfileType


class TestExtractionProcessor:
    """Test suite for ExtractionProcessor."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.processor = ExtractionProcessor()
    
    def test_process_extraction_with_valid_data(self):
        """Test processing valid extraction data."""
        # Arrange
        extraction_data = PortfolioExtractionData(
            personal_info=ExtractedPersonalInfo(
                full_name="John Doe",
                email="john@example.com",
                profiles=[
                    ExtractedProfile(url="https://github.com/johndoe"),
                    ExtractedProfile(url="https://linkedin.com/in/johndoe"),
                ]
            ),
            work_experiences=[
                ExtractedWorkExperience(
                    organization="Tech Corp",
                    title="Software Engineer",
                    start_date=DateInfo(month=1, year=2020),
                    is_current=True,
                )
            ],
        )
        
        # Act
        portfolio_data = self.processor.process_extraction(extraction_data)
        
        # Assert
        assert portfolio_data.personal_info.full_name == "John Doe"
        assert portfolio_data.personal_info.email == "john@example.com"
        assert len(portfolio_data.personal_info.profiles) == 2
        assert portfolio_data.personal_info.profiles[0].type == ProfileType.GITHUB
        assert portfolio_data.personal_info.profiles[1].type == ProfileType.LINKEDIN
        assert len(portfolio_data.work_experiences) == 1
        assert portfolio_data.layout_settings.layout_mode == "both"
        assert portfolio_data.layout_settings.default_layout == "chat"
        assert portfolio_data.metadata.source_type == "unknown"
    
    def test_process_extraction_auto_detects_profile_types(self):
        """Test that profile types are auto-detected from URLs."""
        # Arrange
        extraction_data = PortfolioExtractionData(
            personal_info=ExtractedPersonalInfo(
                profiles=[
                    ExtractedProfile(url="https://github.com/user"),
                    ExtractedProfile(url="https://linkedin.com/in/user"),
                    ExtractedProfile(url="https://twitter.com/user"),
                    ExtractedProfile(url="https://example.com"),
                ]
            )
        )
        
        # Act
        portfolio_data = self.processor.process_extraction(extraction_data)
        
        # Assert
        profiles = portfolio_data.personal_info.profiles
        assert profiles[0].type == ProfileType.GITHUB
        assert profiles[1].type == ProfileType.LINKEDIN
        assert profiles[2].type == ProfileType.TWITTER
        assert profiles[3].type in [ProfileType.WEBSITE, ProfileType.OTHER]
    
    def test_process_extraction_handles_empty_data(self):
        """Test processing with empty extraction data."""
        # Arrange
        extraction_data = PortfolioExtractionData()
        
        # Act
        portfolio_data = self.processor.process_extraction(extraction_data)
        
        # Assert
        assert portfolio_data.personal_info is not None
        assert portfolio_data.work_experiences == []
        assert portfolio_data.projects == []
        assert portfolio_data.education == []
        assert portfolio_data.certifications == []
        assert portfolio_data.layout_settings.layout_mode == "both"
    
    def test_process_extraction_generates_metadata(self):
        """Test metadata generation based on input sources."""
        # Arrange
        from app.schemas.upload import PDFData
        
        extraction_data = PortfolioExtractionData()
        resume_pdf = PDFData(
            text="Resume text",
            source="upload",
            filename="resume.pdf",
            pages=1,
            size=1024,
            checksum="abc123",
            processed_at="2024-01-01T00:00:00Z"
        )
        
        # Act
        portfolio_data = self.processor.process_extraction(
            extraction_data,
            resume_pdf=resume_pdf
        )
        
        # Assert
        assert portfolio_data.metadata.source_type == "resume_pdf"
        assert portfolio_data.metadata.extracted_at is not None
        assert isinstance(portfolio_data.metadata.extracted_at, datetime)
    
    def test_process_extraction_skips_invalid_work_experience(self):
        """Test that invalid work experiences are skipped gracefully."""
        # Arrange - Create a mock object that will fail validation
        class InvalidWorkExperience:
            """Mock invalid work experience that will cause processing error."""
            organization = "Invalid Corp"
            title = None
            location = None
            start_date = "invalid_date_format"  # This will cause error
            end_date = None
            is_current = None
            highlights = None
            technologies = None
            more_context = None
        
        extraction_data = PortfolioExtractionData(
            work_experiences=[
                ExtractedWorkExperience(organization="Valid Corp", title="Engineer"),
            ]
        )
        
        # Manually inject an invalid entry to test error handling
        extraction_data.work_experiences.append(InvalidWorkExperience())
        
        # Act
        portfolio_data = self.processor.process_extraction(extraction_data)
        
        # Assert - should only have the valid entry
        assert len(portfolio_data.work_experiences) == 1
        assert portfolio_data.work_experiences[0].organization == "Valid Corp"
    
    def test_process_extraction_skips_profiles_without_url(self):
        """Test that profiles without URLs are skipped."""
        # Arrange
        extraction_data = PortfolioExtractionData(
            personal_info=ExtractedPersonalInfo(
                profiles=[
                    ExtractedProfile(url="https://github.com/user"),
                    ExtractedProfile(url=None),  # Should be skipped
                    ExtractedProfile(url=""),  # Should be skipped
                ]
            )
        )
        
        # Act
        portfolio_data = self.processor.process_extraction(extraction_data)
        
        # Assert
        assert len(portfolio_data.personal_info.profiles) == 1
        assert portfolio_data.personal_info.profiles[0].url == "https://github.com/user"
    
    def test_process_extraction_sets_default_layout_settings(self):
        """Test that layout settings are always set with defaults."""
        # Arrange
        extraction_data = PortfolioExtractionData()
        
        # Act
        portfolio_data = self.processor.process_extraction(extraction_data)
        
        # Assert
        assert portfolio_data.layout_settings is not None
        assert portfolio_data.layout_settings.layout_mode == "both"
        assert portfolio_data.layout_settings.default_layout == "chat"
    
    def test_fallback_portfolio_creation(self):
        """Test fallback portfolio creation on error."""
        # Act
        fallback = self.processor._create_fallback_portfolio()
        
        # Assert
        assert fallback.personal_info is not None
        assert fallback.work_experiences == []
        assert fallback.projects == []
        assert fallback.education == []
        assert fallback.certifications == []
        assert fallback.layout_settings.layout_mode == "both"
        assert fallback.metadata.source_type == "error"


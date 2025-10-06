"""
Integration tests for the complete AI workflow.

Tests the end-to-end AI processing workflow including rate limiting,
error handling, and data prioritization rules.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, timedelta
import json

from app.services.ai_processor import (
    AIProcessor,
    AIProcessingError,
    TokenLimitExceededError,
)
from app.services.portfolio_service import PortfolioService
from app.services.ai_rate_limiter import AIRateLimiter, AIRateLimitError
from app.schemas.portfolio import PortfolioData, PersonalInfo, WorkExperience, Project
from app.schemas.upload import PDFData, GitHubRepoData


class TestAIWorkflowIntegration:
    """Test complete AI workflow integration."""

    @pytest.fixture
    def mock_firebase(self):
        """Mock Firebase for all services."""
        with patch("app.services.portfolio_service.firebase_admin"), patch(
            "app.services.portfolio_service.firestore"
        ), patch("app.services.ai_rate_limiter.firebase_admin"), patch(
            "app.services.ai_rate_limiter.firestore"
        ):
            yield

    @pytest.fixture
    def sample_resume_pdf(self):
        """Sample resume PDF data."""
        return PDFData(
            text="""
            John Doe
            Software Engineer
            
            EXPERIENCE
            Senior Software Engineer at Google (2020-2023)
            - Built scalable microservices using Python and Go
            - Led team of 5 developers
            - Improved system performance by 40%
            
            Software Engineer at Microsoft (2018-2020)
            - Developed web applications using React and Node.js
            - Implemented CI/CD pipelines
            
            EDUCATION
            BS Computer Science, Stanford University (2014-2018)
            GPA: 3.8
            
            SKILLS
            Python, Go, React, Node.js, Docker, Kubernetes
            """,
            source="resume",
            filename="resume.pdf",
            pages=2,
            size=2048,
            checksum="resume123",
            processed_at="2023-01-01T00:00:00Z",
        )

    @pytest.fixture
    def sample_linkedin_pdf(self):
        """Sample LinkedIn PDF data."""
        return PDFData(
            text="""
            John Doe - Senior Software Engineer
            
            About
            Passionate software engineer with 5+ years of experience
            
            Experience
            Senior Software Engineer at Google
            Jan 2020 - Dec 2023
            Mountain View, CA
            
            Software Engineer at Microsoft
            Jun 2018 - Dec 2019
            Seattle, WA
            """,
            source="linkedin",
            filename="linkedin.pdf",
            pages=1,
            size=1024,
            checksum="linkedin123",
            processed_at="2023-01-01T00:00:00Z",
        )

    @pytest.fixture
    def sample_github_repos(self):
        """Sample GitHub repository data."""
        return [
            GitHubRepoData(
                id=1,
                name="microservice-framework",
                description="A lightweight microservice framework in Go",
                url="https://github.com/johndoe/microservice-framework",
                language="Go",
                stars=250,
                fork=False,
                private=False,
                created_at="2021-01-01T00:00:00Z",
                updated_at="2023-12-01T00:00:00Z",
            ),
            GitHubRepoData(
                id=2,
                name="react-dashboard",
                description="Modern React dashboard with TypeScript",
                url="https://github.com/johndoe/react-dashboard",
                language="TypeScript",
                stars=150,
                fork=False,
                private=False,
                created_at="2020-06-01T00:00:00Z",
                updated_at="2023-11-01T00:00:00Z",
            ),
        ]

    def test_github_only_workflow(self, mock_firebase, sample_github_repos):
        """Test GitHub-only data processing workflow."""
        # Setup
        portfolio_service = PortfolioService()
        portfolio_service._db = Mock()

        # Mock Firestore operations
        mock_doc_ref = Mock()
        mock_doc_ref.set = Mock()
        portfolio_service._db.collection.return_value.document.return_value = (
            mock_doc_ref
        )

        # Process GitHub-only data
        portfolio_data = portfolio_service.map_github_only_data(sample_github_repos)

        # Verify portfolio data structure
        assert isinstance(portfolio_data, PortfolioData)
        assert len(portfolio_data.projects) == 2
        assert portfolio_data.metadata.source_type == "github_only"

        # Verify project data prioritization (GitHub data preserved)
        project1 = portfolio_data.projects[0]
        assert project1.name == "microservice-framework"
        assert project1.github == "https://github.com/johndoe/microservice-framework"
        assert "Go" in project1.technologies

        # Store data
        success = portfolio_service.store_portfolio_data("user123", portfolio_data)
        assert success is True
        mock_doc_ref.set.assert_called_once()

    @patch("app.services.ai_processor.tiktoken")
    @patch("app.services.ai_processor.OpenAI")
    @pytest.mark.asyncio
    async def test_ai_processing_workflow_success(
        self,
        mock_client_class,
        mock_tiktoken,
        mock_firebase,
        sample_resume_pdf,
        sample_linkedin_pdf,
        sample_github_repos,
    ):
        """Test successful AI processing workflow with PDF data."""
        # Setup mocks
        mock_encoder = Mock()
        mock_encoder.encode.return_value = [1] * 100  # 100 tokens
        mock_tiktoken.get_encoding.return_value = mock_encoder

        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps(
            {
                "personal_info": {
                    "full_name": "John Doe",
                    "headline": "Senior Software Engineer",
                    "email": "john.doe@example.com",
                },
                "work_experiences": [
                    {
                        "organization": "Google",
                        "title": "Senior Software Engineer",
                        "start_date": {"month": 1, "year": 2020},
                        "end_date": {"month": 12, "year": 2023},
                        "is_current": False,
                        "highlights": [
                            "Built scalable microservices",
                            "Led team of 5 developers",
                        ],
                        "technologies": ["Python", "Go"],
                    }
                ],
                "projects": [
                    {
                        "name": "microservice-framework",
                        "role": "Creator",
                        "technologies": ["Go"],
                        "github": "https://github.com/johndoe/microservice-framework",
                    }
                ],
                "education": [
                    {
                        "institution": "Stanford University",
                        "degree": "Bachelor of Science",
                        "branch": "Computer Science",
                        "start_date": {"month": 9, "year": 2014},
                        "end_date": {"month": 6, "year": 2018},
                    }
                ],
                "certifications": [],
                "text_blobs": {},
                "metadata": {
                    "source_type": "resume_pdf",
                    "extracted_at": "2023-01-01T00:00:00Z",
                },
            }
        )
        mock_client.chat.completions.create.return_value = mock_response
        mock_client_class.return_value = mock_client

        # Setup AI processor
        ai_processor = AIProcessor(
            endpoint="https://test.endpoint.com", api_key="test-key", max_tokens=10000
        )

        # Process data
        portfolio_data = await ai_processor.process_portfolio_data(
            resume_pdf=sample_resume_pdf,
            linkedin_pdf=sample_linkedin_pdf,
            github_repos=sample_github_repos,
        )

        # Verify results
        assert isinstance(portfolio_data, PortfolioData)
        assert portfolio_data.personal_info.full_name == "John Doe"
        assert len(portfolio_data.work_experiences) == 1
        assert len(portfolio_data.projects) == 1
        assert len(portfolio_data.education) == 1

        # Verify data prioritization (resume data preferred)
        work_exp = portfolio_data.work_experiences[0]
        assert work_exp.organization == "Google"
        assert work_exp.title == "Senior Software Engineer"

        # Verify GitHub project data is preserved
        project = portfolio_data.projects[0]
        assert project.name == "microservice-framework"
        assert project.github == "https://github.com/johndoe/microservice-framework"

    def test_ai_rate_limiting_workflow(self, mock_firebase):
        """Test AI processing rate limiting workflow."""
        # Setup rate limiter with mocked Firestore
        rate_limiter = AIRateLimiter()
        rate_limiter._db = Mock()

        # Mock Firestore document operations
        mock_doc_ref = Mock()
        mock_doc = Mock()
        mock_doc.exists = True
        future_reset = datetime.now(timezone.utc) + timedelta(days=30)
        mock_doc.to_dict.return_value = {
            "usage_count": 9,  # Close to limit
            "reset_date": future_reset,
        }
        mock_doc_ref.get.return_value = mock_doc
        rate_limiter._db.collection.return_value.document.return_value = mock_doc_ref

        # Check rate limit (should pass)
        rate_info = rate_limiter.check_rate_limit("user123")
        assert rate_info["current_usage"] == 9
        assert rate_info["remaining"] == 1
        assert rate_info["limit_exceeded"] is False

        # Simulate hitting the limit
        mock_doc.to_dict.return_value["usage_count"] = 10

        # Check rate limit (should fail)
        with pytest.raises(
            AIRateLimitError, match="Monthly AI processing limit exceeded"
        ):
            rate_limiter.check_rate_limit("user123")

    @pytest.mark.asyncio
    async def test_ai_processing_error_handling(self, mock_firebase):
        """Test AI processing error scenarios."""
        # Test token limit exceeded
        ai_processor = AIProcessor(max_tokens=10)
        ai_processor.count_tokens = lambda x: 20  # Always exceeds limit

        with pytest.raises(TokenLimitExceededError):
            await ai_processor.process_portfolio_data(
                resume_pdf=PDFData(
                    text="Very long text that exceeds token limit",
                    source="resume",
                    filename="test.pdf",
                    pages=1,
                    size=1024,
                    checksum="test",
                    processed_at="2023-01-01T00:00:00Z",
                )
            )

        # Test AI processing error
        ai_processor = AIProcessor(
            endpoint="https://test.endpoint.com", api_key="test-key"
        )
        ai_processor.client = None  # Simulate no client

        with pytest.raises(AIProcessingError, match="Azure AI client not initialized"):
            await ai_processor.process_portfolio_data()

    @patch("app.services.ai_processor.tiktoken")
    def test_text_truncation_prioritization(self, mock_tiktoken, mock_firebase):
        """Test that text truncation prioritizes resume over LinkedIn."""
        # Setup
        mock_encoder = Mock()
        mock_encoder.encode.return_value = [1] * 50  # Each text = 50 tokens
        mock_tiktoken.get_encoding.return_value = mock_encoder

        ai_processor = AIProcessor(max_tokens=75)  # Can fit resume + partial LinkedIn

        resume_text = "RESUME: Important work experience details"
        linkedin_text = "LINKEDIN: Additional profile information"

        # Test truncation
        result = ai_processor.truncate_text_intelligently(
            resume_text=resume_text, linkedin_text=linkedin_text
        )

        # Resume content should be prioritized
        assert "RESUME" in result
        assert "Important work experience" in result

    def test_data_validation_workflow(self, mock_firebase):
        """Test portfolio data validation workflow."""
        ai_processor = AIProcessor()

        # Test with good data
        good_data = PortfolioData(
            personal_info=PersonalInfo(full_name="John Doe", email="john@example.com"),
            work_experiences=[WorkExperience(organization="Google", title="Engineer")],
        )

        result = ai_processor.validate_portfolio_data(good_data)
        assert result is True

        # Test with empty data
        empty_data = PortfolioData()
        result = ai_processor.validate_portfolio_data(empty_data)
        assert result is False

    def test_end_to_end_error_recovery(self, mock_firebase, sample_github_repos):
        """Test end-to-end workflow with error recovery."""
        # Setup services
        portfolio_service = PortfolioService()
        portfolio_service._db = Mock()

        # Mock successful GitHub-only fallback
        mock_doc_ref = Mock()
        mock_doc_ref.set = Mock()
        portfolio_service._db.collection.return_value.document.return_value = (
            mock_doc_ref
        )

        # Simulate AI processing failure, fallback to GitHub-only
        try:
            # This would normally trigger AI processing
            raise AIProcessingError("AI service unavailable")
        except AIProcessingError:
            # Fallback to GitHub-only processing
            portfolio_data = portfolio_service.map_github_only_data(sample_github_repos)
            success = portfolio_service.store_portfolio_data("user123", portfolio_data)

            assert success is True
            assert portfolio_data.metadata.source_type == "github_only"
            assert len(portfolio_data.projects) == 2

    def test_monthly_rate_limit_reset(self, mock_firebase):
        """Test monthly rate limit reset functionality."""
        rate_limiter = AIRateLimiter()
        rate_limiter._db = Mock()

        # Mock old rate limit data (previous month)
        mock_doc_ref = Mock()
        mock_doc = Mock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "usage_count": 10,  # At limit
            "reset_date": datetime(2023, 12, 1, tzinfo=timezone.utc),  # Previous month
        }
        mock_doc_ref.get.return_value = mock_doc
        mock_doc_ref.update = Mock()
        rate_limiter._db.collection.return_value.document.return_value = mock_doc_ref

        # Check rate limit (should reset and allow)
        rate_info = rate_limiter.check_rate_limit("user123")

        # Verify reset was called
        mock_doc_ref.update.assert_called_once()
        update_call = mock_doc_ref.update.call_args[0][0]
        assert update_call["usage_count"] == 0
        assert "reset_date" in update_call

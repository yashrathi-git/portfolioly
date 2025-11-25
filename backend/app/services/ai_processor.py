"""
AI processing service for portfolio data extraction.

This service handles AI-powered extraction of structured portfolio data
from unstructured PDF text and GitHub repository information using
Azure AI Inference with cost controls and intelligent text truncation.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List

import tiktoken
from openai import AsyncOpenAI

from ..core.config import settings
from ..schemas.portfolio import PortfolioData
from ..schemas.extraction import PortfolioExtractionData
from ..schemas.upload import GitHubRepoData, PDFData
from ..constants.chat_config import ChatConfig
from ..constants.extraction_prompts import PORTFOLIO_EXTRACTION_PROMPT
from .extraction_processor import get_extraction_processor
from .linkedin_formatter import format_linkedin_for_ai


logger = logging.getLogger(__name__)


class AIProcessingError(Exception):
    """Custom exception for AI processing operations."""

    pass


class TokenLimitExceededError(AIProcessingError):
    """Exception raised when input exceeds token limits."""

    pass


class AIProcessor:
    """
    Modular AI processor for portfolio data extraction.

    This class handles Azure AI Inference and Google Gemini integration with
    structured response formatting, token counting, and intelligent text truncation.
    """

    # Token counting configuration
    MAX_TOKENS_PER_REQUEST = 5000  # Default token limit for abuse prevention
    MODEL_ENCODING = "cl100k_base"  # Default encoding for GPT models

    # Request configuration
    DEFAULT_REQUEST_TIMEOUT = 150  # Seconds

    # Gemini configuration
    GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        max_tokens: Optional[int] = None,
        request_timeout: Optional[float] = None,
    ):
        """
        Initialize the AI processor.

        Args:
            endpoint: Azure AI endpoint URL or Gemini base URL
            api_key: Azure AI API key or Gemini API key
            model_name: Model name to use
            max_tokens: Maximum tokens per request (overrides default)
        """
        default_model = (
            settings.azure_ai_processor_model or ChatConfig.PROCESSOR_MODEL_NAME
        )
        self.model_name = model_name or default_model
        self.max_tokens = max_tokens or self.MAX_TOKENS_PER_REQUEST
        self.request_timeout = float(
            request_timeout
            if request_timeout is not None
            else getattr(settings, "azure_ai_request_timeout", None)
            or self.DEFAULT_REQUEST_TIMEOUT
        )

        # Determine if we're using Gemini based on model name
        self.is_gemini = "gemini" in self.model_name.lower()

        # Set endpoint and API key based on model type
        if self.is_gemini:
            self.endpoint = endpoint or self.GEMINI_BASE_URL
            self.api_key = api_key or settings.gemini_api_key
        else:
            self.endpoint = endpoint or settings.azure_ai_endpoint
            self.api_key = api_key or settings.azure_ai_api_key

        # Initialize prompt cache directory
        self.prompt_cache_dir = Path(__file__).parent / "prompt_cache"
        self.prompt_cache_dir.mkdir(exist_ok=True)

        # Initialize tiktoken encoder
        try:
            self.encoder = tiktoken.get_encoding(self.MODEL_ENCODING)
        except Exception as e:
            logger.warning(f"Failed to load tiktoken encoder: {e}, using fallback")
            self.encoder = None

        # Initialize OpenAI-compatible client
        if self.endpoint and self.api_key:
            self.client = AsyncOpenAI(
                base_url=self.endpoint,
                api_key=self.api_key,
                timeout=self.request_timeout,
                max_retries=1,
            )
            logger.info(
                f"Initialized AI client with model: {self.model_name} ({'Gemini' if self.is_gemini else 'Azure AI'})"
            )
        else:
            logger.warning(
                f"AI credentials not provided for {self.model_name}, client not initialized"
            )
            self.client = None

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text using tiktoken.

        Args:
            text: Text to count tokens for

        Returns:
            int: Number of tokens
        """
        if self.encoder:
            return len(self.encoder.encode(text))
        else:
            # Fallback: approximate 1 token = 4 characters
            return len(text) // 4

    def truncate_text_intelligently(
        self,
        resume_text: Optional[str] = None,
        linkedin_text: Optional[str] = None,
        github_data: Optional[List[GitHubRepoData]] = None,
    ) -> str:
        """
        Intelligently truncate input text to fit within token limits.

        Prioritizes resume content over LinkedIn content. GitHub data is
        always included as it's minimal. LinkedIn text is pre-processed
        for better structured extraction.

        Args:
            resume_text: Resume PDF text
            linkedin_text: LinkedIn PDF text
            github_data: GitHub repository data

        Returns:
            str: Truncated text that fits within token limits
        """
        # Build content blocks in priority order
        content_blocks = []

        # GitHub data (always include, minimal tokens)
        if github_data:
            github_summary = self._format_github_data(github_data)
            content_blocks.append(("GitHub Repositories", github_summary))

        # Resume content (highest priority) - send raw text
        if resume_text:
            content_blocks.append(("Resume", resume_text.strip()))

        # LinkedIn content (lower priority) - pre-process for better extraction
        if linkedin_text:
            try:
                formatted_linkedin = format_linkedin_for_ai(linkedin_text)
                content_blocks.append(("LinkedIn Profile", formatted_linkedin.strip()))
            except Exception as e:
                logger.warning(
                    f"Failed to format LinkedIn data: {str(e)}, using raw text"
                )
                content_blocks.append(("LinkedIn Profile", linkedin_text.strip()))

        # Build final content within token limits
        final_content = []
        current_tokens = 0

        for section_name, content in content_blocks:
            section_tokens = self.count_tokens(content)

            if current_tokens + section_tokens <= self.max_tokens:
                final_content.append(f"## {section_name}\n{content}")
                current_tokens += section_tokens
            else:
                # Try to fit partial content
                remaining_tokens = self.max_tokens - current_tokens
                if remaining_tokens > 100:  # Only if we have meaningful space left
                    truncated_content = self._truncate_to_tokens(
                        content, remaining_tokens
                    )
                    final_content.append(f"## {section_name}\n{truncated_content}")
                break

        result = "\n\n".join(final_content)
        logger.info(f"Truncated input to {self.count_tokens(result)} tokens")
        return result

    def _format_github_data(self, github_data: List[GitHubRepoData]) -> str:
        """Format GitHub repository data for AI processing."""
        if not github_data:
            return "No GitHub repositories provided."

        formatted_repos = []
        for repo in github_data:
            repo_info = [
                f"Name: {repo.name}",
                f"Description: {repo.description or 'No description'}",
                f"Language: {repo.language or 'Not specified'}",
                f"Stars: {repo.stars}",
                f"URL: {repo.url}",
            ]
            formatted_repos.append("\n".join(repo_info))

        return "\n\n".join(formatted_repos)

    def _truncate_to_tokens(self, text: str, max_tokens: int) -> str:
        """Truncate text to fit within token limit."""
        if self.count_tokens(text) <= max_tokens:
            return text

        # Binary search to find the right length
        words = text.split()
        left, right = 0, len(words)

        while left < right:
            mid = (left + right + 1) // 2
            candidate = " ".join(words[:mid])

            if self.count_tokens(candidate) <= max_tokens:
                left = mid
            else:
                right = mid - 1

        result = " ".join(words[:left])
        return result + "..." if left < len(words) else result

    async def process_portfolio_data(
        self,
        resume_pdf: Optional[PDFData] = None,
        linkedin_pdf: Optional[PDFData] = None,
        github_repos: Optional[List[GitHubRepoData]] = None,
    ) -> PortfolioData:
        """
        Process portfolio data using AI extraction.

        Args:
            resume_pdf: Resume PDF data
            linkedin_pdf: LinkedIn PDF data
            github_repos: GitHub repository data

        Returns:
            PortfolioData: Extracted and structured portfolio data

        Raises:
            AIProcessingError: If AI processing fails
            TokenLimitExceededError: If input exceeds token limits
        """
        if not self.client:
            raise AIProcessingError("Azure AI client not initialized")

        try:
            # Prepare input text with intelligent truncation
            input_text = self.truncate_text_intelligently(
                resume_text=resume_pdf.text if resume_pdf else None,
                linkedin_text=linkedin_pdf.text if linkedin_pdf else None,
                github_data=github_repos,
            )

            # Check final token count
            final_tokens = self.count_tokens(input_text)
            if final_tokens > self.max_tokens:
                raise TokenLimitExceededError(
                    f"Input still exceeds token limit after truncation: {final_tokens} > {self.max_tokens}"
                )

            # Create messages
            messages = [
                {"role": "system", "content": PORTFOLIO_EXTRACTION_PROMPT.strip()},
                {"role": "user", "content": input_text.strip()},
            ]

            # Cache the final prompt for debugging
            self._cache_final_prompt(PORTFOLIO_EXTRACTION_PROMPT, input_text)

            # Call Azure AI with structured output using .parse()
            # The .parse() method automatically:
            # 1. Generates JSON schema from Pydantic model
            # 2. Adds "additionalProperties": false to all objects (required for strict mode)
            # 3. Validates and parses the response into the Pydantic model
            # 4. Handles refusals gracefully
            completion = await self.client.chat.completions.parse(
                model=self.model_name,
                messages=messages,
                response_format=PortfolioExtractionData,
                timeout=self.request_timeout,
            )

            # Extract parsed response
            message = completion.choices[0].message

            # Check for refusal
            if message.refusal:
                logger.error(f"AI refused to respond: {message.refusal}")
                raise AIProcessingError(f"AI refused to respond: {message.refusal}")

            # Get the parsed extraction data
            extraction_data = message.parsed
            if not extraction_data:
                raise AIProcessingError("No parsed data returned from AI")

            # Post-process extraction data to full portfolio data
            processor = get_extraction_processor()
            portfolio_data = processor.process_extraction(
                extraction_data=extraction_data,
                resume_pdf=resume_pdf,
                linkedin_pdf=linkedin_pdf,
                github_repos=github_repos,
            )

            logger.info("Successfully processed portfolio data with AI")
            return portfolio_data

        except TokenLimitExceededError:
            raise
        except Exception as e:
            logger.error(f"AI processing failed: {str(e)}")
            raise AIProcessingError(f"AI processing failed: {str(e)}")

    def validate_response(self, response_content: str) -> PortfolioData:
        """
        Validate AI response and convert to PortfolioData.

        DEPRECATED: Use validate_extraction_response instead.
        Kept for backwards compatibility.

        Args:
            response_content: JSON response from AI

        Returns:
            PortfolioData: Validated portfolio data

        Raises:
            AIProcessingError: If validation fails
        """
        try:
            # Parse JSON response
            response_dict = json.loads(response_content)

            # Convert to PortfolioData using Pydantic validation
            portfolio_data = PortfolioData.model_validate(response_dict)

            # Additional validation
            if not self.validate_portfolio_data(portfolio_data):
                logger.warning("Portfolio data validation warnings detected")

            return portfolio_data

        except json.JSONDecodeError as e:
            raise AIProcessingError(f"Invalid JSON response from AI: {str(e)}")
        except Exception as e:
            raise AIProcessingError(f"Response validation failed: {str(e)}")

    def validate_extraction_data(self, data: PortfolioExtractionData) -> bool:
        """
        Validate extraction data completeness and quality.

        Args:
            data: Extraction data to validate

        Returns:
            bool: True if data passes quality checks
        """
        warnings = []

        # Check if we have any meaningful data
        has_personal_info = data.personal_info and (
            data.personal_info.full_name or data.personal_info.email
        )
        has_work_experience = data.work_experiences and len(data.work_experiences) > 0
        has_projects = data.projects and len(data.projects) > 0
        has_education = data.education and len(data.education) > 0

        if not any(
            [has_personal_info, has_work_experience, has_projects, has_education]
        ):
            warnings.append("No meaningful data extracted")

        # Check for common extraction issues
        if data.personal_info and data.personal_info.full_name:
            if len(data.personal_info.full_name) < 2:
                warnings.append("Full name seems too short")

        # Log warnings
        if warnings:
            logger.warning(
                f"Extraction data validation warnings: {', '.join(warnings)}"
            )
            return False

        return True

    def validate_portfolio_data(self, data: PortfolioData) -> bool:
        """
        Validate portfolio data completeness and quality.

        DEPRECATED: Use validate_extraction_data instead.
        Kept for backwards compatibility.

        Args:
            data: Portfolio data to validate

        Returns:
            bool: True if data passes quality checks
        """
        warnings = []

        # Check if we have any meaningful data
        has_personal_info = data.personal_info and (
            data.personal_info.full_name or data.personal_info.email
        )
        has_work_experience = data.work_experiences and len(data.work_experiences) > 0
        has_projects = data.projects and len(data.projects) > 0
        has_education = data.education and len(data.education) > 0

        if not any(
            [has_personal_info, has_work_experience, has_projects, has_education]
        ):
            warnings.append("No meaningful data extracted")

        # Check for common extraction issues
        if data.personal_info and data.personal_info.full_name:
            if len(data.personal_info.full_name) < 2:
                warnings.append("Full name seems too short")

        # Log warnings
        if warnings:
            logger.warning(f"Portfolio data validation warnings: {', '.join(warnings)}")
            return False

        return True

    def _cache_final_prompt(self, system_prompt: str, user_input: str) -> None:
        """
        Cache the final prompt that gets sent to the AI model for debugging.

        Args:
            system_prompt: The system prompt
            user_input: The user input text
        """
        try:
            # Create cache directory if it doesn't exist
            cache_dir = Path(
                "/home/yashrathi/Documents/AA_Essential_projx/portfolioly/portfolioly-final/backend/app/services/prompt_cache"
            )
            cache_dir.mkdir(exist_ok=True)

            # Always overwrite the latest cache file
            cache_file = cache_dir / "ai_prompt_latest.txt"

            # Format the complete prompt
            prompt_content = f"""
=== AI PORTFOLIO EXTRACTION PROMPT CACHE ===
Generated at: {datetime.now().isoformat()}
Model: {self.model_name}
Max Tokens: {self.max_tokens}
Input Token Count: {self.count_tokens(user_input)}

=== SYSTEM PROMPT ===
{system_prompt}

=== USER INPUT ===
{user_input}

=== END OF PROMPT ===
"""

            # Write to cache file
            with open(cache_file, "w", encoding="utf-8") as f:
                f.write(prompt_content)

            logger.info(f"Cached AI prompt to: {cache_file}")

            # Remove any stale cache files to keep only the latest entry
            self._cleanup_old_cache_files(cache_dir, cache_file)

        except Exception as e:
            logger.warning(f"Failed to cache AI prompt: {str(e)}")

    def _cleanup_old_cache_files(
        self, cache_dir: Path, latest_file: Optional[Path] = None
    ) -> None:
        """
        Clean up old cache files, keeping only the most recent ones.

        Args:
            cache_dir: Directory containing cache files
            keep_count: Number of recent files to keep
        """
        try:
            for cache_file in cache_dir.glob("*.txt"):
                if latest_file is None or cache_file.resolve() != latest_file.resolve():
                    cache_file.unlink()
                    logger.debug(f"Removed stale cache file: {cache_file}")

        except Exception as e:
            logger.warning(f"Failed to cleanup old cache files: {str(e)}")


# Global service instance
_ai_processor: Optional[AIProcessor] = None


def get_ai_processor() -> AIProcessor:
    """Get or create the global AI processor instance."""
    global _ai_processor
    if _ai_processor is None:
        _ai_processor = AIProcessor()
    return _ai_processor

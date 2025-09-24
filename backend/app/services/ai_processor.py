"""
AI processing service for portfolio data extraction.

This service handles AI-powered extraction of structured portfolio data
from unstructured PDF text and GitHub repository information using
Azure AI Inference with cost controls and intelligent text truncation.
"""

import json
import logging
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path

import tiktoken
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage, JsonSchemaFormat
from azure.core.credentials import AzureKeyCredential

from ..core.config import settings
from ..schemas.portfolio import PortfolioData
from ..schemas.upload import GitHubRepoData, PDFData

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

    This class handles Azure AI Inference integration with structured response
    formatting, token counting, and intelligent text truncation.
    """

    # Token counting configuration
    MAX_TOKENS_PER_REQUEST = 50000  # Default token limit
    MODEL_ENCODING = "cl100k_base"  # Default encoding for GPT models

    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        model_name: str = "grok-3-mini",
        max_tokens: Optional[int] = None,
    ):
        """
        Initialize the AI processor.

        Args:
            endpoint: Azure AI endpoint URL
            api_key: Azure AI API key
            model_name: Model name to use
            max_tokens: Maximum tokens per request (overrides default)
        """
        self.endpoint = endpoint or settings.azure_ai_endpoint
        self.api_key = api_key or settings.azure_ai_api_key
        self.model_name = model_name
        self.max_tokens = max_tokens or self.MAX_TOKENS_PER_REQUEST

        # Initialize prompt cache directory
        self.prompt_cache_dir = Path(__file__).parent / "prompt_cache"
        self.prompt_cache_dir.mkdir(exist_ok=True)

        # Initialize tiktoken encoder
        try:
            self.encoder = tiktoken.get_encoding(self.MODEL_ENCODING)
        except Exception as e:
            logger.warning(f"Failed to load tiktoken encoder: {e}, using fallback")
            self.encoder = None

        # Initialize Azure AI client
        logging.warning(self.endpoint)
        logging.warning(self.api_key)
        if self.endpoint and self.api_key:
            self.client = ChatCompletionsClient(
                endpoint=self.endpoint, credential=AzureKeyCredential(self.api_key)
            )
        else:
            logger.warning("Azure AI credentials not provided, client not initialized")
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
        always included as it's minimal. Sends raw text to AI for proper
        content extraction and segregation.

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

        # LinkedIn content (lower priority) - send raw text
        if linkedin_text:
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

    def process_portfolio_data(
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

            # Create structured response format
            schema = PortfolioData.model_json_schema()
            response_format = JsonSchemaFormat(
                name="portfolio_extraction",
                schema=schema,
                description="Structured portfolio data extraction from PDF and GitHub sources",
                strict=True,
            )

            # Load extraction prompt
            from ..constants.extraction_prompts import PORTFOLIO_EXTRACTION_PROMPT

            # Create messages
            messages = [
                SystemMessage(content=PORTFOLIO_EXTRACTION_PROMPT),
                UserMessage(content=input_text),
            ]

            # Cache the final prompt for debugging
            self._cache_final_prompt(PORTFOLIO_EXTRACTION_PROMPT, input_text)

            # Call Azure AI with structured output
            response = self.client.complete(
                messages=messages,
                response_format=response_format,
                model=self.model_name,
            )

            # Extract and validate response
            response_content = response.choices[0].message.content
            portfolio_data = self.validate_response(response_content)

            logger.info("Successfully processed portfolio data with AI")
            return portfolio_data

        except Exception as e:
            logger.error(f"AI processing failed: {str(e)}")
            raise AIProcessingError(f"AI processing failed: {str(e)}")

    def validate_response(self, response_content: str) -> PortfolioData:
        """
        Validate AI response and convert to PortfolioData.

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

    def validate_portfolio_data(self, data: PortfolioData) -> bool:
        """
        Validate portfolio data completeness and quality.

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

            # Generate timestamp for filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            cache_file = cache_dir / f"ai_prompt_{timestamp}.txt"

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

            # Keep only the last 10 cache files to prevent disk bloat
            self._cleanup_old_cache_files(cache_dir)

        except Exception as e:
            logger.warning(f"Failed to cache AI prompt: {str(e)}")

    def _cleanup_old_cache_files(self, cache_dir: Path, keep_count: int = 10) -> None:
        """
        Clean up old cache files, keeping only the most recent ones.

        Args:
            cache_dir: Directory containing cache files
            keep_count: Number of recent files to keep
        """
        try:
            # Get all cache files sorted by modification time (newest first)
            cache_files = sorted(
                cache_dir.glob("ai_prompt_*.txt"),
                key=lambda f: f.stat().st_mtime,
                reverse=True,
            )

            # Remove old files beyond the keep count
            for old_file in cache_files[keep_count:]:
                old_file.unlink()
                logger.debug(f"Removed old cache file: {old_file}")

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

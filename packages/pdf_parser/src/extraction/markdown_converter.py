"""PDF to Markdown conversion using pymupdf4llm.

This module provides functionality to convert PDF documents to markdown format
optimized for LLM processing. It supports both file paths and byte streams as
input, making it flexible for various use cases.
"""

from pathlib import Path
from typing import Union
import io


def convert_pdf_to_markdown(pdf_source: Union[Path, bytes, str]) -> str:
    """
    Convert PDF to markdown using pymupdf4llm.

    This function converts PDF documents to markdown format optimized for
    parsing and LLM processing. It handles both file paths and byte streams,
    making it suitable for both local file processing and web upload scenarios.

    Args:
        pdf_source: Either a Path object, string path to PDF file, or PDF bytes

    Returns:
        Markdown text optimized for parsing

    Raises:
        ValueError: If PDF conversion fails or input is invalid
        ImportError: If pymupdf4llm is not installed

    Example:
        >>> # From file path
        >>> markdown = convert_pdf_to_markdown(Path("profile.pdf"))
        >>>
        >>> # From bytes
        >>> with open("profile.pdf", "rb") as f:
        ...     pdf_bytes = f.read()
        >>> markdown = convert_pdf_to_markdown(pdf_bytes)
    """
    try:
        import pymupdf4llm
    except ImportError as e:
        raise ImportError(
            "pymupdf4llm is required for PDF conversion. "
            "Install it with: pip install pymupdf4llm==0.1.8"
        ) from e

    if not pdf_source:
        raise ValueError("PDF source cannot be empty or None")

    try:
        # Handle different input types
        if isinstance(pdf_source, bytes):
            # pymupdf4llm.to_markdown can handle bytes directly via a file-like object
            pdf_stream = io.BytesIO(pdf_source)
            markdown_text = pymupdf4llm.to_markdown(pdf_stream)
        elif isinstance(pdf_source, (Path, str)):
            # Handle Path objects and string paths
            pdf_path = str(pdf_source) if isinstance(pdf_source, Path) else pdf_source

            # Validate file exists if it's a path
            if not Path(pdf_path).exists():
                raise ValueError(f"PDF file not found: {pdf_path}")

            markdown_text = pymupdf4llm.to_markdown(pdf_path)
        else:
            raise ValueError(
                f"Invalid PDF source type: {type(pdf_source).__name__}. "
                "Expected Path, str, or bytes."
            )

        # Validate output
        if not markdown_text or not markdown_text.strip():
            raise ValueError("PDF conversion resulted in empty markdown content")

        return markdown_text

    except ImportError:
        # Re-raise ImportError as-is
        raise
    except ValueError:
        # Re-raise ValueError as-is
        raise
    except Exception as e:
        # Wrap any other exceptions in ValueError with context
        raise ValueError(f"Failed to convert PDF to markdown: {str(e)}") from e


__all__ = ["convert_pdf_to_markdown"]

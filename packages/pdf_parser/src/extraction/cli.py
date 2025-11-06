#!/usr/bin/env python
"""Command-line interface for LinkedIn PDF extraction.

This module provides a CLI tool for converting LinkedIn PDF exports to
structured JSON data. It can be used as a standalone tool or integrated
into larger workflows.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import NoReturn, Optional

from .api import parse_profile_from_pdf


def main(argv: Optional[list] = None) -> int:
    """
    Main entry point for the CLI.

    Args:
        argv: Command-line arguments (defaults to sys.argv)

    Returns:
        Exit code (0 for success, 1 for error)
    """
    parser = argparse.ArgumentParser(
        description="Extract structured data from LinkedIn PDF exports",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract from PDF and print JSON
  linkedin-extract profile.pdf

  # Save output to file
  linkedin-extract profile.pdf -o output.json

  # Pretty-print JSON
  linkedin-extract profile.pdf --pretty
        """,
    )

    parser.add_argument(
        "pdf_file",
        type=Path,
        help="Path to LinkedIn PDF export file",
    )

    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output file path (defaults to stdout)",
    )

    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON output with indentation",
    )

    parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="Indentation level for pretty-printing (default: 2)",
    )

    args = parser.parse_args(argv)

    # Validate input file
    if not args.pdf_file.exists():
        print(f"Error: File not found: {args.pdf_file}", file=sys.stderr)
        return 1

    if not args.pdf_file.is_file():
        print(f"Error: Not a file: {args.pdf_file}", file=sys.stderr)
        return 1

    try:
        # Parse the PDF
        profile_data = parse_profile_from_pdf(args.pdf_file)

        # Format JSON output
        if args.pretty:
            json_output = json.dumps(
                profile_data, indent=args.indent, ensure_ascii=False
            )
        else:
            json_output = json.dumps(profile_data, ensure_ascii=False)

        # Write output
        if args.output:
            args.output.write_text(json_output, encoding="utf-8")
            print(f"Successfully extracted profile to: {args.output}", file=sys.stderr)
        else:
            print(json_output)

        return 0

    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except ImportError as e:
        print(f"Error: Missing dependency - {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

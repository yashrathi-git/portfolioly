#!/usr/bin/env python3
"""Command-line entry point for the markdown extraction workflow."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_PATH = REPO_ROOT / "src"
if SRC_PATH.as_posix() not in sys.path:
    sys.path.insert(0, SRC_PATH.as_posix())

from extraction import (
    extract_markdown,
    parse_experience_section,
    parse_education_section,
    parse_contact_section,
    parse_languages_section,
    parse_certifications_section,
    parse_honors_awards_section,
    parse_top_skills_section,
)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract structured JSON from a LinkedIn markdown export.",
    )
    parser.add_argument(
        "input",
        type=Path,
        help="Path to the markdown document to process.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path.cwd() / "ext.txt",
        help="Destination file for the serialized JSON output (default: ./ext.txt)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite the output file if it already exists.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])

    input_path: Path = args.input
    output_path: Path = args.output

    if not input_path.exists():
        raise SystemExit(f"Input file not found: {input_path}")

    if output_path.exists() and not args.force:
        raise SystemExit(
            f"Output file already exists: {output_path}. Pass --force to overwrite."
        )

    extraction = extract_markdown(input_path)
    payload = extraction.to_dict()

    # Parse before_h1 sections (Contact, Top Skills, Languages, Certifications, Honors-Awards)
    if extraction.before_h1.sections:
        # Contact section
        for key in ("Contact", "contact"):
            if key in extraction.before_h1.sections:
                contact_block = extraction.before_h1.sections[key]
                parsed_contact = parse_contact_section(contact_block)
                if parsed_contact:
                    payload.setdefault("parsed_sections", {})[
                        "Contact"
                    ] = parsed_contact
                break

        # Top Skills section
        for key in ("Top Skills", "top skills", "Top skills", "top_skills"):
            if key in extraction.before_h1.sections:
                top_skills_block = extraction.before_h1.sections[key]
                parsed_top_skills = parse_top_skills_section(top_skills_block)
                if parsed_top_skills:
                    payload.setdefault("parsed_sections", {})[
                        "Top Skills"
                    ] = parsed_top_skills
                break

        # Languages section
        for key in ("Languages", "languages"):
            if key in extraction.before_h1.sections:
                languages_block = extraction.before_h1.sections[key]
                parsed_languages = parse_languages_section(languages_block)
                if parsed_languages:
                    payload.setdefault("parsed_sections", {})[
                        "Languages"
                    ] = parsed_languages
                break

        # Certifications section
        for key in ("Certifications", "certifications"):
            if key in extraction.before_h1.sections:
                certifications_block = extraction.before_h1.sections[key]
                parsed_certifications = parse_certifications_section(
                    certifications_block
                )
                if parsed_certifications:
                    payload.setdefault("parsed_sections", {})[
                        "Certifications"
                    ] = parsed_certifications
                break

        # Honors-Awards section
        for key in (
            "Honors-Awards",
            "honors-awards",
            "Honors & Awards",
            "honors & awards",
        ):
            if key in extraction.before_h1.sections:
                honors_awards_block = extraction.before_h1.sections[key]
                parsed_honors_awards = parse_honors_awards_section(honors_awards_block)
                if parsed_honors_awards:
                    payload.setdefault("parsed_sections", {})[
                        "Honors-Awards"
                    ] = parsed_honors_awards
                break

    # Parse after_h1 sections (Experience, Education)
    experience_block = None
    if extraction.after_h1.sections:
        for key in ("Experience", "experience"):
            if key in extraction.after_h1.sections:
                experience_block = extraction.after_h1.sections[key]
                break
    if experience_block:
        parsed_experience = parse_experience_section(experience_block)
        if parsed_experience:
            payload.setdefault("parsed_sections", {})["Experience"] = parsed_experience

    education_block = None
    if extraction.after_h1.sections:
        for key in ("Education", "education"):
            if key in extraction.after_h1.sections:
                education_block = extraction.after_h1.sections[key]
                break
    if education_block:
        parsed_education = parse_education_section(education_block)
        if parsed_education:
            payload.setdefault("parsed_sections", {})["Education"] = parsed_education

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"Extraction written to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

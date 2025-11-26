import json
import re
from typing import Dict, Any, List
import pdfplumber  # Requires installation: pip install pdfplumber


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts text from a PDF file.
    """
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def parse_linkedin_pdf_to_json(pdf_path: str) -> str:
    """
    Parses a LinkedIn profile PDF export into structured JSON.
    Handles variations in sections (missing/additional), content lengths, and multi-line entries.
    Assumes standard LinkedIn export format with section headers in uppercase or title case.
    """
    text = extract_text_from_pdf(pdf_path)
    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip() and not re.match(r"Page \d+ of \d+", line.strip())
    ]

    data: Dict[str, Any] = {}
    i = 0
    len_lines = len(lines)

    # Helper to skip to next section header (uppercase or known keywords)
    def skip_to_section(target_keywords: List[str]):
        nonlocal i
        while i < len_lines:
            line_lower = lines[i].lower()
            if any(keyword.lower() in line_lower for keyword in target_keywords):
                return True
            i += 1
        return False

    # Parse Contact (early section, multi-line with labels)
    if skip_to_section(["contact"]):
        i += 1  # Skip header
        contact = {}
        while (
            i < len_lines
            and not re.match(r"^[A-Z\s-]{5,}$", lines[i])
            and not skip_to_section(["top skills", "skills"])
        ):
            line = lines[i].strip()
            if re.match(r"^\d{10}", line):  # Phone number
                contact["phone"] = line.split(" ")[0]
            elif "@" in line:  # Email
                contact["email"] = line
            elif "linkedin" in line.lower():  # LinkedIn
                contact["linkedin"] = line
            elif "github" in line.lower():  # GitHub
                contact["github"] = line
            i += 1
        if contact:
            data["contact"] = contact

    # Parse Top Skills (list of skills)
    if skip_to_section(["top skills", "skills"]):
        i += 1
        skills = []
        while i < len_lines and not re.match(r"^[A-Z\s-]{5,}$", lines[i]):
            skills.append(lines[i])
            i += 1
        if skills:
            data["top_skills"] = [skill.strip() for skill in skills if skill.strip()]

    # Parse Certifications (multi-line list)
    if skip_to_section(["certifications", "licenses"]):
        i += 1
        certs = []
        current_cert = ""
        while i < len_lines and not re.match(r"^[A-Z\s-]{5,}$", lines[i]):
            line = lines[i].strip()
            if line and not line.startswith("-"):  # New cert starts
                if current_cert:
                    certs.append(current_cert.strip())
                current_cert = line
            else:
                current_cert += " " + line
            i += 1
        if current_cert:
            certs.append(current_cert.strip())
        if certs:
            data["certifications"] = certs

    # Parse Honors & Awards (multi-line list)
    if skip_to_section(["honors", "awards"]):
        i += 1
        awards = []
        current_award = ""
        while i < len_lines and not re.match(r"^[A-Z\s-]{5,}$", lines[i]):
            line = lines[i].strip()
            if line and not line.startswith("-"):
                if current_award:
                    awards.append(current_award.strip())
                current_award = line
            else:
                current_award += " " + line
            i += 1
        if current_award:
            awards.append(current_award.strip())
        if awards:
            data["honors_awards"] = awards

    # Parse Name, Title, Location (after awards, before Summary)
    # Assume next non-upper lines after awards are name/title/location
    while i < len_lines and re.match(r"^[A-Z\s-]{5,}$", lines[i]):
        i += 1
    if i < len_lines:
        data["name"] = lines[i].strip()  # Name
        i += 1
    if i < len_lines:
        data["professional_title"] = lines[i].strip()  # Title
        i += 1
    if i < len_lines:
        data["location"] = lines[i].strip()  # Location
        i += 1

    # Parse Summary/About
    if skip_to_section(["summary", "about"]):
        i += 1
        summary_lines = []
        while i < len_lines and not re.match(r"^[A-Z\s-]{5,}$", lines[i]):
            summary_lines.append(lines[i])
            i += 1
        if summary_lines:
            data["summary"] = " ".join(summary_lines).strip()

    # Parse Experience (multiple entries: Company > Role > Dates > Location > Bullets/Desc)
    experiences: List[Dict[str, Any]] = []
    if skip_to_section(["experience"]):
        i += 1
        while i < len_lines and not skip_to_section(["education"]):
            exp = {}
            # Company (often title case, proper noun)
            while (
                i < len_lines
                and not re.match(r"^[A-Z][a-z]+", lines[i])
                and not re.search(r"\d{4}", lines[i])
            ):
                i += 1
            if i < len_lines:
                exp["company"] = lines[i].strip()
                i += 1

            # Role
            if i < len_lines:
                exp["role"] = lines[i].strip()
                i += 1

            # Dates (contains years like 2024 - 2025)
            if i < len_lines and re.search(r"\d{4}", lines[i]):
                exp["dates"] = lines[i].strip()
                i += 1

            # Location
            if i < len_lines and "," in lines[i] and not re.search(r"\d{4}", lines[i]):
                exp["location"] = lines[i].strip()
                i += 1

            # Description/Bullets ( - or plain lines until next company/role)
            desc = []
            while (
                i < len_lines
                and not (
                    re.match(r"^[A-Z][a-z]+", lines[i]) or re.search(r"\d{4}", lines[i])
                )
                and not skip_to_section(["education"])
            ):
                line = lines[i].strip()
                if line.startswith("-"):
                    desc.append(line[1:].strip())
                elif line:  # Non-bullet desc lines
                    desc.append(line)
                i += 1
            if desc:
                exp["description"] = desc

            if any(exp.values()):  # Only add if has content
                experiences.append(exp)
        if experiences:
            data["experience"] = experiences

    # Parse Education (multiple: School > Degree/Dates)
    educations: List[Dict[str, Any]] = []
    if skip_to_section(["education"]):
        i += 1
        while i < len_lines:
            edu = {}
            # School
            if i < len_lines:
                edu["school"] = lines[i].strip()
                i += 1

            # Degree/Dates
            if i < len_lines:
                edu["degree"] = lines[i].strip()
                i += 1

            if any(edu.values()):
                educations.append(edu)

            # Skip to next school (assume next is school or end)
            while i < len_lines and re.search(r"\d{4}", lines[i]):
                i += 1

        if educations:
            data["education"] = educations

    # Handle any additional sections (e.g., Projects, Volunteer) by treating as generic
    # For simplicity, collect remaining as "other_sections"
    other = {}
    current_section = None
    while i < len_lines:
        if re.match(r"^[A-Z\s-]{5,}$", lines[i]):
            current_section = lines[i].strip()
            i += 1
            continue
        if current_section:
            if current_section not in other:
                other[current_section] = []
            other[current_section].append(lines[i])
        i += 1
    if other:
        data["other_sections"] = other

    return json.dumps(data, indent=4, ensure_ascii=False)


# Example usage:
json_output = parse_linkedin_pdf_to_json("./PDF/Profile.pdf")
print(json_output)

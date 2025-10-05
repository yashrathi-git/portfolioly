"""Helpers for constructing chat system prompts from portfolio data."""

from __future__ import annotations

import textwrap
from typing import List, Optional

from ..schemas.portfolio import (
    PortfolioData,
    PersonalInfo,
    Profile,
    WorkExperience,
    Project,
    Education,
    Certification,
    DateInfo,
    TextBlobs,
)


def _format_date(date_info: Optional[DateInfo]) -> str:
    """Return a human-readable representation for a ``DateInfo`` value."""

    if not date_info:
        return "Unknown"

    parts: List[str] = []
    if date_info.month:
        parts.append(f"{date_info.month:02d}")
    if date_info.year:
        parts.append(str(date_info.year))

    return " / ".join(parts) if parts else "Unknown"


def _format_range(
    start: Optional[DateInfo], end: Optional[DateInfo], is_current: Optional[bool]
) -> str:
    """Return a formatted date range string for experience/education entries."""

    start_str = _format_date(start)
    if is_current:
        end_str = "Present"
    else:
        end_str = _format_date(end)

    if start_str == "Unknown" and end_str == "Unknown":
        return "Dates not provided"

    return f"{start_str} - {end_str}"


def _personal_info_section(info: Optional[PersonalInfo]) -> Optional[str]:
    if not info:
        return None

    lines: List[str] = []

    if info.full_name:
        lines.append(f"Name: {info.full_name}")
    if info.headline:
        lines.append(f"Headline: {info.headline}")
    if info.summary:
        lines.append(f"Summary: {info.summary}")
    if info.location:
        lines.append(f"Location: {info.location}")
    if info.email:
        lines.append(f"Email: {info.email}")
    if info.phone:
        lines.append(f"Phone: {info.phone}")

    profile_lines: List[str] = []
    for profile in info.profiles or []:
        profile_line = _profile_line(profile)
        if profile_line:
            profile_lines.append(profile_line)

    if profile_lines:
        lines.append("Profiles:")
        lines.extend(f"- {item}" for item in profile_lines)

    return "\n".join(lines) if lines else None


def _profile_line(profile: Profile) -> Optional[str]:
    components: List[str] = []
    if profile.type:
        components.append(profile.type.value)
    if profile.label:
        components.append(profile.label)
    if profile.url:
        components.append(profile.url)

    if not components:
        return None

    detail_parts: List[str] = []
    if profile.tags:
        detail_parts.append("tags: " + ", ".join(profile.tags))
    if profile.more_context:
        detail_parts.append(profile.more_context)

    suffix = f" ({'; '.join(detail_parts)})" if detail_parts else ""

    return " | ".join(components) + suffix


def _work_experience_section(
    experiences: Optional[List[WorkExperience]],
) -> Optional[str]:
    if not experiences:
        return None

    entries: List[str] = []

    for index, exp in enumerate(experiences, start=1):
        lines: List[str] = []
        headline_parts: List[str] = []
        if exp.title:
            headline_parts.append(exp.title)
        if exp.organization:
            headline_parts.append(f"at {exp.organization}")
        if headline_parts:
            lines.append(" ".join(headline_parts))

        lines.append(
            f"Duration: {_format_range(exp.start_date, exp.end_date, exp.is_current)}"
        )

        if exp.location:
            lines.append(f"Location: {exp.location}")

        if exp.highlights:
            lines.append("Highlights:")
            lines.extend(f"  - {highlight}" for highlight in exp.highlights)

        if exp.technologies:
            lines.append("Technologies: " + ", ".join(exp.technologies))

        if exp.more_context:
            lines.append(f"Context: {exp.more_context}")

        entry = f"{index}. " + "\n".join(lines)
        entries.append(entry)

    return "\n\n".join(entries)


def _projects_section(projects: Optional[List[Project]]) -> Optional[str]:
    if not projects:
        return None

    entries: List[str] = []

    for index, project in enumerate(projects, start=1):
        lines: List[str] = []
        if project.name:
            lines.append(project.name)
        if project.role:
            lines.append(f"Role: {project.role}")
        if project.highlights:
            lines.append("Highlights:")
            lines.extend(f"  - {highlight}" for highlight in project.highlights)
        if project.technologies:
            lines.append("Technologies: " + ", ".join(project.technologies))
        if project.github:
            lines.append(f"GitHub: {project.github}")
        if project.live_link:
            lines.append(f"Live Link: {project.live_link}")
        if project.more_context:
            lines.append(f"Context: {project.more_context}")

        if not lines:
            continue

        entries.append(f"{index}. " + "\n".join(lines))

    return "\n\n".join(entries) if entries else None


def _education_section(education_items: Optional[List[Education]]) -> Optional[str]:
    if not education_items:
        return None

    entries: List[str] = []
    for index, edu in enumerate(education_items, start=1):
        lines: List[str] = []
        if edu.degree or edu.branch:
            degree_parts = [part for part in [edu.degree, edu.branch] if part]
            lines.append(
                "Degree: " + " in ".join(degree_parts)
                if degree_parts
                else "Degree: Not specified"
            )
        if edu.institution:
            lines.append(f"Institution: {edu.institution}")
        lines.append(
            f"Duration: {_format_range(edu.start_date, edu.end_date, edu.is_current)}"
        )
        if edu.location:
            lines.append(f"Location: {edu.location}")
        if edu.grade:
            lines.append(f"Grade: {edu.grade}")

        entries.append(f"{index}. " + "\n".join(lines))

    return "\n\n".join(entries)


def _certifications_section(
    certifications: Optional[List[Certification]],
) -> Optional[str]:
    if not certifications:
        return None

    entries = []
    for index, cert in enumerate(certifications, start=1):
        lines: List[str] = []
        if cert.name:
            lines.append(cert.name)
        if cert.link:
            lines.append(f"Link: {cert.link}")
        entries.append(f"{index}. " + " | ".join(lines))

    return "\n".join(entries) if entries else None


def _text_blobs_section(text_blobs: Optional[TextBlobs]) -> Optional[str]:
    if not text_blobs:
        return None

    lines: List[str] = []
    if text_blobs.achievements:
        lines.append("Achievements:")
        lines.append(text_blobs.achievements)
    if text_blobs.additional_context:
        lines.append("Additional Context:")
        lines.append(text_blobs.additional_context)

    return "\n".join(lines) if lines else None


def build_portfolio_summary(portfolio_data: PortfolioData) -> str:
    """Create a human-readable summary of the portfolio for the system prompt."""

    sections: List[str] = []

    personal_section = _personal_info_section(portfolio_data.personal_info)
    if personal_section:
        sections.append("### Personal Information\n" + personal_section)

    work_section = _work_experience_section(portfolio_data.work_experiences)
    if work_section:
        sections.append("### Work Experience\n" + work_section)

    projects_section = _projects_section(portfolio_data.projects)
    if projects_section:
        sections.append("### Projects\n" + projects_section)

    education_section = _education_section(portfolio_data.education)
    if education_section:
        sections.append("### Education\n" + education_section)

    certifications_section = _certifications_section(portfolio_data.certifications)
    if certifications_section:
        sections.append("### Certifications\n" + certifications_section)

    text_section = _text_blobs_section(portfolio_data.text_blobs)
    if text_section:
        sections.append("### Additional Highlights\n" + text_section)

    return "\n\n".join(sections) if sections else "No portfolio data available"


def build_system_prompt(portfolio_data: PortfolioData) -> str:
    """Generate the full system prompt for the chat model."""

    personal_info = portfolio_data.personal_info or PersonalInfo()
    name = personal_info.full_name or "the portfolio owner"

    portfolio_summary = build_portfolio_summary(portfolio_data)

    prompt = f"""You are an AI assistant for {name}'s portfolio website. Your role is to help visitors learn about {name}'s professional background, skills, and achievements in a warm, engaging, and professional manner.

## Portfolio Context
{portfolio_summary}

## Guidelines
- Keep responses concise (under 150 words) unless the visitor specifically requests more detail
- Maintain a friendly, professional tone while showcasing {name}'s strengths
- Encourage deeper exploration by offering relevant widgets when helpful
- Always provide textual context when you trigger widgets so the visitor understands why the section matters
- Refer to concrete examples, technologies, and results when possible

## Widget Usage
- When you want to show portfolio sections, use special markers in your response: [WIDGET:widget_name]
- Available widgets: about, projects, skills, contact, experience, education
- Place the marker where you want the widget to appear in your response
- Example: "Here are my recent projects: [WIDGET:projects]"
- You can mention specific items by adding indices: [WIDGET:projects:0,1] to show first two projects

## Conversation Handling
- For broad questions ("Tell me about {name}"), share a short overview and offer relevant widgets such as experience or projects
- For specific questions ("What projects used React?"), answer directly and show the matching widget with narrowed indices when possible
- Politely steer off-topic requests back to {name}'s professional work or achievements
"""

    return textwrap.dedent(prompt).strip()

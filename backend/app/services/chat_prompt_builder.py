"""
Build system prompts for AI chat service.

Constructs comprehensive prompts from portfolio data for context-aware conversations.
"""

import textwrap
from typing import Optional, List

from ..schemas.portfolio import (
    PortfolioData,
    PersonalInfo,
    WorkExperience,
    Project,
    Education,
    Certification,
    DateInfo,
    Profile,
)
from ..constants.chat_delimiters import ChatDelimiters


def _format_range(
    start: Optional[DateInfo], end: Optional[DateInfo], is_current: Optional[bool]
) -> str:
    """Return a formatted date range string for experience/education entries."""

    def _date_str(d: Optional[DateInfo]) -> str:
        if not d:
            return ""
        if d.year and d.month:
            return f"{d.month}/{d.year}"
        if d.year:
            return str(d.year)
        return ""

    start_str = _date_str(start)
    if is_current:
        return f"{start_str} – Present"
    end_str = _date_str(end)
    if start_str and end_str:
        return f"{start_str} – {end_str}"
    return start_str or end_str or "Dates not specified"


def _profile_line(profile: Profile) -> Optional[str]:
    """Format a single social profile link."""
    label = profile.label or (profile.type.value if profile.type else "Profile")
    return f"{label}: {profile.url}" if profile.url else None


def _personal_info_section(info: Optional[PersonalInfo]) -> Optional[str]:
    """Build personal info section for system prompt."""
    if not info:
        return None

    lines: List[str] = []
    if info.full_name:
        lines.append(f"Name: {info.full_name}")
    if info.headline:
        lines.append(f"Headline: {info.headline}")
    if info.email:
        lines.append(f"Email: {info.email}")
    if info.phone:
        lines.append(f"Phone: {info.phone}")
    if info.location:
        lines.append(f"Location: {info.location}")

    if info.summary:
        lines.append(f"Summary: {info.summary}")

    profile_lines: List[str] = []
    for profile in info.profiles or []:
        profile_line = _profile_line(profile)
        if profile_line:
            profile_lines.append(profile_line)

    if profile_lines:
        lines.append("Profiles:")
        lines.extend(f"  - {p}" for p in profile_lines)

    return "\n".join(lines) if lines else None


def _work_experience_section(
    experiences: Optional[List[WorkExperience]],
) -> Optional[str]:
    if not experiences:
        return None

    lines: List[str] = []
    for i, exp in enumerate(experiences, start=1):
        lines.append(f"{i}. {exp.title or 'Role not specified'}")

        if exp.organization:
            headline_parts = [exp.organization]
            if exp.location:
                headline_parts.append(exp.location)
            lines.append(" ".join(headline_parts))

        lines.append(
            f"Duration: {_format_range(exp.start_date, exp.end_date, exp.is_current)}"
        )

        if exp.location:
            lines.append(f"Location: {exp.location}")

        if exp.technologies:
            lines.append(f"Technologies: {', '.join(exp.technologies)}")

        if exp.more_context:
            lines.append(f"Description: {exp.more_context}")

        if exp.highlights:
            lines.append("Highlights:")
            for highlight in exp.highlights:
                lines.append(f"  - {highlight}")

        lines.append("")

    return "\n".join(lines).strip() if lines else None


def _projects_section(projects: Optional[List[Project]]) -> Optional[str]:
    if not projects:
        return None

    lines: List[str] = []
    for i, proj in enumerate(projects, start=1):
        lines.append(f"{i}. {proj.name or 'Project name not specified'}")

        if proj.role:
            lines.append(f"Role: {proj.role}")

        if proj.more_context:
            lines.append(f"Description: {proj.more_context}")

        if proj.technologies:
            lines.append(f"Technologies: {', '.join(proj.technologies)}")

        if proj.highlights:
            lines.append("Highlights:")
            for highlight in proj.highlights:
                lines.append(f"  - {highlight}")

        if proj.github:
            lines.append(f"GitHub: {proj.github}")
        if proj.live_link:
            lines.append(f"Live Link: {proj.live_link}")

        lines.append("")

    return "\n".join(lines).strip() if lines else None


def _education_section(education: Optional[List[Education]]) -> Optional[str]:
    if not education:
        return None

    lines: List[str] = []
    for i, edu in enumerate(education, start=1):
        lines.append(f"{i}. Education Entry")
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
        lines.append("")

    return "\n".join(lines).strip() if lines else None


def _certifications_section(
    certifications: Optional[List[Certification]],
) -> Optional[str]:
    if not certifications:
        return None

    lines: List[str] = []
    for i, cert in enumerate(certifications, start=1):
        lines.append(f"{i}. {cert.name or 'Certification not specified'}")
        if cert.link:
            lines.append(f"Link: {cert.link}")
        lines.append("")

    return "\n".join(lines).strip() if lines else None


def build_system_prompt(portfolio_data: PortfolioData) -> str:
    """
    Build a comprehensive system prompt from portfolio data.

    Args:
        portfolio_data: Structured portfolio data

    Returns:
        System prompt string with portfolio context
    """
    name = (
        portfolio_data.personal_info.full_name
        if portfolio_data.personal_info and portfolio_data.personal_info.full_name
        else "the portfolio owner"
    )

    sections: List[str] = []

    # Personal info
    personal_section = _personal_info_section(portfolio_data.personal_info)
    if personal_section:
        sections.append(f"# Personal Information\n{personal_section}")

    # Work experience
    experience_section = _work_experience_section(portfolio_data.work_experiences)
    if experience_section:
        sections.append(f"# Work Experience\n{experience_section}")

    # Projects
    projects_section = _projects_section(portfolio_data.projects)
    if projects_section:
        sections.append(f"# Projects\n{projects_section}")

    # Education
    education_section = _education_section(portfolio_data.education)
    if education_section:
        sections.append(f"# Education\n{education_section}")

    # Certifications
    certifications_section = _certifications_section(portfolio_data.certifications)
    if certifications_section:
        sections.append(f"# Certifications\n{certifications_section}")

    # Text blobs
    if portfolio_data.text_blobs:
        if portfolio_data.text_blobs.achievements:
            sections.append(f"# Achievements\n{portfolio_data.text_blobs.achievements}")
        if portfolio_data.text_blobs.additional_context:
            sections.append(
                f"# Additional Information\n{portfolio_data.text_blobs.additional_context}"
            )

    portfolio_context = "\n\n".join(sections)

    # Generate example widget commands using constants
    widget_examples = [
        f"- `{ChatDelimiters.WIDGET_ABOUT}` - Show about/personal info section",
        f"- `{ChatDelimiters.WIDGET_PROJECTS}` - Show all projects",
        f"- `{ChatDelimiters.get_widget_delimiter('projects', [0, 1])}` - Show specific projects by index (0-based)",
        f"- `{ChatDelimiters.WIDGET_SKILLS}` - Show skills",
        f"- `{ChatDelimiters.WIDGET_CONTACT}` - Show contact information",
        f"- `{ChatDelimiters.WIDGET_EXPERIENCE}` - Show work experience",
        f"- `{ChatDelimiters.WIDGET_EDUCATION}` - Show education",
        f"- `{ChatDelimiters.MSG_BREAK}` - Split into separate message bubbles",
    ]
    widget_commands = "\n".join(widget_examples)

    prompt = f"""
You are an AI assistant representing {name}'s professional portfolio. Your role is to help visitors learn about {name}'s work, skills, and experience through natural conversation.

# Portfolio Context
{portfolio_context}

# Response Guidelines
- Be CONCISE and answer ONLY what is asked
- Keep responses SHORT and EASY TO READ
- Use simple, clear language
- Maintain a friendly, professional tone
- Refer to concrete examples and technologies when relevant

# Widget Commands
Use special commands to show portfolio sections or split messages:
{widget_commands}

# Widget Placement Rules
- ALWAYS place widget commands at the END of your text, never inline
- Each widget appears as a separate visual component below your text
- Add a brief intro before the widget command
- Example: "Here are my recent projects:\n{ChatDelimiters.WIDGET_PROJECTS}"

# Message Splitting
- Use `{ChatDelimiters.MSG_BREAK}` to split longer responses into digestible parts
- Example: "I have 5 years of experience.\n{ChatDelimiters.MSG_BREAK}\nMy latest project was..."
- This creates two separate chat bubbles for better readability

# Conversation Handling
- For broad questions ("Tell me about {name}"), give a SHORT overview and use widgets
- For specific questions ("What projects used React?"), answer directly and concisely
- Politely redirect off-topic questions back to {name}'s professional work
"""

    return textwrap.dedent(prompt).strip()

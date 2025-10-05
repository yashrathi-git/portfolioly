"""
Chat delimiter constants for SSE streaming with widget rendering.

These delimiters are used to signal special actions during chat streaming:
- Widget rendering triggers
- Message bubble breaks
- etc.

The delimiters are designed to be:
1. Unlikely to appear in natural conversation
2. Easy to parse with regex
3. Self-documenting
"""

from typing import Literal


class ChatDelimiters:
    """Delimiter constants for chat streaming."""

    # Widget rendering delimiters
    WIDGET_ABOUT = "<<<WIDGET:about>>>"
    WIDGET_PROJECTS = "<<<WIDGET:projects>>>"
    WIDGET_PROJECTS_INDEXED = (
        "<<<WIDGET:projects:{indices}>>>"  # Template with {indices} placeholder
    )
    WIDGET_SKILLS = "<<<WIDGET:skills>>>"
    WIDGET_CONTACT = "<<<WIDGET:contact>>>"
    WIDGET_EXPERIENCE = "<<<WIDGET:experience>>>"
    WIDGET_EDUCATION = "<<<WIDGET:education>>>"

    # Message control delimiters
    MSG_BREAK = "<<<MSG_BREAK>>>"

    # SSE event types
    EVENT_CONTENT = "content"  # Text chunk
    EVENT_CMD = "cmd"  # Command delimiter
    EVENT_DONE = "done"  # Stream complete
    EVENT_ERROR = "error"  # Error occurred

    # Widget types (for validation)
    SUPPORTED_WIDGETS = [
        "about",
        "projects",
        "skills",
        "contact",
        "experience",
        "education",
    ]

    @staticmethod
    def get_widget_delimiter(widget: str, indices: list[int] | None = None) -> str:
        """
        Get the delimiter string for a widget.

        Args:
            widget: Widget name (e.g., "projects", "about")
            indices: Optional list of indices for the widget (e.g., [0, 1, 2])

        Returns:
            Formatted delimiter string

        Examples:
            get_widget_delimiter("about") -> "<<<WIDGET:about>>>"
            get_widget_delimiter("projects", [0, 1]) -> "<<<WIDGET:projects:0,1>>>"
        """
        if indices:
            indices_str = ",".join(map(str, indices))
            return f"<<<WIDGET:{widget}:{indices_str}>>>"
        return f"<<<WIDGET:{widget}>>>"

    @staticmethod
    def get_all_delimiter_patterns() -> list[str]:
        """
        Get all possible delimiter patterns for documentation.

        Returns:
            List of delimiter pattern strings
        """
        return [
            ChatDelimiters.WIDGET_ABOUT,
            ChatDelimiters.WIDGET_PROJECTS,
            "<<<WIDGET:projects:0,1>>>",  # Example with indices
            ChatDelimiters.WIDGET_SKILLS,
            ChatDelimiters.WIDGET_CONTACT,
            ChatDelimiters.WIDGET_EXPERIENCE,
            ChatDelimiters.WIDGET_EDUCATION,
            ChatDelimiters.MSG_BREAK,
        ]

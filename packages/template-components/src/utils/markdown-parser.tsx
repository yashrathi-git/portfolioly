/**
 * Simple markdown parser for basic formatting
 * Supports: bullet lists, bold, italic, links
 */

export function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split("\n").filter((line) => line.trim());
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim();

    // Check if it's a bullet point
    if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      const content = trimmedLine.substring(2).trim();
      elements.push(
        <li
          key={idx}
          className="flex gap-3 text-sm text-muted-foreground leading-relaxed"
        >
          <span className="flex-shrink-0 mt-[0.4rem] h-1 w-1 rounded-full bg-foreground/60" />
          <span className="flex-1">{parseInlineMarkdown(content)}</span>
        </li>
      );
    } else if (trimmedLine) {
      // Regular paragraph
      elements.push(
        <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
          {parseInlineMarkdown(trimmedLine)}
        </p>
      );
    }
  });

  return elements;
}

function parseInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let key = 0;

  // Parse bold **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong
        key={`bold-${key++}`}
        className="font-semibold text-foreground/90"
      >
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Render markdown content with proper list/paragraph structure
 */
export function MarkdownContent({ content }: { content: string | string[] }) {
  if (!content) return null;

  // If content is already an array of strings, treat each as a bullet point
  if (Array.isArray(content)) {
    return (
      <ul className="space-y-2">
        {content.map((item, idx) => (
          <li
            key={idx}
            className="flex gap-3 text-sm text-muted-foreground leading-relaxed"
          >
            <span className="flex-shrink-0 mt-[0.4rem] h-1 w-1 rounded-full bg-foreground/60" />
            <span className="flex-1">{parseInlineMarkdown(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Parse string content as markdown
  const elements = parseMarkdown(content);

  // Check if all elements are list items
  const allListItems = elements.every(
    (el) => el && typeof el === "object" && "type" in el && el.type === "li"
  );

  if (allListItems) {
    return <ul className="space-y-2">{elements}</ul>;
  }

  return <div className="space-y-2">{elements}</div>;
}

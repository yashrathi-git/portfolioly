/**
 * Utility for parsing message content to extract widget delimiters and message breaks.
 *
 * Parses messages that contain:
 * - Widget delimiters: <<<WIDGET:projects>>> or <<<WIDGET:projects:0,1>>>
 * - Message breaks: <<<MSG_BREAK>>>
 *
 * Returns an array of message segments, each containing content parts for rendering.
 */

export type ParsedMessagePart =
  | { type: "text"; content: string }
  | { type: "widget"; widget: string; indices?: number[] };

export type MessageSegment = {
  parts: ParsedMessagePart[];
};

/**
 * Parse a single segment (between MSG_BREAKs) to extract text and widget parts.
 */
function parseSegment(content: string): ParsedMessagePart[] {
  // Pattern matches: <<<WIDGET:name>>> or <<<WIDGET:name:0,1>>>
  const pattern = /<<<WIDGET:(\w+)(?::([0-9,]+))?>>>/g;
  const parts: ParsedMessagePart[] = [];
  let lastIndex = 0;

  // Find all widget delimiters in the content
  for (const match of content.matchAll(pattern)) {
    // Add text before widget (if any)
    if (match.index !== undefined && match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index);
      if (textContent) {
        parts.push({
          type: "text",
          content: textContent,
        });
      }
    }

    // Add widget part
    const widget = match[1];
    const indicesStr = match[2];
    const indices = indicesStr
      ? indicesStr
          .split(",")
          .map((i) => parseInt(i.trim(), 10))
          .filter((n) => !isNaN(n))
      : undefined;

    parts.push({
      type: "widget",
      widget,
      indices,
    });

    // Update last index to after this match
    if (match.index !== undefined) {
      lastIndex = match.index + match[0].length;
    }
  }

  // Add remaining text after last widget (if any)
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex);
    if (textContent) {
      parts.push({
        type: "text",
        content: textContent,
      });
    }
  }

  return parts;
}

/**
 * Parse message content to extract text and widget parts.
 * For backward compatibility, returns parts from the first segment only.
 *
 * @param content - Raw message content with potential widget delimiters
 * @returns Array of parsed parts (text or widget)
 *
 * @example
 * parseMessageContent("Hello! <<<WIDGET:projects>>> More text")
 * // Returns:
 * // [
 * //   { type: 'text', content: 'Hello! ' },
 * //   { type: 'widget', widget: 'projects' },
 * //   { type: 'text', content: ' More text' }
 * // ]
 */
export function parseMessageContent(content: string): ParsedMessagePart[] {
  const segments = parseMessageSegments(content);
  return segments.length > 0 ? segments[0].parts : [];
}

/**
 * Parse message content into segments split by MSG_BREAK delimiters.
 *
 * @param content - Raw message content with potential MSG_BREAK and widget delimiters
 * @returns Array of message segments
 *
 * @example
 * parseMessageSegments("Hi! <<<MSG_BREAK>>> How are you?")
 * // Returns:
 * // [
 * //   { parts: [{ type: 'text', content: 'Hi! ' }] },
 * //   { parts: [{ type: 'text', content: ' How are you?' }] }
 * // ]
 */
export function parseMessageSegments(content: string): MessageSegment[] {
  // Split by MSG_BREAK delimiter
  const segments = content.split("<<<MSG_BREAK>>>");

  return segments
    .map((segment) => ({
      parts: parseSegment(segment),
    }))
    .filter((segment) => segment.parts.length > 0); // Filter out empty segments
}

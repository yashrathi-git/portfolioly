export type ToolCall = {
  type: "widget_render";
  widget:
    | "about"
    | "projects"
    | "skills"
    | "contact"
    | "experience"
    | "education";
  indices?: number[]; // Optional: filter to specific items (zero-based)
  explanation?: string; // Optional: text to show alongside widget
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  // Optional: tool calls from AI backend for rendering multiple widgets
  toolCalls?: ToolCall[];
};

export type Suggestion = {
  id: string;
  label: string;
  icon: string; // icon name, mapped to Lucide components inside client components
  color?: string; // tailwind okLCH or hex via arbitrary value
};

export type ChatProfile = {
  name?: string;
  badge?: string;
  avatarUrl?: string;
  links?: { type: "github" | "mail" | "link"; href: string }[];
};

// API request/response types for chat endpoint
export type ChatRequest = {
  message: string;
  conversation_id?: string;
};

export type ChatResponse = {
  content: string; // Text response from LLM
  tool_calls?: ToolCall[];
  conversation_id: string;
};

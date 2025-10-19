export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string; // Raw content including <<<WIDGET:...>>> delimiters
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
  content: string; // Text response from LLM including widget delimiters
  conversation_id: string;
};

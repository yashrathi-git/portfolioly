export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type Suggestion = {
  id: string;
  label: string;
  icon: string; // icon name, mapped to Lucide components inside client components
  color?: string; // tailwind okLCH or hex via arbitrary value
};

export type Profile = {
  name: string;
  badge?: string;
  links?: { type: "github" | "mail" | "link"; href: string }[];
};
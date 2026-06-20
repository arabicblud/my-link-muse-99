export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  button_style: string;
};

export type LinkRow = {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  icon: string | null;
  position: number;
  is_visible: boolean;
};

export const FONT_OPTIONS = [
  { value: "mono", label: "Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
  { value: "sans", label: "Sans", css: "'Inter', ui-sans-serif, system-ui" },
  { value: "serif", label: "Serif", css: "Georgia, 'Times New Roman', serif" },
];

export const BUTTON_STYLES = [
  { value: "outline", label: "Outline" },
  { value: "filled", label: "Filled" },
  { value: "ghost", label: "Ghost" },
  { value: "underline", label: "Underline" },
];

export const THEME_PRESETS = [
  { value: "mono-dark", label: "Mono Dark", bg: "#0a0a0a", text: "#fafafa", accent: "#ffffff" },
  { value: "mono-light", label: "Mono Light", bg: "#fafafa", text: "#0a0a0a", accent: "#0a0a0a" },
  { value: "paper", label: "Paper", bg: "#f5f1e8", text: "#1a1a1a", accent: "#1a1a1a" },
  { value: "ink", label: "Ink", bg: "#111418", text: "#e8e8e8", accent: "#9ae6b4" },
  { value: "blood", label: "Blood", bg: "#0a0000", text: "#fee", accent: "#ef4444" },
];
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
  is_premium: boolean;
  background_image_url: string | null;
  background_effect: string;
  audio_url: string | null;
  cursor_url: string | null;
  page_title: string | null;
  page_description: string | null;
  tagline: string | null;
  typewriter_enabled: boolean;
  show_views: boolean;
  view_count: number;
  card_opacity: number;
  card_blur: number;
  icon_glow_color: string | null;
  entrance_animation: string;
  card_enabled: boolean;
  card_tilt: boolean;
  location: string | null;
  premium_expires_at: string | null;
};

export type ProfileExtras = {
  aliases: string | null;
  banner_url: string | null;
  discord_id: string | null;
  username_effect: string;
  name_gradient: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tab_icon_url: string | null;
  cursor_effect: string;
  force_tag_color: string | null;
  hide_views: boolean;
  freeze_video_last_frame: boolean;
  card_width: number;
  button_theme: string;
  button_layout: string;
  music_autoplay: boolean;
  music_volume: number;
  uid: string | null;
  banned_at: string | null;
};

export type FullProfile = Profile & ProfileExtras;

export type LinkRow = {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  icon: string | null;
  position: number;
  is_visible: boolean;
};

export type Tag = {
  id: string;
  slug: string;
  name: string;
  color: string;
  icon: string | null;
  description: string | null;
  icon_url?: string | null;
};

export type ProfileTag = {
  profile_id: string;
  tag_id: string;
  hidden: boolean;
  tag?: Tag;
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

export const BACKGROUND_EFFECTS = [
  { value: "none", label: "None" },
  { value: "snow", label: "Snow" },
  { value: "rain", label: "Rain" },
  { value: "particles", label: "Particles" },
  { value: "confetti", label: "Confetti" },
];

export const ENTRANCE_ANIMATIONS = [
  { value: "fade", label: "Fade" },
  { value: "slide-up", label: "Slide up" },
  { value: "zoom", label: "Zoom" },
  { value: "none", label: "None" },
];

export const USERNAME_EFFECTS = [
  { value: "none", label: "None" },
  { value: "glow", label: "Glow" },
  { value: "rainbow", label: "Rainbow" },
  { value: "glitch", label: "Glitch" },
];

export const CURSOR_EFFECTS = [
  { value: "none", label: "None" },
  { value: "trail", label: "Trail" },
  { value: "sparkle", label: "Sparkle" },
];

export const BUTTON_THEMES = [
  { value: "default", label: "Default" },
  { value: "soft", label: "Soft" },
  { value: "neon", label: "Neon" },
  { value: "glass", label: "Glass" },
  { value: "sharp", label: "Sharp" },
];

export const BUTTON_LAYOUTS = [
  { value: "stack", label: "Stack" },
  { value: "grid-2", label: "2-col grid" },
  { value: "pill", label: "Pill row" },
];
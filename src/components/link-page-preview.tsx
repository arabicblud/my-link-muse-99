import { useEffect, useRef, useState } from "react";
import { FONT_OPTIONS } from "@/lib/link-page";
import type { Profile, LinkRow } from "@/lib/link-page";
import { Volume2, VolumeX } from "lucide-react";

export function LinkPagePreview({
  profile,
  links,
  onLinkClick,
}: {
  profile: Profile;
  links: LinkRow[];
  onLinkClick?: (id: string) => void;
}) {
  const font = FONT_OPTIONS.find((f) => f.value === profile.font_family) ?? FONT_OPTIONS[0];

  function buttonClass() {
    switch (profile.button_style) {
      case "filled":
        return "border bg-current/10";
      case "ghost":
        return "border border-transparent hover:bg-current/10";
      case "underline":
        return "border-b border-current/40 rounded-none";
      default:
        return "border border-current/40 hover:border-current";
    }
  }

  const animClass =
    profile.entrance_animation === "slide-up"
      ? "animate-[linq-slide-up_.6s_ease-out_both]"
      : profile.entrance_animation === "zoom"
      ? "animate-[linq-zoom_.5s_ease-out_both]"
      : profile.entrance_animation === "none"
      ? ""
      : "animate-[linq-fade_.5s_ease-out_both]";

  const cardStyle: React.CSSProperties = {
    color: profile.text_color,
    backgroundColor:
      profile.card_opacity < 100
        ? hexWithAlpha(profile.background_color, profile.card_opacity / 100)
        : undefined,
    backdropFilter: profile.card_blur > 0 ? `blur(${profile.card_blur}px)` : undefined,
  };

  const cursorStyle = profile.cursor_url ? { cursor: `url(${profile.cursor_url}), auto` } : {};

  return (
    <div
      className="relative min-h-full w-full overflow-hidden"
      style={{
        background: profile.background_color,
        color: profile.text_color,
        fontFamily: font.css,
        backgroundImage: profile.background_image_url ? `url(${profile.background_image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...cursorStyle,
      }}
    >
      <BackgroundEffect type={profile.background_effect} color={profile.accent_color} />
      {profile.audio_url && <AudioPlayer src={profile.audio_url} />}

      <div className={`relative z-10 mx-auto flex max-w-md flex-col items-center px-6 py-16 ${animClass}`}>
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border"
          style={{
            borderColor: profile.accent_color + "55",
            boxShadow: profile.icon_glow_color
              ? `0 0 24px ${profile.icon_glow_color}`
              : undefined,
          }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold opacity-60">
              {(profile.display_name || profile.username).slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          {profile.display_name || profile.username}
        </h1>
        <p className="mt-1 text-sm opacity-60">@{profile.username}</p>
        {profile.tagline && (
          <p className="mt-2 text-sm italic opacity-70">
            {profile.typewriter_enabled ? <Typewriter text={profile.tagline} /> : profile.tagline}
          </p>
        )}
        {profile.bio && (
          <p className="mt-4 max-w-xs text-center text-sm opacity-80 whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        <div className="mt-10 w-full space-y-3">
          {links.length === 0 && (
            <p className="text-center text-sm opacity-40">No links yet.</p>
          )}
          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onLinkClick?.(l.id)}
              className={`block rounded-md px-4 py-3.5 text-center text-sm font-medium transition active:scale-[.98] ${buttonClass()}`}
              style={cardStyle}
            >
              {l.title}
            </a>
          ))}
        </div>

        {profile.show_views && (
          <p className="mt-10 font-mono text-xs opacity-40">
            {profile.view_count.toLocaleString()} views
          </p>
        )}
        {profile.is_premium && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest opacity-50">
            ★ premium
          </p>
        )}

        <div className="mt-16 text-xs opacity-30">
          <a href="/" className="hover:opacity-60">linq.site.je</a>
        </div>
      </div>
    </div>
  );
}

function hexWithAlpha(hex: string, alpha: number) {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `#${m}${a}`;
}

function Typewriter({ text }: { text: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    const id = setInterval(() => setI((v) => (v >= text.length ? 0 : v + 1)), 90);
    return () => clearInterval(id);
  }, [text]);
  return <span>{text.slice(0, i)}<span className="animate-pulse">|</span></span>;
}

function AudioPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play().catch(() => {});
    setPlaying(!playing);
  }
  return (
    <>
      <audio ref={ref} src={src} loop />
      <button
        onClick={toggle}
        className="absolute right-4 top-4 z-20 rounded-full border border-current/30 bg-black/30 p-2 backdrop-blur hover:bg-black/50"
        aria-label={playing ? "Pause music" : "Play music"}
      >
        {playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </>
  );
}

function BackgroundEffect({ type, color }: { type: string; color: string }) {
  if (type === "none" || !type) return null;
  const count = type === "confetti" ? 40 : 60;
  const items = Array.from({ length: count });
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {items.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 6;
        const dur = 4 + Math.random() * 6;
        const size = type === "rain" ? 1 : type === "snow" ? 4 + Math.random() * 4 : 3 + Math.random() * 3;
        const opacity = 0.3 + Math.random() * 0.5;
        const bg = type === "particles" || type === "confetti" ? color : type === "rain" ? "#9ecbff" : "#ffffff";
        const shape = type === "confetti" ? "2px" : "9999px";
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: "-10%",
              left: `${left}%`,
              width: type === "rain" ? 1 : size,
              height: type === "rain" ? 14 : size,
              background: bg,
              opacity,
              borderRadius: shape,
              animation: `linq-fall ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { FONT_OPTIONS } from "@/lib/link-page";
import type { FullProfile, LinkRow, Tag } from "@/lib/link-page";
import { Volume2, VolumeX, BadgeCheck } from "lucide-react";

export function LinkPagePreview({
  profile,
  links,
  tags = [],
  onLinkClick,
}: {
  profile: FullProfile;
  links: LinkRow[];
  tags?: Tag[];
  onLinkClick?: (id: string) => void;
}) {
  const font = FONT_OPTIONS.find((f) => f.value === profile.font_family) ?? FONT_OPTIONS[0];

  function buttonClass() {
    const theme = profile.button_theme || "default";
    const base =
      profile.button_style === "filled"
        ? "border bg-current/10"
        : profile.button_style === "ghost"
        ? "border border-transparent hover:bg-current/10"
        : profile.button_style === "underline"
        ? "border-b border-current/40 rounded-none"
        : "border border-current/40 hover:border-current";
    const themed =
      theme === "soft" ? " rounded-2xl"
      : theme === "neon" ? " shadow-[0_0_18px_currentColor] rounded-md"
      : theme === "glass" ? " backdrop-blur-md bg-white/5 rounded-xl"
      : theme === "sharp" ? " rounded-none"
      : "";
    return base + themed;
  }

  const animClass =
    !profile.is_premium ? ""
    : profile.entrance_animation === "slide-up"
      ? "animate-[linq-slide-up_.6s_ease-out_both]"
      : profile.entrance_animation === "zoom"
      ? "animate-[linq-zoom_.5s_ease-out_both]"
      : profile.entrance_animation === "none"
      ? ""
      : "animate-[linq-fade_.5s_ease-out_both]";

  const cardStyle: React.CSSProperties = { color: profile.text_color };
  // When a custom cursor image is set OR a cursor effect is active, we hide the
  // native cursor everywhere on the page and render the cursor ourselves so it
  // can be styled and tracked freely.
  // Only hide the native cursor when a custom cursor IMAGE is set. Trail/sparkle
  // effects render alongside the normal cursor.
  const hideNativeCursor = !!profile.cursor_url;
  const cursorStyle: React.CSSProperties = hideNativeCursor ? { cursor: "none" } : {};

  const isVideoBg = !!profile.background_image_url && /\.(mp4|webm|mov)(\?|$)/i.test(profile.background_image_url);
  const verifiedTag = tags.find((t) => t.slug === "verified");
  const otherTags = tags.filter((t) => t.slug !== "verified");
  const layoutCls =
    profile.button_layout === "grid-2" ? "grid grid-cols-2 gap-3"
    : profile.button_layout === "pill" ? "flex flex-wrap gap-2 justify-center"
    : "flex flex-col gap-3";
  const cardWidth = profile.card_enabled && profile.card_width
    ? Math.max(20, Math.min(56, profile.card_width)) : 28;
  // (name styling moved into <NameDisplay/>)

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      style={{
        background: profile.background_color,
        color: profile.text_color,
        fontFamily: font.css,
        backgroundImage: profile.background_image_url && !isVideoBg ? `url(${profile.background_image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...cursorStyle,
      }}
    >
      {isVideoBg && (
        <VideoBackground src={profile.background_image_url!} freeze={profile.freeze_video_last_frame && profile.is_premium} />
      )}
      <BackgroundEffect type={profile.background_effect} color={profile.accent_color} />
      {profile.cursor_url && <CustomCursorImage src={profile.cursor_url} />}
      {profile.audio_url && (
        <AudioPlayer src={profile.audio_url} autoplay={profile.music_autoplay !== false} volume={profile.music_volume ?? 60} />
      )}
      {profile.cursor_effect && profile.cursor_effect !== "none" && profile.is_premium && (
        <CursorEffect kind={profile.cursor_effect} color={profile.accent_color} />
      )}

      <ProfileCard
        enabled={profile.card_enabled}
        tilt={profile.card_tilt && profile.is_premium}
        accent={profile.accent_color}
        textColor={profile.text_color}
        cardOpacity={profile.card_opacity}
        cardBlur={profile.card_blur}
        bgColor={profile.background_color}
        widthRem={cardWidth}
        className={animClass}
      >
        {profile.card_enabled && profile.banner_url && profile.is_premium && (
          <div
            className="absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.banner_url})` }}
          />
        )}
        <div
          className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border"
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

        <NameDisplay
          text={profile.display_name || profile.username}
          gradient={profile.name_gradient}
          effect={profile.is_premium ? profile.username_effect : ""}
        />
        <p className="mt-1 flex items-center gap-1 text-sm opacity-60">
          @{profile.username}
          {verifiedTag && (
            <BadgeCheck className="h-4 w-4" style={{ color: verifiedTag.color }} aria-label="Verified" />
          )}
        </p>
        {profile.aliases && (
          <p className="mt-0.5 font-mono text-[11px] opacity-50">aka: {profile.aliases}</p>
        )}

        {otherTags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {otherTags.map((t) => {
              const c = (profile.force_tag_color && profile.is_premium) ? profile.force_tag_color : t.color;
              return (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: c, borderColor: c + "55", backgroundColor: c + "11" }}
                  title={t.description ?? undefined}
                >
                  {t.icon_url && <img src={t.icon_url} alt="" className="h-3 w-3" />}
                  {t.name}
                </span>
              );
            })}
          </div>
        )}

        {profile.tagline && (
          <p className="mt-2 text-sm italic opacity-70">
            {profile.typewriter_enabled && profile.is_premium ? <Typewriter text={profile.tagline} /> : profile.tagline}
          </p>
        )}
        {profile.location && (
          <p className="mt-1 font-mono text-xs opacity-60">📍 {profile.location}</p>
        )}
        {profile.bio && (
          <p className="mt-4 max-w-xs text-center text-sm opacity-80 whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        <div className={`mt-10 w-full ${layoutCls}`}>
          {links.length === 0 && (
            <p className="col-span-full text-center text-sm opacity-40">No links yet.</p>
          )}
          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onLinkClick?.(l.id)}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-3.5 text-center text-sm font-medium transition active:scale-[.98] ${buttonClass()}`}
              style={cardStyle}
            >
              {l.icon && (
                /^https?:\/\//.test(l.icon)
                  ? <img src={l.icon} alt="" className="h-4 w-4" />
                  : <span aria-hidden>{l.icon}</span>
              )}
              {l.title}
            </a>
          ))}
        </div>

        {profile.show_views && !profile.hide_views && (
          <p className="mt-10 font-mono text-xs opacity-40">
            {profile.view_count.toLocaleString()} views
          </p>
        )}
      </ProfileCard>
    </div>
  );
}

function ProfileCard({
  enabled,
  tilt,
  accent,
  textColor,
  cardOpacity,
  cardBlur,
  bgColor,
  widthRem,
  className,
  children,
}: {
  enabled: boolean;
  tilt: boolean;
  accent: string;
  textColor: string;
  cardOpacity: number;
  cardBlur: number;
  bgColor: string;
  widthRem: number;
  className: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tilt) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    function onMove(e: MouseEvent) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const node = ref.current;
        if (!node) return;
        const r = node.getBoundingClientRect();
        // Track across a comfortable area around the card (1.5x its size).
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * 0.75)));
        const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * 0.75)));
        const max = 22;
        node.style.transform = `rotateY(${nx * max}deg) rotateX(${-ny * max}deg) translateZ(0)`;
      });
    }
    function onLeave() {
      const node = ref.current;
      if (node) node.style.transform = "rotateY(0deg) rotateX(0deg)";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tilt]);

  return (
    <div style={{ perspective: tilt ? "1200px" : undefined }}>
    <div
      ref={ref}
      style={{
        transition: tilt ? "transform .15s ease-out" : undefined,
        transformStyle: "preserve-3d",
        willChange: tilt ? "transform" : undefined,
        width: `${widthRem}rem`,
        maxWidth: "92vw",
        ...(enabled
          ? {
              backgroundColor: hexWithAlpha(bgColor, Math.min(0.85, cardOpacity / 100 + 0.3)),
              backdropFilter: cardBlur > 0 ? `blur(${cardBlur}px)` : "blur(8px)",
              border: `1px solid ${accent}33`,
              boxShadow: `0 30px 80px -20px ${accent}22, 0 0 0 1px ${accent}15 inset`,
              borderRadius: 16,
              color: textColor,
            }
          : {}),
      }}
      className={`relative z-10 flex flex-col items-center px-6 py-12 ${className}`}
    >
      {children}
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
  const [display, setDisplay] = useState("");
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    let mode: "type" | "hold" | "delete" | "pause" = "type";
    function tick() {
      if (cancelled) return;
      let delay = 90;
      if (mode === "type") {
        i += 1;
        setDisplay(text.slice(0, i));
        if (i >= text.length) { mode = "hold"; delay = 1500; }
      } else if (mode === "hold") {
        mode = "delete"; delay = 60;
      } else if (mode === "delete") {
        i -= 1;
        setDisplay(text.slice(0, Math.max(0, i)));
        if (i <= 0) { mode = "pause"; delay = 600; }
      } else {
        mode = "type"; delay = 120;
      }
      setTimeout(tick, delay);
    }
    setDisplay("");
    const id = setTimeout(tick, 200);
    return () => { cancelled = true; clearTimeout(id); };
  }, [text]);
  return <span>{display}<span className="animate-pulse">|</span></span>;
}

function AudioPlayer({ src, autoplay, volume }: { src: string; autoplay: boolean; volume: number }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(Math.max(0, Math.min(100, volume ?? 60)));

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = vol / 100;
    a.muted = muted;
  }, [vol, muted]);

  useEffect(() => {
    const a = ref.current;
    if (!a || !autoplay) return;
    a.volume = vol / 100;
    a.play()
      .then(() => setPlaying(true))
      .catch(() => {
        // browser blocked unmuted autoplay — fall back to muted autoplay
        a.muted = true;
        setMuted(true);
        a.play().then(() => setPlaying(true)).catch(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, autoplay]);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.muted = false; setMuted(false); a.play().then(() => setPlaying(true)).catch(() => {}); }
  }
  return (
    <>
      <audio ref={ref} src={src} loop preload="auto" />
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-current/30 bg-black/40 px-2 py-1 backdrop-blur">
        <button onClick={toggle} aria-label={playing && !muted ? "Pause music" : "Play music"} className="hover:opacity-80">
          {playing && !muted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
        <input
          type="range" min={0} max={100} value={vol}
          onChange={(e) => { setVol(+e.target.value); setMuted(+e.target.value === 0); }}
          className="h-1 w-20 cursor-pointer accent-current"
          aria-label="Volume"
        />
      </div>
    </>
  );
}

function VideoBackground({ src, freeze }: { src: string; freeze: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!freeze) return;
    const v = ref.current;
    if (!v) return;
    function onEnd() {
      if (!v) return;
      v.pause();
      v.currentTime = Math.max(0, v.duration - 0.05);
    }
    v.addEventListener("ended", onEnd);
    return () => v.removeEventListener("ended", onEnd);
  }, [freeze]);
  return (
    <video
      ref={ref}
      src={src}
      autoPlay muted loop={!freeze} playsInline
      className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
    />
  );
}

function BackgroundEffect({ type, color }: { type: string; color: string }) {
  if (!type || type === "none") return null;
  const count = type === "rain" ? 90 : type === "particles" ? 35 : type === "confetti" ? 30 : 50;
  const palette = ["#ff5e5b", "#ffd166", "#06d6a0", "#118ab2", "#a78bfa", "#f472b6"];
  const items = Array.from({ length: count });
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {items.map((_, i) => {
        const left = Math.random() * 100;
        const delay = -Math.random() * 12;
        if (type === "snow") {
          const size = 4 + Math.random() * 6;
          const dur = 8 + Math.random() * 8;
          return (
            <span key={i} style={{
              position: "absolute", top: 0, left: `${left}%`,
              width: size, height: size, borderRadius: "9999px",
              background: "white", opacity: 0.7 + Math.random() * 0.3,
              filter: "blur(.3px)",
              animation: `linq-snow ${dur}s linear ${delay}s infinite`,
            }} />
          );
        }
        if (type === "rain") {
          const dur = 0.7 + Math.random() * 0.6;
          return (
            <span key={i} style={{
              position: "absolute", top: 0, left: `${left}%`,
              width: 1, height: 16 + Math.random() * 10,
              background: "linear-gradient(to bottom, transparent, #9ecbff)",
              opacity: 0.5 + Math.random() * 0.4,
              animation: `linq-rain ${dur}s linear ${delay}s infinite`,
            }} />
          );
        }
        if (type === "particles") {
          const size = 3 + Math.random() * 4;
          const dur = 4 + Math.random() * 5;
          const top = Math.random() * 100;
          return (
            <span key={i} style={{
              position: "absolute", top: `${top}%`, left: `${left}%`,
              width: size, height: size, borderRadius: "9999px",
              background: color, boxShadow: `0 0 ${size*3}px ${color}`,
              animation: `linq-particle ${dur}s ease-in-out ${delay}s infinite`,
            }} />
          );
        }
        // confetti
        const c = palette[i % palette.length];
        const dur = 4 + Math.random() * 4;
        const w = 6 + Math.random() * 6;
        return (
          <span key={i} style={{
            position: "absolute", top: 0, left: `${left}%`,
            width: w, height: w * 0.4, background: c, borderRadius: 1,
            opacity: 0.9,
            animation: `linq-confetti ${dur}s linear ${delay}s infinite`,
          }} />
        );
      })}
    </div>
  );
}

function CursorEffect({ kind, color }: { kind: string; color: string }) {
  const palette = ["#ff5e5b", "#ffd166", "#06d6a0", "#118ab2", "#a78bfa", "#f472b6"];
  const [points, setPoints] = useState<{ x: number; y: number; id: number; born: number; c: string }[]>([]);
  useEffect(() => {
    let id = 0;
    const life = kind === "sparkle" ? 900 : kind === "rainbow" ? 1100 : 650;
    function onMove(e: MouseEvent) {
      const c = kind === "rainbow" ? palette[id % palette.length] : color;
      const next = { x: e.clientX, y: e.clientY, id: id++, born: performance.now(), c };
      setPoints((p) => [...p.slice(-40), next]);
      window.setTimeout(() => setPoints((p) => p.filter((x) => x.id !== next.id)), life);
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, color]);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {points.map((p, i) => {
        const age = (i + 1) / points.length; // 0..1, newest = 1
        const size = kind === "sparkle" ? 6 + age * 6 : 4 + age * 8;
        const op = 0.15 + age * 0.7;
        return (
          <span key={p.id} style={{
            position: "absolute", left: p.x - size / 2, top: p.y - size / 2,
            width: size, height: size,
            borderRadius: kind === "sparkle" ? 2 : "9999px",
            background: p.c, opacity: op,
            boxShadow: `0 0 ${size * 2}px ${p.c}`,
            transform: kind === "sparkle" ? `rotate(${(p.id * 23) % 360}deg)` : undefined,
            transition: "opacity .35s ease-out, width .35s ease-out, height .35s ease-out",
          }} />
        );
      })}
    </div>
  );
}

function CustomCursorImage({ src }: { src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    let raf = 0;
    let x = -100, y = -100;
    function onMove(e: MouseEvent) {
      x = e.clientX; y = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const n = ref.current;
        if (n) n.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <img
      ref={ref} src={src} alt=""
      className="pointer-events-none fixed left-0 top-0 z-[70] h-8 w-8 select-none"
      style={{ transform: "translate3d(-100px,-100px,0)" }}
    />
  );
}

function NameDisplay({ text, gradient, effect }: { text: string; gradient: string | null; effect: string }) {
  const hasGradient = !!gradient && gradient.trim().length > 0;
  let gradImage: string | null = null;
  if (hasGradient) {
    const stops = gradient!.split(",").map((s) => s.trim()).filter(Boolean);
    // Repeat the gradient so an animated background-position can scroll smoothly.
    gradImage = `linear-gradient(90deg, ${[...stops, ...stops].join(", ")})`;
  }
  const baseCls = "mt-5 text-xl font-semibold tracking-tight";
  let cls = baseCls;
  if (hasGradient) {
    cls += " " + (effect === "rainbow" ? "linq-grad-rainbow"
      : effect === "glow" ? "linq-grad-glow"
      : effect === "glitch" ? "linq-grad-glitch"
      : "");
  } else {
    cls += " " + (effect === "rainbow" ? "linq-effect-rainbow"
      : effect === "glow" ? "linq-effect-glow"
      : effect === "glitch" ? "linq-effect-glitch"
      : "");
  }
  const style: React.CSSProperties = gradImage
    ? {
        backgroundImage: gradImage,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }
    : {};
  return <h1 className={cls.trim()} style={style}>{text}</h1>;
}
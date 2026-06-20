import { FONT_OPTIONS } from "@/lib/link-page";
import type { Profile, LinkRow } from "@/lib/link-page";

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

  return (
    <div
      className="min-h-full w-full"
      style={{
        background: profile.background_color,
        color: profile.text_color,
        fontFamily: font.css,
      }}
    >
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border"
          style={{ borderColor: profile.accent_color + "55" }}
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
              style={{ color: profile.text_color }}
            >
              {l.title}
            </a>
          ))}
        </div>

        <div className="mt-16 text-xs opacity-30">
          <a href="/" className="hover:opacity-60">linq.lol</a>
        </div>
      </div>
    </div>
  );
}
import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadUserAsset } from "@/lib/storage";
import { toast } from "sonner";

export function AssetUpload({
  userId,
  kind,
  value,
  onChange,
  accept,
  label,
  disabled,
  preview = "image",
}: {
  userId: string;
  kind: string;
  value: string | null;
  onChange: (url: string | null) => void;
  accept: string;
  label: string;
  disabled?: boolean;
  preview?: "image" | "video" | "audio" | "cursor";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File) {
    setBusy(true);
    try {
      const { url } = await uploadUserAsset(userId, kind, file);
      onChange(url);
      toast.success("Uploaded");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative rounded-md border border-dashed border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>{label}</span>
        {value && (
          <button onClick={() => onChange(null)} disabled={disabled} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = "";
        }}
        disabled={disabled || busy}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={disabled || busy}
        className="flex h-24 w-full items-center justify-center overflow-hidden rounded-sm border border-border bg-card hover:border-foreground/50 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : value ? (
          preview === "image" || preview === "cursor" ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : preview === "video" ? (
            <video src={value} className="h-full w-full object-cover" muted />
          ) : (
            <audio src={value} controls className="w-full" />
          )
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase">Upload</span>
          </div>
        )}
      </button>
    </div>
  );
}
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "user-assets";

export type UploadedAsset = { url: string; path: string };

export async function uploadUserAsset(
  userId: string,
  kind: string,
  file: File,
): Promise<UploadedAsset> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: true, contentType: file.type });
  if (upErr) throw upErr;
  // Profile assets are public (a read policy on storage.objects allows anon SELECT
  // on this bucket). Use the unsigned public URL so we don't leak time-bounded
  // signed URLs through the publicly readable profiles table.
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export function isImage(file: File) {
  return file.type.startsWith("image/");
}
export function isVideo(file: File) {
  return file.type.startsWith("video/");
}
export function isAudio(file: File) {
  return file.type.startsWith("audio/");
}
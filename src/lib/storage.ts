import { supabase } from "@/integrations/supabase/client";

const BUCKET = "user-assets";
// 10 years — long-lived signed URL stored in DB. Re-issued on every upload.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

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
  const { data, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr || !data) throw signErr ?? new Error("Could not sign URL");
  return { url: data.signedUrl, path };
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
import { Platform } from "react-native";

import { resolveApiUrl } from "@/lib/api-url";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
]);

function normalizeType(name: string, type: string): string {
  const t = type.toLowerCase();
  if (t === "image/heic" || t === "image/heif" || /\.heic$/i.test(name)) {
    return "image/jpeg";
  }
  if (ALLOWED.has(t)) return t;
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.gif$/i.test(name)) return "image/gif";
  if (/\.mp4$/i.test(name)) return "video/mp4";
  return "image/jpeg";
}

function normalizeName(name: string, type: string): string {
  if (type === "image/jpeg" && !/\.jpe?g$/i.test(name)) {
    const base = name.replace(/\.[^.]+$/, "") || "photo";
    return `${base}.jpg`;
  }
  return name || "photo.jpg";
}

/** React Native multipart — Content-Type header elle verilmemeli. */
function formFile(uri: string, name: string, type: string) {
  return {
    uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
    name,
    type,
  } as unknown as Blob;
}

export async function uploadImage(uri: string, name: string, type: string): Promise<string> {
  const contentType = normalizeType(name, type);
  const filename = normalizeName(name, contentType);
  const presign = await api.media.presign(filename, contentType);
  const token = useAuthStore.getState().accessToken;
  const uploadUrl = resolveApiUrl(presign.uploadUrl);

  if (presign.local) {
    const form = new FormData();
    form.append("file", formFile(uri, filename, contentType));
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error("Dosya yüklenemedi. Tekrar dene.");
    const data = (await res.json()) as { publicUrl: string };
    return resolveApiUrl(data.publicUrl);
  }

  const fileRes = await fetch(uri);
  if (!fileRes.ok) throw new Error("Dosya okunamadı.");
  const blob = await fileRes.blob();

  const res = await fetch(uploadUrl, {
    method: presign.method,
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) throw new Error("Dosya yüklenemedi. Tekrar dene.");

  return resolveApiUrl(presign.publicUrl);
}

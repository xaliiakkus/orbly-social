import type { PresignResponse } from "@orbly/types";
import { Platform } from "react-native";

import { getApiBaseUrl, resolveApiUrl } from "@/lib/api-url";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
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

function formFile(uri: string, name: string, type: string) {
  return {
    uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
    name,
    type,
  } as unknown as Blob;
}

async function uploadViaServer(
  uri: string,
  filename: string,
  contentType: string,
  folder: string,
): Promise<string> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append("file", formFile(uri, filename, contentType));
  const params = new URLSearchParams({ folder, storage: "auto" });
  const res = await fetch(`${getApiBaseUrl()}/v1/media/upload?${params}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error("Dosya yüklenemedi. Tekrar dene.");
  const data = (await res.json()) as { publicUrl: string };
  return resolveApiUrl(data.publicUrl);
}

async function uploadIdrivePut(
  uri: string,
  contentType: string,
  presign: PresignResponse,
): Promise<string> {
  const fileRes = await fetch(uri);
  if (!fileRes.ok) throw new Error("Dosya okunamadı.");
  const blob = await fileRes.blob();
  const res = await fetch(resolveApiUrl(presign.uploadUrl), {
    method: presign.method || "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) throw new Error("iDrive yükleme başarısız");
  if (!presign.publicUrl) throw new Error("iDrive public URL yok");
  return resolveApiUrl(presign.publicUrl);
}

async function uploadPresignFallback(
  uri: string,
  filename: string,
  contentType: string,
  folder: string,
): Promise<string> {
  const presign = await api.media.presign(filename, contentType, folder, "auto");
  if (presign.idrive) {
    return uploadIdrivePut(uri, contentType, presign);
  }
  throw new Error("Presign depolama yok");
}

export async function uploadImage(
  uri: string,
  name: string,
  type: string,
  folder = "media",
): Promise<string> {
  const contentType = normalizeType(name, type);
  const filename = normalizeName(name, contentType);
  try {
    return await uploadViaServer(uri, filename, contentType, folder);
  } catch {
    return uploadPresignFallback(uri, filename, contentType, folder);
  }
}

import type { PresignResponse } from "@orbly/types";

import { getApiBaseUrl, resolveApiUrl } from "@/lib/api-url";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

type RnFormFile = {
  uri: string;
  name: string;
  type: string;
};

function normalizeType(name: string, type: string): string {
  const t = type.toLowerCase();
  if (ALLOWED.has(t)) return t;
  if (/\.heic$/i.test(name)) return "image/heic";
  if (/\.heif$/i.test(name)) return "image/heif";
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.gif$/i.test(name)) return "image/gif";
  if (/\.mp4$/i.test(name)) return "video/mp4";
  return "image/jpeg";
}

function normalizeName(name: string, type: string): string {
  if (type === "image/heic" && !/\.heic$/i.test(name)) {
    const base = name.replace(/\.[^.]+$/, "") || "photo";
    return `${base}.heic`;
  }
  if (type === "image/jpeg" && !/\.jpe?g$/i.test(name)) {
    const base = name.replace(/\.[^.]+$/, "") || "photo";
    return `${base}.jpg`;
  }
  return name || "photo.jpg";
}

function rnFormFile(uri: string, name: string, type: string): RnFormFile {
  return { uri, name, type };
}

async function readUriBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error("Dosya okunamadı.");
  const blob = await res.blob();
  if (blob.size === 0) throw new Error("Boş dosya.");
  return blob;
}

function appendMultipartFile(
  form: FormData,
  field: string,
  uri: string,
  filename: string,
  contentType: string,
) {
  form.append(field, rnFormFile(uri, filename, contentType) as unknown as Blob);
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseCloudinaryError(body: string, status: number): string {
  try {
    const data = JSON.parse(body) as { error?: { message?: string } };
    if (data.error?.message) return data.error.message;
  } catch {
    /* ignore */
  }
  return `HTTP ${status}`;
}

async function uploadViaServer(
  uri: string,
  filename: string,
  contentType: string,
  folder: string,
): Promise<string> {
  const form = new FormData();
  appendMultipartFile(form, "file", uri, filename, contentType);
  const params = new URLSearchParams({ folder, storage: "auto" });
  const res = await fetch(`${getApiBaseUrl()}/v1/media/upload?${params}`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    let msg = "Dosya yüklenemedi";
    try {
      const body = (await res.json()) as { detail?: string };
      if (typeof body.detail === "string") msg = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { publicUrl: string };
  if (!data.publicUrl) throw new Error("Yükleme yanıtında URL yok");
  return resolveApiUrl(data.publicUrl);
}

async function uploadIdrivePut(
  uri: string,
  contentType: string,
  presign: PresignResponse,
): Promise<string> {
  const blob = await readUriBlob(uri);
  const res = await fetch(resolveApiUrl(presign.uploadUrl), {
    method: presign.method || "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!res.ok) throw new Error("iDrive yükleme başarısız");
  if (!presign.publicUrl) throw new Error("iDrive public URL yok");
  return resolveApiUrl(presign.publicUrl);
}

async function uploadCloudinaryPost(
  uri: string,
  filename: string,
  contentType: string,
  presign: PresignResponse,
): Promise<string> {
  if (!presign.fields) throw new Error("Cloudinary presign yok");
  const form = new FormData();
  for (const [key, value] of Object.entries(presign.fields)) {
    form.append(key, value);
  }
  appendMultipartFile(form, "file", uri, filename, contentType);
  const res = await fetch(presign.uploadUrl, { method: "POST", body: form });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Cloudinary: ${parseCloudinaryError(raw, res.status)}`);
  }
  const data = JSON.parse(raw) as { secure_url?: string; url?: string };
  const url = data.secure_url || data.url;
  if (!url) throw new Error("Cloudinary yanıtında URL yok");
  return url;
}

async function uploadLocalPost(
  uri: string,
  filename: string,
  contentType: string,
  presign: PresignResponse,
): Promise<string> {
  const form = new FormData();
  appendMultipartFile(form, "file", uri, filename, contentType);
  const res = await fetch(resolveApiUrl(presign.uploadUrl), {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error("Yerel yükleme başarısız");
  const data = (await res.json()) as { publicUrl?: string };
  if (data.publicUrl) return resolveApiUrl(data.publicUrl);
  if (presign.publicUrl) return resolveApiUrl(presign.publicUrl);
  throw new Error("Yerel yükleme URL yok");
}

function isCloudinaryPresign(presign: PresignResponse): boolean {
  return !!(presign.cloudinary || presign.storage === "cloudinary");
}

function isIdrivePresign(presign: PresignResponse): boolean {
  return !!(presign.idrive || presign.storage === "idrive");
}

async function uploadPresignFallback(
  uri: string,
  filename: string,
  contentType: string,
  folder: string,
): Promise<string> {
  const presign = await api.media.presign(filename, contentType, folder, "auto");
  if (isCloudinaryPresign(presign)) {
    return uploadCloudinaryPost(uri, filename, contentType, presign);
  }
  if (isIdrivePresign(presign)) {
    return uploadIdrivePut(uri, contentType, presign);
  }
  if (presign.local) {
    return uploadLocalPost(uri, filename, contentType, presign);
  }
  throw new Error("Medya depolama yapılandırılmamış");
}

export async function uploadImage(
  uri: string,
  name: string,
  type: string,
  folder = "media",
): Promise<string> {
  const contentType = normalizeType(name, type);
  const filename = normalizeName(name, contentType);
  let serverError: string | null = null;
  try {
    return await uploadViaServer(uri, filename, contentType, folder);
  } catch (e) {
    serverError = e instanceof Error ? e.message : "API yüklemesi başarısız";
  }
  try {
    return await uploadPresignFallback(uri, filename, contentType, folder);
  } catch (e) {
    const detail = e instanceof Error ? e.message : "Yükleme başarısız";
    throw new Error(
      serverError ? `${detail} (sunucu: ${serverError})` : detail,
    );
  }
}

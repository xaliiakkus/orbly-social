import type { PresignResponse } from "@orbly/types";

import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "@/lib/auth-store";

const API_BASE = getApiBaseUrl();

function normalizeUploadMeta(file: File): {
  file: File;
  contentType: string;
  filename: string;
} {
  const filename = file.name || "upload.jpg";
  let contentType = file.type?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!contentType || contentType === "application/octet-stream") {
    if (/\.jpe?g$/i.test(filename)) contentType = "image/jpeg";
    else if (/\.png$/i.test(filename)) contentType = "image/png";
    else if (/\.webp$/i.test(filename)) contentType = "image/webp";
    else if (/\.gif$/i.test(filename)) contentType = "image/gif";
    else if (/\.mp4$/i.test(filename)) contentType = "video/mp4";
    else contentType = "image/jpeg";
  }
  return { file, contentType, filename };
}

/** API multipart upload — Cloudinary (resim) / iDrive (video) sunucuda işlenir. */
async function uploadViaServer(
  file: File,
  folder: string,
  storage: "auto" | "cloudinary" | "idrive" = "auto",
): Promise<string> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append("file", file);
  const params = new URLSearchParams({ folder, storage });
  const res = await fetch(`${API_BASE}/v1/media/upload?${params}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    let msg = "Yükleme başarısız";
    try {
      const body = (await res.json()) as { detail?: string };
      if (typeof body.detail === "string") msg = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { publicUrl: string };
  if (!data.publicUrl) throw new Error("Yükleme başarısız");
  return data.publicUrl;
}

async function uploadIdrivePut(
  file: File,
  presign: PresignResponse,
  contentType: string,
): Promise<string> {
  const res = await fetch(presign.uploadUrl, {
    method: presign.method || "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`iDrive PUT ${res.status}`);
  if (!presign.publicUrl) throw new Error("iDrive public URL yok");
  return presign.publicUrl;
}

async function uploadCloudinaryPost(
  file: File,
  presign: PresignResponse,
): Promise<string> {
  if (!presign.cloudinary || !presign.fields) {
    throw new Error("Cloudinary presign yok");
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(presign.fields)) {
    form.append(key, value);
  }
  form.append("file", file);
  const res = await fetch(presign.uploadUrl, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Cloudinary ${res.status}`);
  const data = (await res.json()) as { secure_url?: string; url?: string };
  const url = data.secure_url || data.url;
  if (!url) throw new Error("Cloudinary yanıtında URL yok");
  return url;
}

async function uploadPresignFallback(
  file: File,
  contentType: string,
  filename: string,
  folder: string,
): Promise<string> {
  const presign = await api.media.presign(filename, contentType, folder, "auto");
  if (presign.cloudinary) {
    return uploadCloudinaryPost(file, presign);
  }
  if (presign.idrive) {
    return uploadIdrivePut(file, presign, contentType);
  }
  throw new Error("Presign depolama yok");
}

export async function uploadFile(file: File, folder = "media"): Promise<string> {
  const { file: normalized, contentType, filename } = normalizeUploadMeta(file);
  try {
    return await uploadViaServer(normalized, folder, "auto");
  } catch {
    /* API erişilemez veya 5xx */
  }

  try {
    return await uploadPresignFallback(normalized, contentType, filename, folder);
  } catch {
    throw new Error(
      "Dosya yüklenemedi. API deploy ve Cloudinary ayarlarını kontrol edin.",
    );
  }
}

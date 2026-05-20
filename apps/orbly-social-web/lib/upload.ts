import type { PresignResponse } from "@orbly/types";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

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

function parseCloudinaryError(raw: string): string {
  try {
    const body = JSON.parse(raw) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    /* ignore */
  }
  return "Cloudinary yükleme başarısız";
}

async function uploadCloudinaryDirect(
  file: File,
  presign: PresignResponse,
): Promise<string> {
  const form = new FormData();
  for (const [key, value] of Object.entries(presign.fields!)) {
    form.append(key, String(value));
  }
  form.append("file", file, file.name || "upload.jpg");

  const res = await fetch(presign.uploadUrl, { method: "POST", body: form });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(parseCloudinaryError(raw));
  }
  const data = JSON.parse(raw) as { secure_url?: string; url?: string };
  const url = data.secure_url ?? data.url;
  if (!url) throw new Error("Cloudinary yanıtında URL yok");
  return url;
}

/** API üzerinden yükleme — imza/CORS sorunlarında güvenilir yedek. */
async function uploadViaServer(
  file: File,
  folder: string,
): Promise<string> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(
    `${API_BASE}/v1/media/upload?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    },
  );
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

async function uploadWithPresign(
  file: File,
  contentType: string,
  filename: string,
  folder: string,
  presign: PresignResponse,
): Promise<string> {
  const token = useAuthStore.getState().accessToken;

  if (presign.cloudinary && presign.fields) {
    try {
      return await uploadCloudinaryDirect(file, presign);
    } catch {
      return uploadViaServer(file, folder);
    }
  }

  if (presign.local) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(presign.uploadUrl, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = (await res.json()) as { publicUrl: string };
    return data.publicUrl;
  }

  const res = await fetch(presign.uploadUrl, {
    method: presign.method,
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
  const url = presign.publicUrl;
  if (!url) throw new Error("Upload failed");
  return url;
}

export async function uploadFile(file: File, folder = "media"): Promise<string> {
  const { file: normalized, contentType, filename } = normalizeUploadMeta(file);
  const presign = await api.media.presign(filename, contentType, folder);
  return uploadWithPresign(normalized, contentType, filename, folder, presign);
}

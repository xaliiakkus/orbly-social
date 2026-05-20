import type { PresignResponse } from "@orbly/types";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

async function uploadWithPresign(file: File, presign: PresignResponse): Promise<string> {
  const token = useAuthStore.getState().accessToken;

  if (presign.cloudinary && presign.fields) {
    const form = new FormData();
    form.append("file", file);
    for (const [key, value] of Object.entries(presign.fields)) {
      form.append(key, value);
    }
    const res = await fetch(presign.uploadUrl, { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    const data = (await res.json()) as { secure_url?: string; url?: string };
    const url = data.secure_url ?? data.url;
    if (!url) throw new Error("Upload failed");
    return url;
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
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
  return presign.publicUrl;
}

export async function uploadFile(file: File): Promise<string> {
  const presign = await api.media.presign(file.name, file.type);
  return uploadWithPresign(file, presign);
}

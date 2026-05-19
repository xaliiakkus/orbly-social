import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export async function uploadFile(file: File): Promise<string> {
  const presign = await api.media.presign(file.name, file.type);
  const token = useAuthStore.getState().accessToken;

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

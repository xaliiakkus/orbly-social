"use client";

import { formatUserError } from "@orbly/api-client";
import { Camera, ChevronRight, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Avatar } from "@/components/ui/avatar";
import { MediaImage } from "@/components/ui/media-image";
import { ProfileField } from "@/components/profile/profile-field";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media-url";
import { uploadFile } from "@/lib/upload";
import type { UserPublic } from "@orbly/types";

function MediaUploadButton({
  label,
  onPick,
}: {
  label: string;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75 transition-colors"
      >
        <Camera className="h-5 w-5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

export function EditProfileModal({
  user,
  open,
  onClose,
  onSaved,
}: {
  user: UserPublic;
  open: boolean;
  onClose: () => void;
  onSaved?: (user: UserPublic) => void;
}) {
  const { update: updateSession } = useSession();
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [website, setWebsite] = useState(user.website ?? "");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetForm = useCallback(() => {
    setDisplayName(user.displayName);
    setBio(user.bio ?? "");
    setLocation(user.location ?? "");
    setWebsite(user.website ?? "");
    setBannerPreview(null);
    setAvatarPreview(null);
    setBannerFile(null);
    setAvatarFile(null);
    setError("");
  }, [user]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const pickBanner = (file: File) => {
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const pickAvatar = (file: File) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      let bannerUrl = user.bannerUrl;
      let avatarUrl = user.avatarUrl;
      if (bannerFile) bannerUrl = await uploadFile(bannerFile, "profiles");
      if (avatarFile) avatarUrl = await uploadFile(avatarFile, "avatars");

      const res = await api.users.updateMe({
        displayName: displayName.trim() || user.displayName,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        ...(bannerFile ? { bannerUrl } : {}),
        ...(avatarFile ? { avatarUrl } : {}),
      });

      setUser(res.user);
      await updateSession({ orblyUser: res.user });
      onSaved?.(res.user);
      onClose();
    } catch (err) {
      setError(formatUserError(err));
    } finally {
      setSaving(false);
    }
  };

  const bannerSrc = bannerPreview ?? resolveMediaUrl(user.bannerUrl);
  const avatarSrc = avatarPreview ?? user.avatarUrl;

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/65 backdrop-blur-[2px] p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[600px] rounded-2xl bg-bg-primary shadow-2xl border border-border my-auto">
        <header className="flex items-center justify-between px-4 h-[53px]">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-bg-hover transition-colors"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 id="edit-profile-title" className="font-bold text-[20px]">
            Profili düzenle
          </h2>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !displayName.trim()}
            className="font-bold text-[15px] rounded-full px-4 py-1.5 bg-text-primary text-bg-primary disabled:opacity-50 hover:opacity-90 transition-opacity min-w-[72px]"
          >
            {saving ? "…" : "Kaydet"}
          </button>
        </header>

        <div className="relative h-[140px] bg-bg-secondary overflow-hidden">
          {bannerSrc ? (
            <MediaImage
              src={bannerSrc}
              alt=""
              className="absolute inset-0 h-full w-full"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a3a3a] to-bg-secondary" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <MediaUploadButton label="Kapak fotoğrafı yükle" onPick={pickBanner} />
          </div>
        </div>

        <div className="relative px-4 -mt-[42px] mb-2">
          <div className="relative inline-block">
            <Avatar
              src={avatarSrc}
              name={displayName}
              size="xl"
              className="h-[84px] w-[84px] text-3xl border-4 border-bg-primary"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <MediaUploadButton label="Profil fotoğrafı yükle" onPick={pickAvatar} />
            </div>
          </div>
        </div>

        <div className="px-4 pb-6 pt-2 space-y-3">
          <ProfileField label="İsim" value={displayName} onChange={setDisplayName} maxLength={100} />
          <ProfileField
            label="Kişisel bilgiler"
            value={bio}
            onChange={setBio}
            multiline
            maxLength={160}
            placeholder="Kendinden bahset"
          />
          <ProfileField label="Konum" value={location} onChange={setLocation} maxLength={100} />
          <ProfileField
            label="İnternet sitesi"
            value={website}
            onChange={setWebsite}
            maxLength={255}
            placeholder="https://"
          />

          <button
            type="button"
            disabled
            className="w-full flex items-center justify-between rounded border border-border px-4 py-3 text-left opacity-60 cursor-not-allowed"
          >
            <div>
              <p className="text-[13px] text-text-secondary">Doğum tarihi</p>
              <p className="text-[15px] mt-0.5">Doğum tarihini ekle</p>
            </div>
            <ChevronRight className="h-5 w-5 text-text-secondary shrink-0" />
          </button>

          <button
            type="button"
            disabled
            className="w-full flex items-center justify-between rounded border border-border px-4 py-3 text-left opacity-60 cursor-not-allowed"
          >
            <p className="text-[15px] pr-2">Profesyonel profili düzenle</p>
            <ChevronRight className="h-5 w-5 text-text-secondary shrink-0" />
          </button>

          {error && <p className="text-like text-sm pt-1">{error}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

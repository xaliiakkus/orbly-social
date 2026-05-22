"use client";

import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { SettingsDetail } from "@/components/settings/settings-detail";
import { SettingsNav } from "@/components/settings/settings-nav";
import type { SettingsSectionId } from "@/components/settings/settings-config";
import { SECTION_META } from "@/components/settings/settings-config";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";

const VALID_SECTIONS = new Set<SettingsSectionId>([
  "account",
  "appearance",
  "monetization",
  "premium",
  "creator",
  "security",
  "privacy",
  "notifications",
  "accessibility",
  "language",
  "orbits",
]);

function SettingsPageContent() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const [section, setSection] = useState<SettingsSectionId>("account");
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const meta = SECTION_META[section];

  useEffect(() => {
    const s = searchParams.get("section");
    if (s && VALID_SECTIONS.has(s as SettingsSectionId)) {
      setSection(s as SettingsSectionId);
      setMobileShowDetail(true);
    }
  }, [searchParams]);

  const selectSection = (id: SettingsSectionId) => {
    setSection(id);
    setMobileShowDetail(true);
  };

  const profileUser = useMemo(() => user, [user]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-secondary">
        Giriş yapman gerekiyor.
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full">
        <div
          className={cn(
            "shrink-0 w-full md:w-auto",
            mobileShowDetail ? "hidden md:block" : "block",
          )}
        >
          <SettingsNav
            active={section}
            onSelect={selectSection}
            query={search}
            onQueryChange={setSearch}
          />
        </div>

        <div
          className={cn(
            "flex-1 min-w-0 flex flex-col",
            !mobileShowDetail ? "hidden md:flex" : "flex",
          )}
        >
          <div className="flex items-center gap-2 px-2 h-[53px] border-b border-border md:hidden shrink-0">
            <button
              type="button"
              onClick={() => setMobileShowDetail(false)}
              className="p-2 rounded-full hover:bg-bg-hover"
              aria-label="Geri"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="font-bold text-[17px] truncate">{meta.title}</p>
            </div>
          </div>

          <SettingsDetail sectionId={section} onEditProfile={() => setEditOpen(true)} />
        </div>
      </div>

      {profileUser && (
        <EditProfileModal
          user={profileUser}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}

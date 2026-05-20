"use client";

import { ArrowLeft, Search, Settings } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/auth-store";

export function ExploreHeader({
  query,
  onChangeQuery,
  onSubmitSearch,
  onOpenMenu,
  searchMode,
  onBack,
}: {
  query: string;
  onChangeQuery: (q: string) => void;
  onSubmitSearch: () => void;
  onOpenMenu?: () => void;
  searchMode?: boolean;
  onBack?: () => void;
}) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 pb-2">
      {searchMode ? (
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 p-2 rounded-full hover:bg-bg-hover"
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : user ? (
        <button
          type="button"
          onClick={onOpenMenu}
          className="shrink-0 rounded-full hover:opacity-90 md:hidden"
          aria-label="Hesap menüsü"
        >
          <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
        </button>
      ) : (
        <span className="w-9 shrink-0 hidden md:block" />
      )}

      <form
        className="flex-1 min-w-0"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitSearch();
        }}
      >
        <label className="relative flex items-center min-h-[42px] rounded-full bg-bg-secondary border border-border">
          <Search className="absolute left-3.5 h-4 w-4 text-text-secondary pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Ara"
            className="w-full bg-transparent rounded-full pl-10 pr-4 py-2.5 text-[16px] outline-none placeholder:text-text-secondary"
            autoFocus={searchMode}
          />
        </label>
      </form>

      <Link
        href="/settings"
        className="shrink-0 p-2 rounded-full hover:bg-bg-hover text-text-primary"
        aria-label="Ayarlar"
      >
        <Settings className="h-[22px] w-[22px]" />
      </Link>
    </div>
  );
}

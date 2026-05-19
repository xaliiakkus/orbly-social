"use client";

import { Search } from "lucide-react";

export function MobileSearchBar() {
  return (
    <label className="relative block group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
      <input
        type="search"
        placeholder="Orbly'de ara"
        className="w-full bg-bg-secondary rounded-full pl-11 pr-4 py-3 text-[15px] outline-none border border-transparent focus:border-accent/50 focus:bg-bg-primary placeholder:text-text-secondary transition-colors"
        onFocus={() => {
          window.location.href = "/explore";
        }}
        readOnly
      />
    </label>
  );
}

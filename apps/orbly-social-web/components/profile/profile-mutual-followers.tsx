"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { formatCount } from "@/lib/format";
import type { UserPublic } from "@orbly/types";

function formatMutualLine(users: UserPublic[], totalCount: number) {
  if (totalCount === 0) return null;

  const names = users.map((u) => u.username);
  const others = totalCount - names.length;

  if (names.length === 1 && others <= 0) {
    return (
      <>
        Takip ettiğin{" "}
        <Link href={`/profile/${names[0]}`} className="text-text-primary font-medium hover:underline">
          @{names[0]}
        </Link>{" "}
        de takip ediyor
      </>
    );
  }

  if (names.length === 2 && others <= 0) {
    return (
      <>
        Takip ettiğin{" "}
        <Link href={`/profile/${names[0]}`} className="text-text-primary font-medium hover:underline">
          @{names[0]}
        </Link>
        ,{" "}
        <Link href={`/profile/${names[1]}`} className="text-text-primary font-medium hover:underline">
          @{names[1]}
        </Link>{" "}
        de takip ediyor
      </>
    );
  }

  const shown = names.slice(0, 2);
  const rest = others > 0 ? others : Math.max(0, totalCount - shown.length);

  return (
    <>
      Takip ettiğin{" "}
      {shown.map((name, i) => (
        <span key={name}>
          {i > 0 ? ", " : null}
          <Link href={`/profile/${name}`} className="text-text-primary font-medium hover:underline">
            @{name}
          </Link>
        </span>
      ))}
      {rest > 0 ? (
        <>
          {" "}
          ve {formatCount(rest)} kişi daha
        </>
      ) : null}{" "}
      de takip ediyor
    </>
  );
}

export function ProfileMutualFollowers({
  users,
  totalCount,
}: {
  users: UserPublic[];
  totalCount: number;
}) {
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex -space-x-2 shrink-0">
        {users.slice(0, 3).map((u) => (
          <Link key={u.id} href={`/profile/${u.username}`} className="relative">
            <Avatar
              src={u.avatarUrl}
              name={u.displayName}
              size="sm"
              className="h-6 w-6 border-2 border-bg-primary"
            />
          </Link>
        ))}
      </div>
      <p className="text-[13px] text-text-secondary min-w-0 flex-1 leading-snug">
        {formatMutualLine(users, totalCount)}
      </p>
    </div>
  );
}

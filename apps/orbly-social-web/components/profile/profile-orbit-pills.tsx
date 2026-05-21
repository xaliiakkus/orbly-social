"use client";

import Link from "next/link";

import type { OrbitPublic } from "@orbly/types";

export function ProfileOrbitPills({ orbits }: { orbits: OrbitPublic[] }) {
  if (!orbits.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {orbits.map((orbit) => (
        <Link
          key={orbit.id}
          href={`/orbits/${orbit.slug}`}
          className="orbit-pill hover:opacity-90 transition-opacity"
        >
          <span aria-hidden>{orbit.name.charAt(0).toUpperCase()}</span>
          {orbit.name}
        </Link>
      ))}
    </div>
  );
}

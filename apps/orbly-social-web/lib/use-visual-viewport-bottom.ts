"use client";

import { useEffect, useState } from "react";

/** Klavye / tarayıcı UI için viewport alt boşluğu (px). */
export function useVisualViewportBottom() {
  const [bottom, setBottom] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const inset = window.innerHeight - vv.height - vv.offsetTop;
      setBottom(Math.max(0, Math.round(inset)));
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return bottom;
}

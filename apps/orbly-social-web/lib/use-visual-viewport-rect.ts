"use client";

import { useEffect, useState } from "react";

/** Mobil klavye açıkken görünür alan (X compose tam ekranı buna sığar). */
export function useVisualViewportRect() {
  const [rect, setRect] = useState(() => ({
    top: 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      setRect({
        top: vv.offsetTop,
        height: vv.height,
      });
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

  return rect;
}

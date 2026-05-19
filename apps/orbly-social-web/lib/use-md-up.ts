"use client";

import { useEffect, useState } from "react";

/** Tailwind `md` (768px) ve üzeri */
export function useMdUp() {
  const [mdUp, setMdUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setMdUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mdUp;
}

/** Mobil tarayıcıda klavyeyi açmak için güvenilir odak. */
export function focusTextarea(el: HTMLTextAreaElement | null | undefined) {
  if (!el) return;

  const run = () => {
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
    const end = el.value.length;
    try {
      el.setSelectionRange(end, end);
    } catch {
      // bazı tarayıcılar
    }
  };

  requestAnimationFrame(() => {
    run();
    try {
      el.scrollIntoView({ block: "center", inline: "nearest" });
    } catch {
      // ignore
    }
    window.setTimeout(run, 50);
    window.setTimeout(run, 280);
  });
}

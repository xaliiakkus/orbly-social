"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MobileFullComposeDrawer } from "@/components/layout/mobile-full-compose-drawer";
import {
  ComposeBox,
  type ComposeBoxHandle,
  type ComposeBoxState,
} from "@/components/post/compose-box";

export function MobileComposeSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const composeRef = useRef<ComposeBoxHandle>(null);
  const [composeState, setComposeState] = useState<ComposeBoxState>({
    canPost: false,
    isPending: false,
  });
  const [focusSession, setFocusSession] = useState(0);

  useEffect(() => {
    if (open) setFocusSession((n) => n + 1);
  }, [open]);

  const onComposeState = useCallback((s: ComposeBoxState) => {
    setComposeState(s);
  }, []);

  const submit = () => composeRef.current?.submit();

  return (
    <MobileFullComposeDrawer
      open={open}
      onClose={onClose}
      onSubmit={submit}
      canSubmit={composeState.canPost}
      isSubmitting={composeState.isPending}
      submitLabel="Gönder"
    >
      <ComposeBox
        ref={composeRef}
        variant="mobile-drawer"
        submitInHeader
        onPosted={onClose}
        onComposeState={onComposeState}
        focusSession={focusSession}
        className="flex min-h-0 flex-1 flex-col border-0 hover:bg-transparent"
      />
    </MobileFullComposeDrawer>
  );
}

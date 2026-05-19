import { ComposeModal } from "@/components/ComposeModal";

/** @deprecated ComposeModal initialMode="live" kullan */
export function GoLiveModal({
  visible,
  onClose,
  liveAvailable = true,
}: {
  visible: boolean;
  onClose: () => void;
  liveAvailable?: boolean;
}) {
  return (
    <ComposeModal
      visible={visible}
      onClose={onClose}
      initialMode="live"
      liveAvailable={liveAvailable}
    />
  );
}

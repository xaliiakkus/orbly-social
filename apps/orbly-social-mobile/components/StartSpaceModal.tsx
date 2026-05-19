import { ComposeModal } from "@/components/ComposeModal";

/** @deprecated ComposeModal initialMode="space" kullan */
export function StartSpaceModal({
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
      initialMode="space"
      liveAvailable={liveAvailable}
    />
  );
}

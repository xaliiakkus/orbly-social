import type { LiveChannelPublic } from "@orbly/api-client";

/** Socket/HTTP yamalarını birleştirir; yönetici istek listesi yanlışlıkla silinmez. */
export function mergeLiveChannel(
  prev: LiveChannelPublic,
  patch: Partial<LiveChannelPublic>,
  canManageViewer: boolean,
): LiveChannelPublic {
  const next: LiveChannelPublic = { ...prev, ...patch };

  if (patch.speakers !== undefined) {
    next.speakers = patch.speakers;
  }

  if (patch.speakerRequests !== undefined) {
    next.speakerRequests = patch.speakerRequests;
  } else if (canManageViewer && prev.speakerRequests !== undefined) {
    next.speakerRequests = prev.speakerRequests;
  }

  if (patch.canManageRoom === undefined && prev.canManageRoom !== undefined) {
    next.canManageRoom = prev.canManageRoom;
  }

  return next;
}

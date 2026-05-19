"use client";

import type { LiveChannelPublic, LiveSpeakRequestPublic } from "@orbly/api-client";
import { formatUserError } from "@orbly/api-client";
import { Mic, Shield, ShieldOff, UserMinus, UserPlus, X } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api";

export function LiveSpacePanel({
  channelId,
  channel,
  onChannelUpdate,
}: {
  channelId: string;
  channel: LiveChannelPublic;
  onChannelUpdate: (ch: LiveChannelPublic) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isHost = channel.isHost ?? channel.myRole === "host";
  const canManage = channel.canManageRoom ?? isHost;
  const isModerator = channel.myRole === "moderator";
  const isSpeaker = channel.myRole === "speaker" || isModerator || isHost;
  const isListener = channel.myRole === "listener";

  const run = async (key: string, fn: () => Promise<{ channel: LiveChannelPublic }>) => {
    setBusy(key);
    setError("");
    try {
      const res = await fn();
      onChannelUpdate(res.channel);
    } catch (e) {
      setError(formatUserError(e));
    } finally {
      setBusy(null);
    }
  };

  const speakers = channel.speakers ?? [];
  const requests = channel.speakerRequests ?? [];

  return (
    <div className="border-b border-border bg-bg-secondary/30 px-4 py-3 space-y-3 shrink-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-text-secondary uppercase tracking-wide">
          Konuşmacılar ({channel.speakerCount ?? speakers.length})
        </p>
        {isListener && !channel.hasSpeakRequest && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void run("req", () => api.live.requestSpeak(channelId))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-bold hover:bg-accent-hover disabled:opacity-50"
          >
            <Mic className="h-3.5 w-3.5" />
            Konuşma iste
          </button>
        )}
        {isListener && channel.hasSpeakRequest && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void run("cancel", () => api.live.cancelSpeakRequest(channelId))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-bold hover:bg-bg-hover disabled:opacity-50"
          >
            İsteği iptal et
          </button>
        )}
        {isModerator && (
          <span className="text-xs font-semibold text-orbit flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Yönetici
          </span>
        )}
        {isSpeaker && !isHost && !isModerator && (
          <span className="text-xs font-semibold text-accent">Konuşmacısın</span>
        )}
      </div>

      {error && <p className="text-like text-xs">{error}</p>}

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {speakers.map((s) => (
          <SpeakerChip
            key={s.userId}
            speaker={s}
            busy={busy}
            isHost={isHost}
            canManage={canManage}
            onRevokeSpeaker={() =>
              run(`revoke-${s.userId}`, () => api.live.revokeSpeaker(channelId, s.userId))
            }
            onGrantModerator={() =>
              run(`mod-${s.userId}`, () => api.live.grantModerator(channelId, s.userId))
            }
            onRevokeModerator={() =>
              run(`unmod-${s.userId}`, () => api.live.revokeModerator(channelId, s.userId))
            }
          />
        ))}
      </div>

      {canManage && requests.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-primary overflow-hidden">
          <p className="px-3 py-2 text-[13px] font-bold border-b border-border">
            Konuşma istekleri ({requests.length})
          </p>
          <ul>
            {requests.map((r) => (
              <RequestRow
                key={r.userId}
                request={r}
                busy={busy === r.userId}
                onApprove={() =>
                  void run(r.userId, () => api.live.approveSpeaker(channelId, r.userId))
                }
                onDeny={() =>
                  void run(`deny-${r.userId}`, () => api.live.denySpeakRequest(channelId, r.userId))
                }
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SpeakerChip({
  speaker: s,
  busy,
  isHost,
  canManage,
  onRevokeSpeaker,
  onGrantModerator,
  onRevokeModerator,
}: {
  speaker: NonNullable<LiveChannelPublic["speakers"]>[number];
  busy: string | null;
  isHost: boolean;
  canManage: boolean;
  onRevokeSpeaker: () => void;
  onGrantModerator: () => void;
  onRevokeModerator: () => void;
}) {
  const isMod = s.role === "moderator";
  const showHostControls = isHost && s.role === "speaker";
  const showModControls = isHost && isMod;

  return (
    <div
      className="flex flex-col items-center gap-1 shrink-0 w-[88px]"
      title={s.user?.displayName}
    >
      <div className="relative">
        <Avatar src={s.user?.avatarUrl} name={s.user?.displayName ?? "?"} size="md" />
        {s.role === "host" && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-like text-white px-1 rounded whitespace-nowrap">
            Host
          </span>
        )}
        {isMod && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-orbit text-white px-1 rounded whitespace-nowrap">
            Yönetici
          </span>
        )}
      </div>
      <span className="text-[11px] text-text-secondary truncate w-full text-center">
        {s.user?.displayName?.split(" ")[0] ?? "?"}
      </span>
      {canManage && s.role !== "host" && (
        <div className="flex flex-col gap-0.5 w-full items-center">
          {showHostControls && (
            <button
              type="button"
              disabled={!!busy}
              onClick={onGrantModerator}
              className="text-[10px] text-orbit font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <Shield className="h-3 w-3" />
              Yönetim ver
            </button>
          )}
          {showModControls && (
            <button
              type="button"
              disabled={!!busy}
              onClick={onRevokeModerator}
              className="text-[10px] text-orbit font-semibold hover:underline inline-flex items-center gap-0.5"
            >
              <ShieldOff className="h-3 w-3" />
              Yönetimi al
            </button>
          )}
          <button
            type="button"
            disabled={!!busy}
            onClick={onRevokeSpeaker}
            className="text-[10px] text-like font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            <UserMinus className="h-3 w-3" />
            Kaldır
          </button>
        </div>
      )}
    </div>
  );
}

function RequestRow({
  request,
  busy,
  onApprove,
  onDeny,
}: {
  request: LiveSpeakRequestPublic;
  busy: boolean;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const u = request.user;
  return (
    <li className="flex items-center gap-2 px-3 py-2.5 border-b border-border last:border-0">
      <Avatar src={u?.avatarUrl} name={u?.displayName ?? "?"} size="sm" />
      <span className="flex-1 min-w-0 truncate text-[15px] font-medium">
        {u?.displayName ?? u?.username}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={onApprove}
        className="p-2 rounded-full bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50"
        aria-label="Onayla"
      >
        <UserPlus className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDeny}
        className="p-2 rounded-full hover:bg-bg-hover disabled:opacity-50"
        aria-label="Reddet"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

"use client";

import { isTrackReference, VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Mic, Monitor, Radio } from "lucide-react";

import { cn } from "@/lib/cn";

export function LiveStreamStage({
  isHost,
  isSpace = false,
  videoMode,
  channelTitle,
  listenerCount,
  speakerCount,
}: {
  isHost: boolean;
  isSpace?: boolean;
  videoMode: boolean;
  channelTitle: string;
  listenerCount: number;
  speakerCount?: number;
}) {
  const trackOpts = { onlySubscribed: !isHost };

  const screenTracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    trackOpts,
  );
  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    trackOpts,
  );

  const screen = screenTracks.find(isTrackReference);
  const camera = cameraTracks.find(isTrackReference);
  const hasVideo = Boolean(screen || camera);

  return (
    <div className="relative flex flex-col flex-1 min-h-0 bg-black">
      <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white text-xs font-extrabold uppercase tracking-wide shadow-lg",
              isSpace ? "bg-accent" : "bg-like",
            )}
          >
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            {isSpace ? "Sohbet" : "Canlı"}
          </span>
          {isHost && (
            <span className="px-2 py-1 rounded-md bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
              Yayıncı
            </span>
          )}
          {screen && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/90 text-white text-xs font-semibold">
              <Monitor className="h-3.5 w-3.5" />
              Ekran paylaşımı
            </span>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-md bg-black/60 text-white text-xs font-semibold backdrop-blur-sm shrink-0">
          {isSpace
            ? `${listenerCount} dinleyici · ${speakerCount ?? 1} konuşmacı`
            : `${listenerCount} izleyici`}
        </span>
      </div>

      <div
        className={cn(
          "relative flex-1 min-h-[220px] lg:min-h-[360px] w-full flex items-center justify-center",
          !hasVideo && "bg-gradient-to-b from-zinc-900 to-black",
        )}
      >
        {screen ? (
          <>
            <VideoTrack trackRef={screen} className="w-full h-full object-contain max-h-[70vh] lg:max-h-none" />
            {camera && (
              <div className="absolute bottom-4 right-4 w-36 sm:w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/25 shadow-2xl z-10 bg-black">
                <VideoTrack trackRef={camera} className="w-full h-full object-cover" />
              </div>
            )}
          </>
        ) : camera ? (
          <VideoTrack trackRef={camera} className="w-full h-full object-contain max-h-[70vh] lg:max-h-none" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 px-6 text-center text-zinc-400">
            {videoMode ? (
              <>
                <div className="h-24 w-24 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Radio className="h-10 w-10 text-zinc-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">
                    {isHost ? "Kamera veya ekranını aç" : "Yayın başlamak üzere…"}
                  </p>
                  <p className="text-sm mt-1 text-zinc-500">
                    {isHost
                      ? "Alttaki kontrollerden mikrofon, kamera veya ekran paylaşımını başlat."
                      : "Yayıncı görüntü veya ses gönderdiğinde burada görünecek."}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-24 w-24 rounded-full bg-like/20 flex items-center justify-center ring-4 ring-like/40">
                  <Mic className="h-10 w-10 text-like" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{channelTitle}</p>
                  <p className="text-sm mt-1 text-zinc-500">
                    {isSpace
                      ? isHost
                        ? "Odayı yönetiyorsun. Konuşma isteklerini onayla."
                        : "Sesli sohbet — konuşmacılar burada duyulur."
                      : isHost
                        ? "Mikrofonu aç ve konuşmaya başla."
                        : "Sesli yayın — yayıncı bekleniyor…"}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-bg-primary border-t border-border shrink-0">
        <p className="font-bold truncate text-[15px]">{channelTitle}</p>
      </div>
    </div>
  );
}

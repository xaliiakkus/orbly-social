"use client";

import { usePollVote } from "@orbly/features";
import type { PollPublic } from "@orbly/types";

import { cn } from "@/lib/cn";

export function PollBlock({
  postId,
  poll,
  onVoted,
}: {
  postId: string;
  poll: PollPublic;
  onVoted?: () => void;
}) {
  const vote = usePollVote(postId);

  const handleVote = async (optionId: string) => {
    if (poll.ended || poll.votedOptionId) return;
    await vote.mutateAsync(optionId);
    onVoted?.();
  };

  return (
    <div className="mt-3 border border-border rounded-2xl overflow-hidden">
      {poll.options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          disabled={poll.ended || !!poll.votedOptionId || vote.isPending}
          onClick={(e) => {
            e.stopPropagation();
            void handleVote(opt.id);
          }}
          className={cn(
            "relative w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-bg-hover transition-colors",
            poll.votedOptionId === opt.id && "bg-accent/10",
          )}
        >
          {(poll.votedOptionId || poll.ended) && (
            <div
              className="absolute inset-y-0 left-0 bg-accent/20"
              style={{ width: `${opt.percent}%` }}
            />
          )}
          <span className="relative flex justify-between text-[15px]">
            <span>{opt.text}</span>
            {(poll.votedOptionId || poll.ended) && (
              <span className="text-text-secondary">{opt.percent}%</span>
            )}
          </span>
        </button>
      ))}
      <p className="px-4 py-2 text-text-secondary text-[13px]">
        {poll.totalVotes} oy · {poll.ended ? "Sona erdi" : "Aktif"}
      </p>
    </div>
  );
}

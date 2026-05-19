import { usePollVote } from "@orbly/features";
import type { PollPublic } from "@orbly/types";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";

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

  return (
    <View style={styles.wrap}>
      {poll.options.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.option, poll.votedOptionId === opt.id && styles.optionActive]}
          disabled={poll.ended || !!poll.votedOptionId || vote.isPending}
          onPress={() => {
            if (poll.ended || poll.votedOptionId) return;
            vote.mutate(opt.id, { onSuccess: onVoted });
          }}
        >
          <View style={[styles.bar, { width: `${opt.percent}%` }]} />
          <Text style={styles.optionText}>{opt.text}</Text>
          {(poll.votedOptionId || poll.ended) && (
            <Text style={styles.percent}>{opt.percent}%</Text>
          )}
        </Pressable>
      ))}
      <Text style={styles.meta}>
        {poll.totalVotes} oy · {poll.ended ? "Sona erdi" : "Aktif"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: OrblyColors.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  option: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: OrblyColors.border },
  optionActive: { backgroundColor: "rgba(29, 155, 240, 0.12)" },
  bar: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgba(29, 155, 240, 0.2)" },
  optionText: { color: OrblyColors.textPrimary, fontSize: 15 },
  percent: { color: OrblyColors.textSecondary, fontSize: 13, marginTop: 4 },
  meta: { padding: 10, color: OrblyColors.textSecondary, fontSize: 13 },
});

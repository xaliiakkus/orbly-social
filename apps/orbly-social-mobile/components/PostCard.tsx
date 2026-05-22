import {
  canManagePost,
  getRepostDisplayCount,
  getRepostTargetId,
  getPostShareUrl,
  getRepostTargetPost,
  postRoom,
  useDeletePost,
  usePostBookmark,
  usePostLike,
  usePostRepost,
  usePostView,
  useUpdatePost,
} from "@orbly/features";
import { formatUserError } from "@orbly/api-client";
import type { PostPublic } from "@orbly/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "@/components/ui/expo-image";
import { useRouter } from "expo-router";
import { memo, useContext, useEffect, useState, type ComponentProps } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";

import { EditPostModal } from "@/components/EditPostModal";
import { PostOwnerMenuDialog } from "@/components/PostOwnerMenuDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthStore } from "@/lib/auth-store";
import { ReplyComposeContext } from "@/lib/reply-compose-context";
import { RepostComposeContext } from "@/lib/repost-compose-context";
import { RepostEmbed } from "@/components/RepostEmbed";
import { RepostersModal } from "@/components/RepostersModal";

import { PollBlock } from "@/components/PollBlock";
import { PostContent } from "@/components/ui/PostContent";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { OrblyColors } from "@/constants/Colors";
import { POST_ACTION_MAX_WIDTH } from "@/constants/layout";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media-url";
import { useMobileSocketRooms } from "@/lib/use-socket-rooms";

const POST_ICON_SIZE = 18;

type IonName = ComponentProps<typeof Ionicons>["name"];

/** Web/Lucide (X tarzı) ile hizalı Ionicons adları */
const PostIcons = {
  reply: "chatbubble-outline",
  repost: "repeat-outline",
  repostActive: "repeat",
  like: "heart-outline",
  likeActive: "heart",
  views: "stats-chart-outline",
  bookmark: "bookmark-outline",
  bookmarkActive: "bookmark",
  menu: "ellipsis-horizontal",
  verified: "checkmark-circle",
  live: "radio-outline",
} as const satisfies Record<string, IonName>;

function PostActionButton({
  name,
  activeName,
  count,
  color = OrblyColors.textSecondary,
  active,
  onPress,
  disabled,
}: {
  name: IonName;
  activeName?: IonName;
  count?: number;
  color?: string;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const iconColor = active ? color : OrblyColors.textSecondary;
  const iconName = active && activeName ? activeName : name;
  return (
    <Pressable style={styles.actionBtn} onPress={onPress} hitSlop={8} disabled={disabled}>
      <Ionicons name={iconName} size={POST_ICON_SIZE} color={iconColor} />
      {count !== undefined && count > 0 ? (
        <Text style={[styles.actionCount, active && { color }]}>{formatCount(count)}</Text>
      ) : null}
    </Pressable>
  );
}

function PostIcon({
  name,
  size,
  color,
}: {
  name: IonName;
  size: number;
  color: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

function postCardPropsEqual(
  prev: {
    post: PostPublic;
    onRefresh?: () => void;
    onDeleted?: () => void;
    onReply?: () => void;
    threadRootId?: string;
    replyingToUsername?: string | null;
    highlightReply?: boolean;
  },
  next: typeof prev,
) {
  if (prev.post.id !== next.post.id) return false;
  if (prev.highlightReply !== next.highlightReply) return false;
  if (prev.threadRootId !== next.threadRootId) return false;
  if (prev.replyingToUsername !== next.replyingToUsername) return false;
  if (prev.onRefresh !== next.onRefresh) return false;
  if (prev.onDeleted !== next.onDeleted) return false;
  if (prev.onReply !== next.onReply) return false;
  const p = prev.post;
  const n = next.post;
  return (
    p.content === n.content &&
    p.stats.likeCount === n.stats.likeCount &&
    p.stats.replyCount === n.stats.replyCount &&
    p.stats.repostCount === n.stats.repostCount &&
    p.stats.viewCount === n.stats.viewCount &&
    p.likedByMe === n.likedByMe &&
    p.repostedByMe === n.repostedByMe &&
    p.bookmarkedByMe === n.bookmarkedByMe &&
    p.repostOf?.id === n.repostOf?.id
  );
}

function PostCardInner({
  post,
  onRefresh,
  onDeleted,
  onReply,
  threadRootId: threadRootIdProp,
  replyingToUsername,
  highlightReply,
}: {
  post: PostPublic;
  onRefresh?: () => void;
  onDeleted?: () => void;
  onReply?: () => void;
  threadRootId?: string;
  replyingToUsername?: string | null;
  highlightReply?: boolean;
}) {
  const router = useRouter();
  const replyCompose = useContext(ReplyComposeContext);
  const repostCompose = useContext(RepostComposeContext);
  const viewer = useAuthStore((s) => s.user);
  const repostTarget = getRepostTargetPost(post);
  const repostTargetId = getRepostTargetId(post);
  const isRepostCard = !!post.repostOf;
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [repostersOpen, setRepostersOpen] = useState(false);
  const manageable = canManagePost(post, viewer?.id);
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  useMobileSocketRooms([postRoom(post.id)]);

  const { liked, count: likeCount, toggle: toggleLike, isPending: likePending } = usePostLike(
    post.id,
    post.likedByMe ?? false,
    post.stats.likeCount,
  );
  const { bookmarked, toggle: toggleBookmark } = usePostBookmark(
    post.id,
    post.bookmarkedByMe ?? false,
  );
  const {
    reposted,
    count: repostCount,
    toggle: toggleRepost,
    isPending: repostPending,
  } = usePostRepost(
    repostTargetId,
    post.repostedByMe ?? false,
    getRepostDisplayCount(post),
    post.myRepostId,
  );
  const ownPost = viewer?.id === repostTarget.author.id;
  const postView = usePostView(repostTargetId, viewer?.id, repostTarget.author.id);

  useEffect(() => {
    postView.recordView();
  }, [repostTargetId, postView.recordView]);

  const threadRootId = threadRootIdProp ?? post.replyToId ?? post.id;
  const openPost = () => router.push(`/post/${threadRootId}`);
  const openReply = () => {
    if (onReply) {
      onReply();
      return;
    }
    if (replyCompose) {
      replyCompose.openReply(post);
      return;
    }
    router.push(`/post/${threadRootId}?replyTo=${post.id}`);
  };

  const confirmDelete = () => {
    void deletePost
      .mutateAsync(post.id)
      .then(() => {
        setDeleteOpen(false);
        onDeleted?.();
      })
      .catch((e) => {
        setDeleteOpen(false);
        setErrorDialog(formatUserError(e));
      });
  };

  const sharePostLink = () => {
    const url = getPostShareUrl(repostTargetId);
    void Share.share({ message: url, url });
  };

  const openRepostMenu = () => {
    if (ownPost || repostPending) return;
    const quotePost = () => repostCompose?.openQuote(post);
    const copyLink = { text: "Bağlantıyı paylaş", onPress: sharePostLink };
    if (reposted) {
      Alert.alert("Yeniden paylaş", undefined, [
        { text: "Yeniden paylaşımı geri al", style: "destructive", onPress: () => void toggleRepost() },
        { text: "Alıntıla", onPress: quotePost },
        copyLink,
        { text: "İptal", style: "cancel" },
      ]);
      return;
    }
    Alert.alert("Yeniden paylaş", undefined, [
      { text: "Yeniden paylaş", onPress: () => void toggleRepost() },
      { text: "Alıntıla", onPress: quotePost },
      copyLink,
      { text: "İptal", style: "cancel" },
    ]);
  };

  const saveEdit = async (content: string) => {
    setEditError("");
    try {
      await updatePost.mutateAsync({
        postId: post.id,
        content,
        mediaUrls: post.mediaUrls,
      });
      setEditOpen(false);
      onRefresh?.();
    } catch (e) {
      setEditError(formatUserError(e));
    }
  };

  return (
    <Pressable
      style={[styles.card, highlightReply && styles.cardHighlight]}
      onPress={openPost}
    >
      {isRepostCard ? (
        <View style={styles.repostRow}>
          <PostIcon name={PostIcons.repostActive} size={12} color={OrblyColors.repost} />
          <Text style={styles.repostLabel}>{post.author.displayName} yeniden paylaştı</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            router.push(`/profile/${post.author.username}`);
          }}
        >
          <UserAvatar name={post.author.displayName} uri={post.author.avatarUrl} size="md" />
        </Pressable>

        <View style={styles.body}>
          <View style={styles.headRow}>
            <Pressable
              style={styles.headNames}
              onPress={(e) => {
                e.stopPropagation?.();
                router.push(`/profile/${post.author.username}`);
              }}
            >
              <View style={styles.nameLine}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {post.author.displayName}
                </Text>
                {post.author.verified ? (
                  <View style={styles.verified}>
                    <PostIcon
                      name={PostIcons.verified}
                      size={15}
                      color={OrblyColors.accent}
                    />
                  </View>
                ) : null}
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                @{post.author.username} · {formatRelativeTime(post.createdAt)}
              </Text>
            </Pressable>
            <View style={styles.headActions}>
              {manageable ? (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setMenuOpen(true);
                  }}
                  hitSlop={12}
                  style={styles.menuBtn}
                >
                  <PostIcon
                    name={PostIcons.menu}
                    size={17}
                    color={OrblyColors.textSecondary}
                  />
                </Pressable>
              ) : null}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  void toggleBookmark();
                }}
                hitSlop={12}
              >
                <PostIcon
                  name={bookmarked ? PostIcons.bookmarkActive : PostIcons.bookmark}
                  size={17}
                  color={bookmarked ? OrblyColors.accent : OrblyColors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {post.liveBroadcastId ? (
            <Pressable
              style={styles.liveBadge}
              onPress={(e) => {
                e.stopPropagation?.();
                router.push(`/live/${post.liveBroadcastId}/ozet`);
              }}
            >
              <PostIcon name={PostIcons.live} size={12} color={OrblyColors.like} />
              <Text style={styles.liveBadgeText}>Yayın özetini gör</Text>
            </Pressable>
          ) : null}

          {post.orbit ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                router.push(`/orbits/${post.orbit!.slug}`);
              }}
            >
              <Text style={styles.orbit}>{post.orbit.name}</Text>
            </Pressable>
          ) : null}

          {replyingToUsername ? (
            <Text style={styles.replyingToLine}>
              Yanıtlanıyor{" "}
              <Text
                style={styles.replyingToUser}
                onPress={(e) => {
                  e.stopPropagation?.();
                  router.push(`/profile/${replyingToUsername}`);
                }}
              >
                @{replyingToUsername}
              </Text>
            </Text>
          ) : null}

          {post.content.trim() ? (
            <View style={styles.contentWrap}>
              <PostContent content={post.content} />
            </View>
          ) : null}

          {post.repostOf ? <RepostEmbed post={post.repostOf} onRefresh={onRefresh} /> : null}

          {!post.repostOf && post.poll ? (
            <View onStartShouldSetResponder={() => true}>
              <PollBlock postId={post.id} poll={post.poll} onVoted={onRefresh} />
            </View>
          ) : null}

          {!post.repostOf && post.mediaUrls.length > 0 ? (
            <View
              style={[styles.mediaWrap, post.mediaUrls.length >= 2 && styles.mediaWrapMulti]}
              onStartShouldSetResponder={() => true}
            >
              {post.mediaUrls.map((url) => (
                <Image
                  key={url}
                  source={{ uri: resolveMediaUrl(url) ?? url }}
                  style={[styles.media, post.mediaUrls.length >= 2 && styles.mediaHalf]}
                  contentFit="cover"
                />
              ))}
            </View>
          ) : null}

          <View style={styles.actions} onStartShouldSetResponder={() => true}>
            <PostActionButton
              name={PostIcons.reply}
              count={post.stats.replyCount}
              color={OrblyColors.reply}
              active={highlightReply}
              onPress={openReply}
            />
            <PostActionButton
              name={PostIcons.repost}
              activeName={PostIcons.repostActive}
              color={OrblyColors.repost}
              active={reposted}
              onPress={openRepostMenu}
              disabled={repostPending || ownPost}
            />
            {repostCount > 0 ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  setRepostersOpen(true);
                }}
                hitSlop={8}
                style={styles.repostCountBtn}
              >
                <Text style={[styles.actionCount, reposted && { color: OrblyColors.repost }]}>
                  {formatCount(repostCount)}
                </Text>
              </Pressable>
            ) : null}
            <PostActionButton
              name={PostIcons.like}
              activeName={PostIcons.likeActive}
              count={likeCount}
              color={OrblyColors.like}
              active={liked}
              onPress={() => void toggleLike()}
              disabled={likePending}
            />
            {repostTarget.stats.viewCount > 0 ? (
              <PostActionButton
                name={PostIcons.views}
                count={repostTarget.stats.viewCount}
                disabled
              />
            ) : null}
          </View>
        </View>
      </View>
      <PostOwnerMenuDialog
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />
      <ConfirmDialog
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Gönderiyi sil"
        message="Bu işlem geri alınamaz."
        confirmLabel="Sil"
        destructive
        loading={deletePost.isPending}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        visible={!!errorDialog}
        onClose={() => setErrorDialog(null)}
        title="Hata"
        message={errorDialog ?? ""}
        confirmLabel="Tamam"
        singleAction
        onConfirm={() => setErrorDialog(null)}
      />
      <RepostersModal
        postId={repostTargetId}
        visible={repostersOpen}
        onClose={() => setRepostersOpen(false)}
      />
      <EditPostModal
        post={post}
        visible={editOpen}
        saving={updatePost.isPending}
        error={editError}
        onClose={() => {
          setEditOpen(false);
          setEditError("");
        }}
        onSave={(content) => void saveEdit(content)}
      />
    </Pressable>
  );
}

export const PostCard = memo(PostCardInner, postCardPropsEqual);

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: OrblyColors.border,
  },
  cardHighlight: { backgroundColor: "rgba(29, 155, 240, 0.06)" },
  replyingToLine: {
    fontSize: 13,
    color: OrblyColors.textSecondary,
    marginTop: 2,
  },
  replyingToUser: { color: OrblyColors.accent, fontWeight: "600" },
  repostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    marginLeft: 52,
  },
  repostLabel: { color: OrblyColors.textSecondary, fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12 },
  body: { flex: 1, minWidth: 0 },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  headActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  menuBtn: { padding: 4 },
  headNames: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  displayName: {
    color: OrblyColors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
  },
  verified: { marginTop: 1 },
  meta: { color: OrblyColors.textSecondary, fontSize: 15, marginTop: 1 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(249,24,128,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  liveBadgeText: { color: OrblyColors.like, fontWeight: "700", fontSize: 13 },
  orbit: { color: OrblyColors.orbit, fontSize: 13, marginTop: 4, fontWeight: "600" },
  contentWrap: { marginTop: 4 },
  mediaWrap: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OrblyColors.border,
  },
  mediaWrapMulti: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  media: { width: "100%", height: 220 },
  mediaHalf: { width: "49.5%", height: 140 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: POST_ACTION_MAX_WIDTH,
    marginTop: 12,
    marginLeft: -8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    minWidth: 36,
  },
  actionCount: { color: OrblyColors.textSecondary, fontSize: 13 },
  repostCountBtn: { paddingVertical: 8, paddingRight: 4, marginLeft: -4 },
});

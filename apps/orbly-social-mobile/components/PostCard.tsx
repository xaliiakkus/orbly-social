import {
  canManagePost,
  getRepostDisplayCount,
  getRepostTargetId,
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

import {
  memo,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
} from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { EditPostModal } from "@/components/EditPostModal";

import { PostOwnerMenuDialog } from "@/components/PostOwnerMenuDialog";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import { useAuthStore } from "@/lib/auth-store";

import { ReplyComposeContext } from "@/lib/reply-compose-context";

import { RepostComposeContext } from "@/lib/repost-compose-context";

import { RepostEmbed } from "@/components/RepostEmbed";

import { RepostMenuSheet } from "@/components/post/RepostMenuSheet";

import { RepostersModal } from "@/components/RepostersModal";

import { PollBlock } from "@/components/PollBlock";

import { PostContent } from "@/components/ui/PostContent";

import { UserAvatar } from "@/components/ui/UserAvatar";

import { OrblyColors } from "@/constants/Colors";


import { formatCount, formatRelativeTime } from "@/lib/format";

import { resolveMediaUrl } from "@/lib/media-url";

import { useMobileSocketRooms } from "@/lib/use-socket-rooms";
import { createPostCardStyles, type PostCardStyles } from "@/components/post/post-card-styles";
import { useThemedStyles } from "@/lib/use-themed-styles";

const POST_ICON_SIZE = 18;

type IonName = ComponentProps<typeof Ionicons>["name"];

type ActionVariant = "reply" | "repost" | "like" | "bookmark" | "views";

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

  orbit: "sparkles",
} as const satisfies Record<string, IonName>;

function PostActionButton({
  name,

  activeName,

  count,

  color = OrblyColors.textSecondary,

  active,

  onPress,

  disabled,

  styles,
  variant = "reply",
}: {
  name: IonName;

  activeName?: IonName;

  count?: number;

  color?: string;

  active?: boolean;

  onPress?: () => void;

  disabled?: boolean;

  styles: PostCardStyles;
  variant?: ActionVariant;
}) {
  const iconColor = active ? color : OrblyColors.textSecondary;

  const iconName = active && activeName ? activeName : name;

  const wrapStyle = [
    styles.actionIconWrap,

    active && variant === "repost" && styles.actionIconWrapRepost,

    active && variant === "like" && styles.actionIconWrapLike,

    active && variant === "bookmark" && styles.actionIconWrapBookmark,
  ];

  return (
    <Pressable
      style={styles.actionBtn}
      onPress={onPress}
      hitSlop={6}
      disabled={disabled}
    >
      <View style={wrapStyle}>
        <Ionicons name={iconName} size={POST_ICON_SIZE} color={iconColor} />
      </View>

      {count !== undefined && count > 0 ? (
        <Text style={[styles.actionCount, active && { color }]}>
          {formatCount(count)}
        </Text>
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

  const [repostMenuOpen, setRepostMenuOpen] = useState(false);
  const styles = useThemedStyles(createPostCardStyles);

  const manageable = canManagePost(post, viewer?.id);

  const deletePost = useDeletePost();

  const updatePost = useUpdatePost();

  useMobileSocketRooms([postRoom(post.id)]);

  const {
    liked,
    count: likeCount,
    toggle: toggleLike,
    isPending: likePending,
  } = usePostLike(
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

  const postView = usePostView(
    repostTargetId,
    viewer?.id,
    repostTarget.author.id,
  );

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

  const openRepostMenu = () => {
    if (ownPost || repostPending) return;

    setRepostMenuOpen(true);
  };

  const openQuote = () => repostCompose?.openQuote(post);

  const viewEngagements = () => {
    if (repostCount > 0) {
      setRepostersOpen(true);

      return;
    }

    router.push(`/post/${threadRootId}`);
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
      <View style={styles.row}>
        <Pressable
          style={styles.avatarCol}
          onPress={(e) => {
            e.stopPropagation?.();

            router.push(`/profile/${post.author.username}`);
          }}
        >
          <UserAvatar
            name={post.author.displayName}
            uri={post.author.avatarUrl}
            size="md"
          />
        </Pressable>

        <View style={styles.body}>
          {isRepostCard ? (
            <View style={styles.repostRow}>
              <PostIcon
                name={PostIcons.repostActive}
                size={14}
                color={OrblyColors.repost}
              />

              <Text style={styles.repostLabel}>
                {post.author.displayName} yeniden paylaştı
              </Text>
            </View>
          ) : null}

          {post.liveBroadcastId ? (
            <Pressable
              style={styles.liveBadge}
              onPress={(e) => {
                e.stopPropagation?.();

                router.push(`/live/${post.liveBroadcastId}/ozet`);
              }}
            >
              <PostIcon
                name={PostIcons.live}
                size={14}
                color={OrblyColors.like}
              />

              <Text style={styles.liveBadgeText}>Yayın özetini gör</Text>
            </Pressable>
          ) : null}

          <View style={styles.headRow}>
            <Pressable
              style={styles.headNames}
              onPress={(e) => {
                e.stopPropagation?.();

                router.push(`/profile/${post.author.username}`);
              }}
            >
              <View style={styles.nameMetaRow}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {post.author.displayName}
                </Text>

                {post.author.verified ? (
                  <PostIcon
                    name={PostIcons.verified}
                    size={16}
                    color={OrblyColors.accent}
                  />
                ) : null}

                <Text style={styles.handle} numberOfLines={1}>
                  @{post.author.username}
                </Text>

                <Text style={styles.metaDot}>·</Text>

                <Text style={styles.metaTime}>
                  {formatRelativeTime(post.createdAt)}
                </Text>
              </View>
            </Pressable>

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
                  size={18}
                  color={OrblyColors.textSecondary}
                />
              </Pressable>
            ) : (
              <Pressable
                hitSlop={12}
                style={styles.menuBtn}
                onPress={(e) => e.stopPropagation?.()}
              >
                <PostIcon
                  name={PostIcons.menu}
                  size={18}
                  color={OrblyColors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          {post.orbit ? (
            <Pressable
              style={styles.orbitPill}
              onPress={(e) => {
                e.stopPropagation?.();

                router.push(`/orbits/${post.orbit!.slug}`);
              }}
            >
              <PostIcon
                name={PostIcons.orbit}
                size={12}
                color={OrblyColors.orbit}
              />

              <Text style={styles.orbitPillText}>{post.orbit.name}</Text>
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

          {post.repostOf ? (
            <View
              style={styles.embedWrap}
              onStartShouldSetResponder={() => true}
            >
              <RepostEmbed post={post.repostOf} onRefresh={onRefresh} />
            </View>
          ) : null}

          {!post.repostOf && post.poll ? (
            <View
              style={styles.blockSpacing}
              onStartShouldSetResponder={() => true}
            >
              <PollBlock
                postId={post.id}
                poll={post.poll}
                onVoted={onRefresh}
              />
            </View>
          ) : null}

          {!post.repostOf && post.mediaUrls.length > 0 ? (
            <View
              style={[
                styles.mediaWrap,

                post.mediaUrls.length === 1 && styles.mediaWrapSingle,

                post.mediaUrls.length >= 2 && styles.mediaWrapMulti,
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={[
                  styles.mediaGrid,
                  post.mediaUrls.length >= 2 && styles.mediaGridMulti,
                ]}
              >
                {post.mediaUrls.map((url, index) => (
                  <Image
                    key={url}
                    source={{ uri: resolveMediaUrl(url) ?? url }}
                    style={[
                      styles.media,

                      post.mediaUrls.length === 1 && styles.mediaSingle,

                      post.mediaUrls.length >= 2 && styles.mediaHalf,

                      post.mediaUrls.length === 3 &&
                        index === 0 &&
                        styles.mediaTripleLead,
                    ]}
                    contentFit="cover"
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.actions} onStartShouldSetResponder={() => true}>
            <PostActionButton styles={styles}
              name={PostIcons.reply}
              count={post.stats.replyCount}
              color={OrblyColors.reply}
              active={highlightReply}
              variant="reply"
              onPress={openReply}
            />

            <View style={styles.repostGroup}>
              <PostActionButton styles={styles}
                name={PostIcons.repost}
                activeName={PostIcons.repostActive}
                color={OrblyColors.repost}
                active={reposted}
                variant="repost"
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
                  <Text
                    style={[
                      styles.actionCount,
                      reposted && { color: OrblyColors.repost },
                    ]}
                  >
                    {formatCount(repostCount)}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <PostActionButton styles={styles}
              name={PostIcons.like}
              activeName={PostIcons.likeActive}
              count={likeCount}
              color={OrblyColors.like}
              active={liked}
              variant="like"
              onPress={() => void toggleLike()}
              disabled={likePending}
            />

            <PostActionButton styles={styles}
              name={PostIcons.bookmark}
              activeName={PostIcons.bookmarkActive}
              color={OrblyColors.accent}
              active={bookmarked}
              variant="bookmark"
              onPress={() => void toggleBookmark()}
            />

            {repostTarget.stats.viewCount > 0 ? (
              <PostActionButton styles={styles}
                name={PostIcons.views}
                count={repostTarget.stats.viewCount}
                variant="views"
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

      <RepostMenuSheet
        visible={repostMenuOpen}
        onClose={() => setRepostMenuOpen(false)}
        reposted={reposted}
        onRepost={() => void toggleRepost()}
        onUnrepost={() => void toggleRepost()}
        onQuote={openQuote}
        onViewEngagements={viewEngagements}
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


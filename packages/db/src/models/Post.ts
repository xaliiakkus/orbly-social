import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const PostSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 280 },
    mediaUrls: [{ type: String }],
    replyToId: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    repostOfId: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    orbitId: { type: Schema.Types.ObjectId, ref: "Orbit", default: null },
    hashtags: [{ type: String }],
    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    stats: {
      likeCount: { type: Number, default: 0 },
      replyCount: { type: Number, default: 0 },
      repostCount: { type: Number, default: 0 },
      bookmarkCount: { type: Number, default: 0 },
      viewCount: { type: Number, default: 0 },
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ orbitId: 1, createdAt: -1 });
PostSchema.index({ replyToId: 1 });
PostSchema.index({ hashtags: 1 });

export type IPost = InferSchemaType<typeof PostSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Post = getModel<IPost>("Post", PostSchema);

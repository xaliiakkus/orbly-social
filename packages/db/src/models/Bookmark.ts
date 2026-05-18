import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const BookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true },
);

BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
BookmarkSchema.index({ userId: 1, createdAt: -1 });

export type IBookmark = InferSchemaType<typeof BookmarkSchema> & { _id: Types.ObjectId };

export const Bookmark = getModel<IBookmark>("Bookmark", BookmarkSchema);

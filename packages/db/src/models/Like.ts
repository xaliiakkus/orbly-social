import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const LikeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true },
);

LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });

export type ILike = InferSchemaType<typeof LikeSchema> & { _id: Types.ObjectId };

export const Like = getModel<ILike>("Like", LikeSchema);

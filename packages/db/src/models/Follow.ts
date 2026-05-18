import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const FollowSchema = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    followingId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 });

export type IFollow = InferSchemaType<typeof FollowSchema> & { _id: Types.ObjectId };

export const Follow = getModel<IFollow>("Follow", FollowSchema);

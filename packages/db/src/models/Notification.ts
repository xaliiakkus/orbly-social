import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["like", "reply", "repost", "follow", "mention", "orbit_invite"],
      required: true,
    },
    postId: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export type INotification = InferSchemaType<typeof NotificationSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const Notification = getModel<INotification>("Notification", NotificationSchema);

import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const MessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    mediaUrls: [{ type: String }],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export type IMessage = InferSchemaType<typeof MessageSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const Message = getModel<IMessage>("Message", MessageSchema);

import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const ConversationSchema = new Schema(
  {
    participantIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      content: String,
      senderId: Schema.Types.ObjectId,
      createdAt: Date,
    },
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true },
);

ConversationSchema.index({ participantIds: 1 });

export type IConversation = InferSchemaType<typeof ConversationSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Conversation = getModel<IConversation>("Conversation", ConversationSchema);

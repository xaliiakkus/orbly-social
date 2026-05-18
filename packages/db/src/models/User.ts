import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 50,
    },
    displayName: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    bio: { type: String, maxlength: 160 },
    avatarUrl: { type: String },
    bannerUrl: { type: String },
    location: { type: String, maxlength: 100 },
    website: { type: String, maxlength: 255 },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isPrivate: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    onboarded: { type: Boolean, default: false },
    stats: {
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      postsCount: { type: Number, default: 0 },
    },
    orbitIds: [{ type: Schema.Types.ObjectId, ref: "Orbit" }],
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof UserSchema> & {
  _id: Types.ObjectId;
};

export const User = getModel<IUser>("User", UserSchema);

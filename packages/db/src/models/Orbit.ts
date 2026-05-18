import { Schema, type InferSchemaType, type Types } from "mongoose";
import { getModel } from "../lib/model.js";

const OrbitSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    iconUrl: { type: String },
    bannerUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    stats: {
      memberCount: { type: Number, default: 0 },
      postCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export type IOrbit = InferSchemaType<typeof OrbitSchema> & {
  _id: Types.ObjectId;
};

export const Orbit = getModel<IOrbit>("Orbit", OrbitSchema);

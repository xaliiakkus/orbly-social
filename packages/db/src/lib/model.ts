import mongoose, { type Model, type Schema } from "mongoose";

export function getModel<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) ?? mongoose.model<T>(name, schema);
}

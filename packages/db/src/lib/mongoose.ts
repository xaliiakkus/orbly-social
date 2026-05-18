import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

const globalCache = globalThis.mongooseConn ?? { conn: null, promise: null };
globalThis.mongooseConn = globalCache;

export async function connectDB(uri: string): Promise<typeof mongoose> {
  if (globalCache.conn) return globalCache.conn;

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(uri);
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

export async function disconnectDB(): Promise<void> {
  if (globalCache.conn) {
    await mongoose.disconnect();
    globalCache.conn = null;
    globalCache.promise = null;
  }
}

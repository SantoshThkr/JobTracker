import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach } from "vitest";

/**
 * Runs the file's tests against a throwaway in-memory MongoDB. The app's own
 * connectDB() connects to it through MONGODB_URI, so the code under test uses
 * the same connection path as in production.
 */
export function useTestDatabase() {
  let server: MongoMemoryServer;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    process.env.MONGODB_URI = server.getUri("jobtracker-test");
  });

  beforeEach(async () => {
    const { Application } = await import("@/lib/applications/model");
    const { default: connectDB } = await import("@/lib/db");
    await connectDB();
    await Application.deleteMany({});
    // Build indexes before each test so uniqueness is enforced from the first insert.
    await Application.syncIndexes();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    // connectDB caches the connection on globalThis; clear it for the next file.
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
    await server?.stop();
  });
}

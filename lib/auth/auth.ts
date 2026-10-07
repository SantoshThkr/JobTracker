import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

declare global {
  var authMongoClient: MongoClient | undefined;
}

function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }
  // One client per process, reused across hot reloads in development. The
  // driver connects lazily on the first query.
  global.authMongoClient ??= new MongoClient(uri);
  return global.authMongoClient;
}

const client = getMongoClient();

export const auth = betterAuth({
  database: mongodbAdapter(client.db(), {
    client
  }), // Use the MongoDB adapter with the database connection

  emailAndPassword: {
    enabled: true,
  },

  // Rate limiting is on in production by default (sign-in/sign-up: 3 requests
  // per 10 seconds per IP). The default in-memory store is per instance, which
  // a serverless deployment spreads across many instances; storing counters in
  // the database makes the limit hold across all of them.
  rateLimit: {
    storage: "database",
  },
});

/**
 * Centralized configuration file for the application.
 * Manages MongoDB client connection singleton and app-wide constants.
 */

import { MongoClient, ServerApiVersion, Db } from "mongodb";

// ============================================================================
// Environment Variables Validation
// ============================================================================

if (!process.env.MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in .env.local");
}

// ============================================================================
// MongoDB Client Singleton
// ============================================================================

const uri = process.env.MONGODB_URI;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so the connection
  // is not recreated on every hot reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Get the connected MongoDB client.
 * This is a singleton that persists across hot reloads in development.
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Get a database instance from the MongoDB client.
 * @param dbName - Optional database name (uses default from connection string if omitted)
 */
export async function getDatabase(dbName?: string): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * Initialize MongoDB connection and verify it works.
 * This should be called when the application starts.
 */
export async function initMongoDB() {
  try {
    const client = await clientPromise;
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
    return client;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    throw error;
  }
}

// ============================================================================
// Application Constants
// ============================================================================

export const APP_NAME = "Kitchen Ops";
export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Database collections
export const COLLECTIONS = {
  USERS: "users",
  STORES: "stores",
  INGREDIENT_ITEMS: "ingredient_items",
  WEEK_PLANS: "week_plans",
  CARTS: "carts",
  CART_ITEMS: "cart_items",
  RECIPES: "recipes",
} as const;

// Roles
export type Role = "admin" | "cook" | "volunteer";

export const ROLES = {
  ADMIN: "admin" as Role,
  COOK: "cook" as Role,
  VOLUNTEER: "volunteer" as Role,
} as const;

// JWT Secret
export const JWT_SECRET = process.env.JWT_SECRET;

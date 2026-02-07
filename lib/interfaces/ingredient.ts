import { ObjectId } from "mongodb";

/**
 * Ingredient document in MongoDB
 *
 * Represents items that cooks can add to their shopping carts.
 * Can be global (visibility: "global") or private to a specific cook (visibility: "private").
 */
export type IngredientRecord = {
  _id?: ObjectId;
  name: string;
  category: string; // e.g. "Spices (whole)", "Produce (veg & fruit)", "Dry goods & grains"
  defaultUnit: string; // e.g. "kg", "g", "pcs", "l", "ml"
  storeId?: ObjectId | null; // Reference to stores collection; null if not assigned
  notes?: string;

  // Visibility control
  visibility: "global" | "private";
  ownerUserId: ObjectId | null; // null for global; userId for private ingredients
  status: "active" | "pending"; // pending = awaiting admin approval for private ingredients

  // Silent inventory helpers (for Phase 3 — leave null for MVP)
  stockOnHand?: number | null;
  reorderThreshold?: number | null;

  // Metadata
  createdBy?: ObjectId; // userId who created this ingredient
  createdAt: Date;
};

/**
 * Visibility rule:
 * - Cooks see: visibility="global" OR (visibility="private" AND ownerUserId = self)
 * - Admin sees: all
 */

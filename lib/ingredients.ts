import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { IngredientRecord } from "@/lib/interfaces/ingredient";

/**
 * Get the ingredients collection from MongoDB
 */
export async function getIngredientsCollection() {
  const client = await clientPromise;
  return client.db("fmb").collection<IngredientRecord>("ingredients");
}

/**
 * Get the stores collection from MongoDB
 */
export async function getStoresCollection() {
  const client = await clientPromise;
  return client.db("fmb").collection("stores");
}

/**
 * Get all ingredients visible to a user (cook)
 *
 * Rules:
 * - Global ingredients (visibility="global")
 * - User's own private ingredients (visibility="private" AND ownerUserId=userId)
 *
 * @param userId - The cook's user ID (can be null for viewing only global)
 * @returns Array of IngredientRecord
 */
export async function getIngredientsByVisibility(userId?: ObjectId | null) {
  const ingredients = await getIngredientsCollection();

  if (!userId) {
    return ingredients.find({ visibility: "global" }).toArray();
  }

  return ingredients
    .find({
      $or: [
        { visibility: "global" as const },
        { visibility: "private" as const, ownerUserId: userId },
      ],
    } as any)
    .toArray();
}

/**
 * Search ingredients by name (for cook ingredient picker)
 *
 * Rules: same visibility as getIngredientsByVisibility
 *
 * @param searchQuery - Text to search in ingredient names
 * @param userId - The cook's user ID (optional)
 * @returns Array of matching IngredientRecord
 */
export async function searchIngredients(
  searchQuery: string,
  userId?: ObjectId | null
) {
  const ingredients = await getIngredientsCollection();

  const nameFilter = { $regex: searchQuery, $options: "i" as const };

  if (!userId) {
    return ingredients
      .find({ visibility: "global", name: nameFilter })
      .sort({ name: 1 })
      .toArray();
  }

  return ingredients
    .find({
      name: nameFilter,
      $or: [
        { visibility: "global" as const },
        { visibility: "private" as const, ownerUserId: userId },
      ],
    } as any)
    .sort({ name: 1 })
    .toArray();
}

/**
 * Get all ingredients grouped by category
 * Useful for UI that shows ingredients organized by category
 *
 * @param userId - The cook's user ID (optional)
 * @returns Map of category → ingredients[]
 */
export async function getIngredientsByCategory(userId?: ObjectId | null) {
  const ingredients = await getIngredientsByVisibility(userId);

  const grouped: Record<string, IngredientRecord[]> = {};
  ingredients.forEach((ing) => {
    const category = ing.category || "Uncategorized";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(ing);
  });

  // Sort categories alphabetically, ingredients within each category by name
  Object.keys(grouped).forEach((category) => {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));
  });

  return grouped;
}

/**
 * Get a single ingredient by ID
 *
 * @param ingredientId - MongoDB ObjectId of the ingredient
 * @returns IngredientRecord or null
 */
export async function getIngredientById(ingredientId: ObjectId | string) {
  const ingredients = await getIngredientsCollection();
  const id = typeof ingredientId === "string" ? new ObjectId(ingredientId) : ingredientId;
  return ingredients.findOne({ _id: id });
}

/**
 * Add a new private ingredient (created by a cook)
 *
 * @param ingredient - Partial ingredient data (without _id, createdAt, createdBy)
 * @param userId - The cook's user ID
 * @returns The inserted ingredient with _id
 */
export async function addPrivateIngredient(
  ingredient: Omit<IngredientRecord, "_id" | "createdAt" | "createdBy">,
  userId: ObjectId
) {
  const ingredients = await getIngredientsCollection();

  const newIngredient: IngredientRecord = {
    ...ingredient,
    visibility: "private",
    ownerUserId: userId,
    status: "pending", // Awaiting admin approval
    createdBy: userId,
    createdAt: new Date(),
  };

  const result = await ingredients.insertOne(newIngredient);

  return {
    ...newIngredient,
    _id: result.insertedId,
  };
}

/**
 * Get all pending ingredients awaiting admin approval
 * (Admin view)
 *
 * @returns Array of pending private ingredients
 */
export async function getPendingIngredients() {
  const ingredients = await getIngredientsCollection();
  return ingredients
    .find({
      visibility: "private",
      status: "pending",
    })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Approve a private ingredient and make it global
 * (Admin only)
 *
 * @param ingredientId - The ingredient to approve
 * @returns Updated ingredient record or null if not found
 */
export async function approvePrivateIngredient(ingredientId: ObjectId | string) {
  const ingredients = await getIngredientsCollection();
  const id = typeof ingredientId === "string" ? new ObjectId(ingredientId) : ingredientId;

  const result = await ingredients.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        visibility: "global" as const,
        ownerUserId: null,
        status: "active" as const,
      },
    },
    { returnDocument: "after" }
  );

  return result || null;
}

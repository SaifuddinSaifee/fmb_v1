# Cook Phase: Simple & Clean APIs

## Overview

All TypeScript errors fixed. APIs are centralized in `lib/ingredients.ts` and designed to be **simple, focused, and easy to use** without over-complication.

---

## API Reference

### Collection Access (Low-level)

```typescript
// Get ingredients collection
const col = await getIngredientsCollection();

// Get stores collection  
const stores = await getStoresCollection();
```

Use these only if you need direct MongoDB access. Usually not needed.

---

### Read APIs (Most Common)

#### **getIngredientsByVisibility(userId?)**
Get all ingredients visible to a user (respects private/global rules).

```typescript
// For a cook
const userIngredients = await getIngredientsByVisibility(cookId);

// Global only (no user context)
const globalOnly = await getIngredientsByVisibility();
```

**Returns:** `IngredientRecord[]`

**Visibility rules:**
- Without userId: global ingredients only
- With userId: global + user's own private pending ingredients

---

#### **searchIngredients(query, userId?)**
Search ingredients by name with same visibility rules as `getIngredientsByVisibility`.

```typescript
// Search with user context
const results = await searchIngredients("rice", cookId);

// Search global only
const global = await searchIngredients("rice");
```

**Returns:** `IngredientRecord[]` (sorted by name)

---

#### **getIngredientsByCategory(userId?)**
Get all ingredients grouped by category. Perfect for UI displays.

```typescript
const grouped = await getIngredientsByCategory(cookId);
// Returns: { "Spices (whole)": [...], "Produce (veg & fruit)": [...] }

// Iterate categories
Object.entries(grouped).forEach(([category, items]) => {
  console.log(`${category}: ${items.length} items`);
});
```

**Returns:** `Record<string, IngredientRecord[]>` (categories sorted, items sorted by name within each)

---

#### **getIngredientById(id)**
Get a single ingredient by its MongoDB ObjectId.

```typescript
const ing = await getIngredientById("507f1f77bcf86cd799439011");
// or
const ing = await getIngredientById(new ObjectId("507f1f77bcf86cd799439011"));
```

**Returns:** `IngredientRecord | null`

---

### Write APIs

#### **addPrivateIngredient(ingredient, userId)**
Cook creates a new "missing ingredient" (pending approval).

```typescript
const newIng = await addPrivateIngredient(
  {
    name: "Turmeric root",
    category: "Spices (whole)",
    defaultUnit: "g",
    storeId: null,
    notes: "Fresh preferred",
    status: "pending", // Always pending for cook additions
    visibility: "private", // Always private for cook additions
  },
  cookId
);

// Returns: { _id, name, ..., createdAt, createdBy, ... }
```

**Returns:** `IngredientRecord` with `_id` set

---

### Admin APIs

#### **getPendingIngredients()**
Get all pending ingredients awaiting admin approval.

```typescript
const pending = await getPendingIngredients();
// Returns only items with visibility="private" AND status="pending"
```

**Returns:** `IngredientRecord[]` (newest first)

---

#### **approvePrivateIngredient(id)**
Convert a pending private ingredient to global (visible to all cooks).

```typescript
const approved = await approvePrivateIngredient("507f1f77bcf86cd799439011");
// Sets: visibility="global", ownerUserId=null, status="active"
```

**Returns:** `IngredientRecord | null` (null if ingredient not found)

---

## UI Component

### **IngredientPicker**
Mobile-first ingredient selector for cooks adding items to cart.

```tsx
import { IngredientPicker } from "@/components/ui/ingredient-picker";

function CartBuilder() {
  const [ingredients, setIngredients] = useState([]);

  const handleSelect = (ing) => {
    // Add to cart, open qty modal, etc.
  };

  const handleAddMissing = () => {
    // Open "create missing ingredient" form
  };

  return (
    <IngredientPicker
      ingredients={ingredients}
      onSelect={handleSelect}
      onAddMissing={handleAddMissing}
      groupByCategory={true}
    />
  );
}
```

**Props:**
- `ingredients: IngredientRecord[]` — list to display
- `onSelect: (ing) => void` — when user taps an ingredient
- `onAddMissing?: () => void` — "Add Missing" button callback
- `placeholder?: string` — search box placeholder
- `isLoading?: boolean` — show spinner
- `disabled?: boolean` — disable all interactions
- `groupByCategory?: boolean` — show category tabs (default: true)

---

## Why This Design is Simple

✅ **Centralized:** All logic in one file (`lib/ingredients.ts`)
✅ **Clear naming:** Functions say exactly what they do
✅ **No overloading:** Each function does one thing
✅ **Visibility built-in:** Private/pending logic handled transparently
✅ **Mobile first:** UI component assumes touch and readability
✅ **Silent fields:** Ready for future features without API changes (stockOnHand, reorderThreshold, quantityToBuy)

---

## Common Usage Patterns

### Cook adding items to cart
```typescript
// 1. Search ingredients
const results = await searchIngredients("rice", cookId);

// 2. User selects one from UI
const selected = results[0];

// 3. Admin creates cart with selected ingredient
// (cart is separate collection - coming next phase)
```

### Cook adds missing ingredient
```typescript
// User fills form: name, category, unit
const missing = await addPrivateIngredient(
  {
    name: formData.name,
    category: formData.category,
    defaultUnit: formData.unit,
    storeId: null,
    notes: formData.notes,
    status: "pending",
    visibility: "private",
  },
  cookId
);

// Shows in cook's ingredient list immediately
// Shows in admin's pending list
```

### Admin approves pending ingredient
```typescript
// Get pending list
const pending = await getPendingIngredients();

// Admin edits if needed, then approves
const approved = await approvePrivateIngredient(pending[0]._id);

// Now all cooks can see it globally
```

---

## Next Phase: Carts

Carts will use these ingredients APIs to:
1. Search/select ingredients (use `searchIngredients`)
2. Add to cart with quantity (create `cart_items` collection)
3. Track requests vs. approved quantities
4. Generate final shopping list

**No changes needed to ingredients APIs.** They're stable and ready.

---

**All TypeScript errors resolved. APIs ready for cart phase.**

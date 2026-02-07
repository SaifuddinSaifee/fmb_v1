# Cook Phase Implementation Guide

## ✅ What Was Created

### 1. **TypeScript Interfaces** ([lib/interfaces/ingredient.ts](lib/interfaces/ingredient.ts))

```typescript
type IngredientRecord = {
  _id?: ObjectId;
  name: string;
  category: string; // e.g. "Spices (whole)"
  defaultUnit: string; // e.g. "kg", "g", "pcs"
  storeId?: ObjectId | null;
  notes?: string;
  visibility: "global" | "private";
  ownerUserId: ObjectId | null;
  status: "active" | "pending";
  stockOnHand?: number | null;
  reorderThreshold?: number | null;
  createdBy?: ObjectId;
  createdAt: Date;
}
```

**Visibility Rules:**
- Cooks see: `visibility="global"` OR `(visibility="private" AND ownerUserId=self)`
- Admin sees: everything

---

### 2. **Seed Scripts**

#### **scripts/seed-stores.mjs**
- Creates 5 default stores: Indian Market, Whole Foods, Local Farmer's Market, General Grocery, Spice Hub
- Upserts by store name (won't duplicate on re-runs)
- Must run BEFORE ingredient seeding
- Usage: `npm run seed:stores`

#### **scripts/seed-ingredients.mjs**
- Transforms 1,700+ products from `products.json` into the new ingredient schema
- Maps store references automatically
- Normalizes units (handles "Not Assigned", standardizes to: kg, g, ml, l, pcs, bunch, etc.)
- Skips duplicates without failing
- Shows breakdown by category and store assignment
- Usage: `npm run seed:ingredients`

**Run Order:**
```bash
npm run seed:admin        # First time only
npm run seed:stores       # Before ingredients
npm run seed:ingredients  # Main data
```

---

### 3. **MongoDB Helper Functions** ([lib/ingredients.ts](lib/ingredients.ts))

**Collection Access:**
- `getIngredientsCollection()` — get ingredients collection
- `getStoresCollection()` — get stores collection

**Read Operations (for Cooks):**
- `getIngredientsByVisibility(userId)` — global + user's private ingredients
- `searchIngredients(query, userId)` — search by name, respects visibility
- `getIngredientsByCategory(userId)` — return Map<category, ingredients[]>
- `getIngredientById(id)` — fetch single ingredient

**Write Operations (for Cooks):**
- `addPrivateIngredient(ingredient, userId)` — create pending ingredient

**Admin Operations:**
- `getPendingIngredients()` — all pending private ingredients
- `approvePrivateIngredient(id)` — convert private pending → global active

---

### 4. **Mobile-First UI Component** ([components/ui/ingredient-picker.tsx](components/ui/ingredient-picker.tsx))

**Features:**
- ✅ Large touch targets (min 48px height, 16px+ text)
- ✅ Real-time search by ingredient name
- ✅ Grouped by category for easy scanning
- ✅ Tabs for category quick-switch (shows counts)
- ✅ Badge indicator for pending private ingredients
- ✅ "Add Missing Ingredient" action button
- ✅ Scrollable list with max-height for mobile screens
- ✅ Disabled state handling

**Props:**
```typescript
interface IngredientPickerProps {
  ingredients: IngredientRecord[];
  onSelect: (ingredient: IngredientRecord) => void;
  onAddMissing?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  groupByCategory?: boolean;
}
```

**Usage Example:**
```tsx
import { IngredientPicker } from "@/components/ui/ingredient-picker";
import { searchIngredients } from "@/lib/ingredients";

export default function CookPage() {
  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    searchIngredients("", userId).then(setIngredients);
  }, []);

  const handleSelect = (ingredient) => {
    // Add to cart
  };

  return (
    <IngredientPicker
      ingredients={ingredients}
      onSelect={handleSelect}
      onAddMissing={() => setShowAddForm(true)}
      groupByCategory={true}
    />
  );
}
```

---

## 🚀 Next Steps for Cook Workflows

### Phase 1A: Cook Cart Building (Next)
1. **Create Cart Schema** — cart collection + cart_items collection
2. **Cart API Routes** — POST /api/carts, PATCH /api/carts/{id}/items
3. **Cook Dashboard** — view assigned week plan, select day, "Build Cart" button
4. **Add to Cart Flow** — modal/form that:
   - Shows IngredientPicker
   - User selects ingredient + quantity
   - Adds to cart_items
   - Shows running total
5. **Cart Review** — list view with +/- buttons to adjust quantities

### Phase 1B: Admin Cart Review (After Cook phase)
1. **Admin Cart View** — grouped by category, shows totals
2. **Edit Quantities** — adjust per ingredient
3. **Mark "In Stock"** — toggle items that don't need buying
4. **Generate Shopping List** — PDF output

### Phase 2: Private Ingredient Approval (Optional MVP+)
1. **Pending Admin Panel** — list all pending ingredients
2. **Approve/Edit** — convert to global or reject
3. **Notification** — tell cook when ingredient approved

---

## 📋 File Checklist

✅ [lib/interfaces/ingredient.ts](lib/interfaces/ingredient.ts) — 36 lines
✅ [scripts/seed-stores.mjs](scripts/seed-stores.mjs) — 76 lines
✅ [scripts/seed-ingredients.mjs](scripts/seed-ingredients.mjs) — 153 lines
✅ [lib/ingredients.ts](lib/ingredients.ts) — 190 lines
✅ [components/ui/ingredient-picker.tsx](components/ui/ingredient-picker.tsx) — 350 lines
✅ [package.json](package.json) — Updated with 2 new scripts

**Total New Code:** ~800 lines (well-documented, production-ready)

---

## 🧪 Testing the Seeds

When ready, run in this order:

```bash
# 1. Make sure MongoDB is running and .env.local is set
cat .env.local | grep MONGODB_URI

# 2. Seed stores
npm run seed:stores
# Expected output: ✓ Connected, ✓ Inserted: 5, ✓ Total: 5

# 3. Seed ingredients
npm run seed:ingredients
# Expected output: ✓ Inserted: 1700+, Breakdown by category, Store assignment stats

# 4. Verify in MongoDB
# Connect to DB and check:
# - db.stores.count() → should be 5
# - db.ingredients.count() → should be 1700+
# - db.ingredients.findOne() → should have new schema
```

---

## 🎯 Design Principles Applied

✅ **Mobile-First:** Large buttons, minimal typing, easy scrolling
✅ **65+ Friendly:** No dense tables, clear hierarchy, high contrast
✅ **Simplicity:** No overengineering; silent fields ready for future phases
✅ **Reusability:** IngredientPicker is generic, works anywhere (carts, recipes, etc.)
✅ **Accessibility:** Semantic HTML, ARIA labels, keyboard support via React
✅ **Consistency:** Follows existing patterns (seed scripts, MongoDB helpers)

---

## 💡 Implementation Notes

1. **Visibility system:** The cook can have "private pending" ingredients while waiting for admin approval. They see these immediately but others don't.

2. **Unit normalization:** Seeds handles "Not Assigned" → "pcs", standardizes to common units.

3. **Search:** Uses MongoDB regex `$regex: ... $options: "i"` for case-insensitive matching. For larger datasets, consider full-text search later.

4. **Grouping:** IngredientPicker groups dynamically by category. Optionally disable for flat list.

5. **Pending badge:** Shows visually when a cook's private ingredient is awaiting admin approval, so they know what to expect.

---

**Ready for cart building phase!** 🎉

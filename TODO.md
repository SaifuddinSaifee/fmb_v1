# FMB v1 — Project TODO & Progress Tracker

**Last Updated:** February 8, 2026  
**Current Phase:** Cook Phase — Ingredients Foundation  
**Status:** On track

---

## 📊 Quick Stats

| Phase | Status | Progress |
|-------|--------|----------|
| **Phase 0: Foundations** | 🟢 MOSTLY DONE | 80% |
| **Phase 1A: Cook Cart Building** | ⚪ NOT STARTED | 0% |
| **Phase 1B: Admin Cart Review** | ⚪ NOT STARTED | 0% |
| **Phase 2: Nice-to-Have** | ⚪ NOT STARTED | 0% |
| **Phase 3: Inventory (Optional)** | ⚪ NOT STARTED | 0% |

---

## 🟢 Phase 0 — Foundations (80% DONE)

### Auth + Roles
- [x] Admin login page ([app/login/page.tsx](app/login/page.tsx))
- [x] Cook login page ([app/login/page.tsx](app/login/page.tsx))
- [x] JWT token generation & validation ([lib/auth.ts](lib/auth.ts))
- [x] Role-based middleware ([middleware.ts](middleware.ts))
  - [x] Admin access control
  - [x] Cook access control
  - [x] Volunteer access control
- [x] Login API route ([app/api/auth/login/route.ts](app/api/auth/login/route.ts))
- [x] Logout API route ([app/api/auth/logout/route.ts](app/api/auth/logout/route.ts))
- [x] Me API route ([app/api/auth/me/route.ts](app/api/auth/me/route.ts))
- [x] Admin seed script ([scripts/seed-admin.mjs](scripts/seed-admin.mjs))
- [x] Password hashing with bcryptjs ([lib/auth.ts](lib/auth.ts))

### Ingredients Seeding & APIs ✅ JUST COMPLETED
- [x] Ingredient TypeScript interface ([lib/interfaces/ingredient.ts](lib/interfaces/ingredient.ts))
- [x] Store seed script ([scripts/seed-stores.mjs](scripts/seed-stores.mjs)) — 5 default stores
- [x] Ingredient seed script ([scripts/seed-ingredients.mjs](scripts/seed-ingredients.mjs)) — 1,700+ products → ingredients
- [x] MongoDB ingredient helpers ([lib/ingredients.ts](lib/ingredients.ts))
  - [x] `getIngredientsByVisibility(userId)` — global + private
  - [x] `searchIngredients(query, userId)` — case-insensitive search
  - [x] `getIngredientsByCategory(userId)` — grouped by category
  - [x] `getIngredientById(id)` — fetch single
  - [x] `addPrivateIngredient(ing, userId)` — cook creates pending
  - [x] `getPendingIngredients()` — admin view pending
  - [x] `approvePrivateIngredient(id)` — admin approves → global
- [x] Mobile-first IngredientPicker component ([components/ui/ingredient-picker.tsx](components/ui/ingredient-picker.tsx))
  - [x] Search with category tabs
  - [x] Pending badge for private ingredients
  - [x] "Add Missing Ingredient" button
  - [x] Large touch targets (48px+ buttons)
  - [x] Scrollable list for mobile

### Infrastructure
- [x] MongoDB connection pooling ([lib/mongodb.ts](lib/mongodb.ts))
- [x] TypeScript config ([tsconfig.json](tsconfig.json))
- [x] Environment setup (.env.local)
- [x] UI component library (shadcn/ui via Radix + Tailwind)
- [x] ESLint config ([eslint.config.mjs](eslint.config.mjs))

### Remaining Phase 0 Tasks
- [ ] Admin dashboard stub ([app/admin/page.tsx](app/admin/page.tsx))
- [ ] Cook dashboard stub ([app/cook/page.tsx](app/cook/page.tsx))
- [ ] Volunteer dashboard stub ([app/volunteer/page.tsx](app/volunteer/page.tsx))
- [ ] Verify all seed scripts run successfully
  - [ ] `npm run seed:admin` → creates test admin
  - [ ] `npm run seed:stores` → creates 5 stores
  - [ ] `npm run seed:ingredients` → creates 1,700+ ingredients

---

## ⚪ Phase 1A — Cook Cart Building (MVP CORE FEATURE)

### Data Models
- [ ] Create `week_plans` MongoDB schema
  ```js
  {
    _id, weekStartDate, createdByAdminId, assignedCookId,
    days: [{ date, isClosed, headcount, menuItems }],
    notes, createdAt
  }
  ```
- [ ] Create `carts` MongoDB schema
  ```js
  { _id, weekPlanId, cookId, status: "draft"|"submitted"|"finalized", createdAt, updatedAt }
  ```
- [ ] Create `cart_items` MongoDB schema
  ```js
  {
    _id, cartId, ingredientId, nameSnapshot, categorySnapshot, storeIdSnapshot,
    quantityRequested, unit, quantityToBuy (silent), addedByUserId, createdAt
  }
  ```
- [ ] Create TypeScript interfaces ([lib/interfaces/cart.ts](lib/interfaces/cart.ts))
  - [ ] `WeekPlanRecord`
  - [ ] `CartRecord`
  - [ ] `CartItemRecord`

### MongoDB Helpers
- [ ] Cart helper functions ([lib/carts.ts](lib/carts.ts))
  - [ ] `getCartById(cartId)` — fetch cart with all items populated
  - [ ] `createCart(weekPlanId, cookId)` — create new cart
  - [ ] `addItemToCart(cartId, ingredientId, quantity, unit)`
  - [ ] `removeItemFromCart(cartId, cartItemId)`
  - [ ] `updateCartItemQuantity(cartItemId, newQuantity)`
  - [ ] `submitCart(cartId)` — lock for admin review
  - [ ] `getCookCarts(cookId)` — list all carts for a cook

- [ ] Week Plan helper functions ([lib/week-plans.ts](lib/week-plans.ts))
  - [ ] `getWeekPlanById(weekPlanId)`
  - [ ] `getCookAssignedWeekPlan(cookId)` — current week for cook
  - [ ] `createWeekPlan(data)` — admin creates new week
  - [ ] `updateWeekPlan(weekPlanId, data)`
  - [ ] `listAllWeekPlans()` — admin view all weeks

### API Routes
- [ ] `POST /api/carts` — create new cart
- [ ] `GET /api/carts/:cartId` — fetch cart with items
- [ ] `GET /api/carts/cook/:cookId` — list carts for cook
- [ ] `POST /api/carts/:cartId/items` — add item to cart
- [ ] `PATCH /api/carts/:cartId/items/:itemId` — update item quantity
- [ ] `DELETE /api/carts/:cartId/items/:itemId` — remove item
- [ ] `PATCH /api/carts/:cartId/submit` — submit cart to admin
- [ ] `GET /api/week-plans/cook/:cookId` — get assigned week for cook
- [ ] `GET /api/week-plans/:weekPlanId` — get week details
- [ ] `POST /api/week-plans` — admin creates week (requires auth)
- [ ] `PATCH /api/week-plans/:weekPlanId` — admin edits week

### UI Components
- [ ] Cook dashboard page ([app/cook/page.tsx](app/cook/page.tsx))
  - [ ] Show assigned week plan
  - [ ] Day selector (Mon-Sun)
  - [ ] Menu items + headcount display
  - [ ] "Build Cart" button

- [ ] Cart builder page ([app/cook/cart/[cartId]/page.tsx](app/cook/cart/%5BcartId%5D/page.tsx))
  - [ ] IngredientPicker component (already built)
  - [ ] Quantity input (big + / - buttons for seniors)
  - [ ] Add to cart button
  - [ ] Cart items list (grouped by category)
  - [ ] Running total display
  - [ ] "Add Missing Ingredient" modal
  - [ ] Submit cart button

- [ ] Add missing ingredient form ([components/ui/add-missing-ingredient-form.tsx](components/ui/add-missing-ingredient-form.tsx))
  - [ ] Text input for ingredient name (big)
  - [ ] Category dropdown (big)
  - [ ] Unit dropdown (big)
  - [ ] Optional notes
  - [ ] Submit button (creates pending ingredient)

- [ ] Cart items list component ([components/ui/cart-items-list.tsx](components/ui/cart-items-list.tsx))
  - [ ] Show ingredient name + quantity + unit
  - [ ] Group by category
  - [ ] +/- buttons to adjust quantity
  - [ ] Delete item button
  - [ ] Running total at bottom

### Mobile-First Considerations
- [ ] Test on actual mobile device (iOS/Android)
- [ ] Ensure buttons are 48px+ height
- [ ] Font size 16px+ for readability
- [ ] No typing required (use dropdowns, qty buttons instead)
- [ ] Vertical layout (no horizontal scrolling)

---

## ⚪ Phase 1B — Admin Cart Review (COMPLETES MVP LOOP)

### Data Models
- [ ] Add to `carts`: `quantityApproved`, `notes` fields
- [ ] Add to `cart_items`: `quantityToBuy` field (computed by admin)

### MongoDB Helpers
- [ ] Cart review helpers ([lib/carts.ts](lib/carts.ts))
  - [ ] `getCartsByWeekPlan(weekPlanId)` — all carts for a week
  - [ ] `getAllSubmittedCarts()` — admin queue of carts to review
  - [ ] `updateCartItemApprovedQuantity(cartItemId, qty)`
  - [ ] `markItemAsInStock(cartItemId)` — don't need to buy
  - [ ] `finalizeCart(cartId)` — lock cart, generate shopping list

### API Routes
- [ ] `GET /api/admin/carts` — list all submitted carts
- [ ] `GET /api/admin/carts/:cartId` — view cart with all items for review
- [ ] `PATCH /api/admin/carts/:cartId/items/:itemId` — approve quantity
- [ ] `PATCH /api/admin/carts/:cartId/finalize` — finalize cart & generate list

### UI Components
- [ ] Admin cart review page ([app/admin/carts/page.tsx](app/admin/carts/page.tsx))
  - [ ] List all submitted carts (by week)
  - [ ] Show cook name, week dates, item count
  - [ ] Link to review each cart

- [ ] Cart review detail page ([app/admin/carts/[cartId]/page.tsx](app/admin/carts/%5BcartId%5D/page.tsx))
  - [ ] Show all items grouped by category
  - [ ] Each item shows: name, quantity requested, unit, category, store
  - [ ] Input to adjust approved quantity
  - [ ] Checkbox to mark "in stock" (exclude from shopping list)
  - [ ] "Finalize Cart" button
  - [ ] "Generate Shopping List" button

### PDF Generation
- [ ] Shopping list PDF template ([lib/pdf-generator.ts](lib/pdf-generator.ts))
  - [ ] Use Playwright/Puppeteer or similar
  - [ ] Layout: grouped by category
  - [ ] Show: item name, final qty, unit, store location
  - [ ] Header: week dates, cook name
  - [ ] Footer: total items, date printed
  - [ ] Mobile-friendly font sizes

- [ ] PDF API route (`GET /api/admin/carts/:cartId/pdf`)
  - [ ] Generate PDF buffer
  - [ ] Return as downloadable file

- [ ] Download button in cart review UI

---

## ⚪ Phase 2 — Nice-to-Have (AFTER MVP)

### Private Ingredient Approval
- [ ] Admin pending ingredients page ([app/admin/pending-ingredients/page.tsx](app/admin/pending-ingredients/page.tsx))
  - [ ] List all pending private ingredients
  - [ ] Show: name, category, unit, cook who added
  - [ ] Edit form to adjust before approving
  - [ ] Approve button → converts to global
  - [ ] Reject button (optional)

- [ ] `GET /api/admin/pending-ingredients` — list pending
- [ ] `PATCH /api/admin/pending-ingredients/:id/approve` — approve with optional edits
- [ ] `DELETE /api/admin/pending-ingredients/:id` — reject

### Recipe Creation (Optional)
- [ ] Create `recipes` MongoDB schema
  ```js
  {
    _id, name, serves, ingredients: [{ ingredientId, quantity, unit, notes }],
    createdBy, createdAt
  }
  ```
- [ ] Recipe CRUD API routes
- [ ] Recipe admin page
- [ ] "Use recipe in cart" quick-add button (pre-fill ingredients)

### Enhanced Week Planning
- [ ] Link `week_plans.menuItems` to actual `recipes` (not just strings)
- [ ] Suggest ingredients from recipes when building cart
- [ ] Show full recipe details in week plan view

---

## ⚪ Phase 3 — Inventory Management (OPTIONAL / FUTURE)

### Inventory Tracking
- [ ] Add to `ingredients`: `stockOnHand`, `reorderThreshold` fields
- [ ] Create `inventory_logs` collection for audit trail
- [ ] Admin page to update stock levels

### Smart Recommendations
- [ ] Compute `quantityToBuy = max(requested - stock, 0)` in cart review
- [ ] Auto-flag low-stock items
- [ ] Suggest quantities based on stock

### API Routes
- [ ] `PATCH /api/admin/ingredients/:id/stock` — update stock
- [ ] `GET /api/admin/inventory/low-stock` — items below threshold

---

## 🔄 Cross-Cutting Concerns

### Error Handling
- [ ] Standardized API error responses
- [ ] User-friendly error messages (no MongoDB dumps)
- [ ] Proper HTTP status codes (400, 404, 500, etc.)

### Validation & Security
- [ ] Input validation (Zod schemas)
- [ ] Role-based authorization on all API routes
- [ ] Prevent cooks from accessing other cooks' carts
- [ ] Prevent unauthorized ingredient edits

### Testing
- [ ] Unit tests for helpers
- [ ] Integration tests for API routes
- [ ] Manual mobile testing on iOS/Android

### Documentation
- [x] [COOK_API_REFERENCE.md](COOK_API_REFERENCE.md) — ingredient APIs
- [ ] [CART_API_REFERENCE.md](CART_API_REFERENCE.md) — cart APIs (TODO)
- [ ] [ADMIN_API_REFERENCE.md](ADMIN_API_REFERENCE.md) — admin APIs (TODO)
- [ ] [SETUP.md](SETUP.md) — how to run seeds & dev server (TODO)

### Deployment Readiness
- [ ] Environment variables documented
- [ ] Database indexes optimized
- [ ] Build passes without warnings
- [ ] Error logging setup

---

## 📅 Implementation Order (Recommended)

**Week 1:**
1. ✅ Phase 0: Ingredients (DONE)
2. Phase 1A: Cart data models + helpers
3. Phase 1A: Cart API routes + cook pages

**Week 2:**
4. Phase 1A: Cart UI components (ingredient picker already done)
5. Phase 1B: Admin cart review helpers + APIs
6. Phase 1B: Admin review UI pages

**Week 3:**
7. Phase 1B: PDF generation
8. Full end-to-end testing (seed → cook adds → admin reviews → PDF)
9. Mobile device testing

**Week 4+:**
10. Phase 2 features (as desired)
11. Phase 3 inventory (if needed)
12. Deployment prep

---

## 📝 Notes & Decisions

- **Silent fields:** `stockOnHand`, `reorderThreshold`, `quantityToBuy` are nullable and ignored in MVP. They're ready for Phase 3 without schema migration.

- **Visibility system:** Private pending ingredients are automatic when cooks add missing items. No extra complexity.

- **Cart snapshots:** `cart_items` stores snapshots of ingredient name/category/store at time of adding. Safe if ingredient gets renamed.

- **No Mongoose:** Using direct MongoDB driver for simplicity and performance.

- **Seed scripts:** Must run in order: `seed:admin` → `seed:stores` → `seed:ingredients`

- **Mobile-first philosophy:** Assumed design for 65+ users. Big buttons, minimal typing, high readability.

---

## 🎯 Success Criteria for MVP

- [x] Ingredients seeded and searchable
- [ ] Cook can view assigned week plan
- [ ] Cook can create cart and add ingredients
- [ ] Cook can add missing ingredients (pending approval)
- [ ] Cook can submit cart
- [ ] Admin can review all submitted carts
- [ ] Admin can adjust quantities
- [ ] Admin can mark items "in stock"
- [ ] Admin can generate PDF shopping list
- [ ] PDF is downloadable
- [ ] All APIs have proper auth
- [ ] Mobile testing complete
- [ ] No TypeScript/ESLint errors

---

**Last Sprint:** Feb 8, 2026  
**Next Sprint:** Cart phase begins  
**Contact:** Refer to idea.md for business requirements

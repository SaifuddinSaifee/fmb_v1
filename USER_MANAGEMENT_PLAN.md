# User Management Feature Plan

**Status:** Planning Phase  
**Last Updated:** February 8, 2026  
**Current State:** 60% API coverage, 0% UI coverage

---

## 📋 Overview

Comprehensive user management system for Admin role to:
- Create/read/update/deactivate users
- Manage user roles (admin, cook, volunteer)
- Reset passwords
- Filter and search users
- View user activity timestamps

**Scope:** Admin-only feature; applies to all three roles.

---

## ✅ What's Already Done

### Database Layer (`lib/users.ts`)
✅ `getUsersCollection()` - MongoDB connection  
✅ `createUser(data)` - Create new user with hashed password  
✅ `getAllUsers(filters?)` - List with role/active/sort filters  
✅ `getUserById(id)` - Fetch single user  
✅ `getUsersByRole(role)` - Get users by role  
✅ `updateUser(id, updates)` - Update name/email/role/active status  
✅ `updateUserPassword(id, newPassword)` - Change password  
✅ `deactivateUser(id)` - Soft delete (mark isActive=false)  
✅ `reactivateUser(id)` - Re-enable user  
✅ `checkITSExists(its)` - Validate ITS uniqueness  
✅ `countUsers(filters?)` - Count by role/status  

### API Routes (Partial)
✅ `GET /api/admin/users` - List users with filters, sorting  
✅ `POST /api/admin/users` - Create new user  
⚠️ `GET /api/admin/users/[userId]` - **TODO: Build**  
⚠️ `PATCH /api/admin/users/[userId]` - **TODO: Build**  
⚠️ `DELETE /api/admin/users/[userId]` - **TODO: Build**  
⚠️ `PATCH /api/admin/users/[userId]/password` - **TODO: Build**  
⚠️ `GET /api/admin/users/[userId]/activate` - **TODO: Build**  
⚠️ `GET /api/admin/users/check-its` - **TODO: Build**  

### UI Components
❌ User list page - **NOT BUILT**  
❌ Create user page - **NOT BUILT**  
❌ Edit user page - **NOT BUILT**  
❌ User form component - **NOT BUILT**  
❌ User table component - **NOT BUILT**  

### Types & Validation
✅ `UserRecord` interface  
✅ `CreateUserInput` interface  
✅ `UpdateUserInput` interface  
✅ `UserListFilters` interface  
✅ Zod validation schema for creation  

---

## 🎯 Phase 1: Complete API Routes

### 1. GET `/api/admin/users/[userId]`
**Purpose:** Fetch single user details  
**Auth:** Admin only  
**Response:**
```json
{
  "user": {
    "_id": "ObjectId",
    "name": "John Doe",
    "its": 12345,
    "phoneOrEmail": "+919999999999",
    "role": "cook",
    "isActive": true,
    "createdAt": "2026-02-08T10:00:00Z",
    "updatedAt": "2026-02-08T10:00:00Z"
  }
}
```
**Error:** 404 if not found, 401 if not admin

---

### 2. PATCH `/api/admin/users/[userId]`
**Purpose:** Update user info (name, email, role, active status)  
**Auth:** Admin only  
**Body:**
```json
{
  "name": "Jane Doe",
  "phoneOrEmail": "+919999999999",
  "role": "admin",
  "isActive": false
}
```
**Validation:**
- name: string, min 1 char
- phoneOrEmail: optional string
- role: enum ["admin", "cook", "volunteer"]
- isActive: boolean

**Response:** 200 with updated user  
**Error:** 400 validation, 404 not found, 409 if changing own role to non-admin

---

### 3. DELETE `/api/admin/users/[userId]`
**Purpose:** Hard delete user (careful!)  
**Auth:** Admin only  
**Checks:**
- Prevent deleting self
- Confirm deletion (frontend shows warning)
- Log deletion for audit (nice-to-have)

**Response:** 200 { message: "User deleted" }  
**Error:** 400 if self-deletion, 404 if not found

---

### 4. PATCH `/api/admin/users/[userId]/password`
**Purpose:** Admin reset user password  
**Auth:** Admin only  
**Body:**
```json
{
  "newPassword": "SecurePass123"
}
```
**Validation:**
- Password: min 8 chars, 1 upper, 1 lower, 1 number
- Can't be same as old password (optional validation)

**Response:** 200 { message: "Password updated" }  
**Error:** 400 validation, 404 not found

---

### 5. PATCH `/api/admin/users/[userId]/activate`
**Purpose:** Toggle user active status (convenience endpoint)  
**Auth:** Admin only  
**Body:**
```json
{
  "isActive": true
}
```

**Response:** 200 with updated user  
**Error:** 404 not found

---

### 6. GET `/api/admin/users/check-its`
**Purpose:** Validate ITS number availability (frontend use during form)  
**Auth:** Admin only  
**Query params:**
```
GET /api/admin/users/check-its?its=12345&excludeUserId=abc123
```
**Response:**
```json
{
  "available": true
}
```
**Notes:**
- `excludeUserId` allows editing existing user without conflict

---

## 🎨 Phase 2: UI Components & Pages

### Structure
```
components/ui/
  user-table.tsx           # Reusable table with sorting/filtering
  user-form.tsx            # Shared form for create/edit (already exists!)
  user-actions-menu.tsx    # Action dropdown (edit/delete/activate)
  confirm-dialog.tsx       # (Already exists)

app/admin/
  users/
    page.tsx               # List all users
    new/
      page.tsx             # Create new user
    [userId]/
      edit/
        page.tsx           # Edit existing user
```

---

### Page: `app/admin/users/page.tsx` (List)

**Features:**
- Table of all users (name, ITS, role, email, active status, created date)
- Filters: role dropdown, "Active" toggle, search box (name/ITS)
- Sort: by name, ITS, createdAt (ascending/descending)
- Pagination: 10 users per page
- Action buttons per row: Edit, Delete, Activate/Deactivate
- "New User" button at top
- Stats: total users, by role count
- Responsive: stacked cards on mobile

**Mobile considerations:**
- Touch targets 48px+
- Horizontal scroll for table OR card layout on mobile
- Filters in modal/drawer on mobile
- Action menu (⋮) for row actions

---

### Page: `app/admin/users/new/page.tsx` (Create)

**Form Fields:**
1. Name (text input, required, 48px height)
2. ITS Number (number input, required, unique check)
3. Phone/Email (text input, optional)
4. Role (select dropdown: admin, cook, volunteer)
5. Password (password input, required, validation feedback)
6. Confirm Password (password input, required, match check)

**Validation:**
- Real-time ITS uniqueness check (debounced API call)
- Password strength meter
- Show errors inline
- Submit button disabled until form valid

**UX:**
- Cancel button → back to list
- Success → redirect to user list with toast
- Error → show alert with message
- Loading state on submit button

---

### Page: `app/admin/users/[userId]/edit/page.tsx` (Update)

**Form Fields:**
1. Name (text input, required)
2. Email/Phone (text input, optional)
3. Role (select: admin, cook, volunteer)
4. Active Status (toggle: Active / Inactive)

**Additional Section:**
- "Reset Password" button → modal with new password form
- Shows: last updated date, created date, last login (if tracked)

**Validation:**
- Same as create but optional password section
- Prevent role change from admin → anything if it's the current user (dangerous)

**UX:**
- "Delete User" button with warning
- Success → show toast, stay on page
- Prefill with current data
- Save button shows loading state

---

### Component: `components/ui/user-form.tsx` (Reusable)

**Props:**
```tsx
{
  initialData?: UserRecord;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  isLoading?: boolean;
  mode: "create" | "edit";
}
```

**Behavior:**
- If mode="create": show password fields, all required
- If mode="edit": hide password fields, make most optional
- Real-time validation
- Accessible labels and error messages
- Mobile-first layout

---

### Component: `components/ui/user-table.tsx`

**Props:**
```tsx
{
  users: UserRecord[];
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  onToggleActive?: (userId: string, isActive: boolean) => void;
  isLoading?: boolean;
  sortBy?: "name" | "its" | "createdAt";
  sortOrder?: "asc" | "desc";
}
```

**Columns:**
- Name
- ITS
- Role (badge: admin=red, cook=blue, volunteer=green)
- Email/Phone
- Status (badge: active=green, inactive=gray)
- Created Date
- Actions (menu with edit/delete/toggle)

---

### Component: `components/ui/user-actions-menu.tsx`

**Actions:**
- Edit → link to edit page
- Toggle Active/Inactive
- Delete → confirm dialog
- (Reset Password - optional, could be on edit page)

**Responsive:**
- Desktop: inline action buttons
- Mobile: ⋮ menu icon

---

## 📊 Database Optimization

### Indexes to Add
```js
// Ensure ITS is unique
db.users.createIndex({ its: 1 }, { unique: true });

// Speed up filters
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

// Speed up sorts
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ name: 1 });

// Combined indexes for common queries
db.users.createIndex({ role: 1, isActive: 1 });
db.users.createIndex({ createdAt: -1, role: 1 });
```

---

## 🔐 Security Considerations

✅ **Auth check:** All routes require admin role  
✅ **Password hashing:** bcryptjs with 10+ rounds  
✅ **Password removal:** Never return password in API responses  
✅ **ITS uniqueness:** Enforced at DB level + API validation  
✅ **Self-deletion:** Prevent users from deleting themselves  
✅ **Self-role-change:** Optional: prevent removing own admin role  
✅ **Input validation:** Zod schemas for all endpoints  
✅ **SQL injection:** N/A (using MongoDB driver, not raw queries)  
✅ **XSS:** Next.js auto-escapes React children  

---

## 📱 Mobile-First Checklist

- [ ] All buttons ≥48px height
- [ ] Font size ≥16px for inputs
- [ ] No horizontal scrolling (responsive layout)
- [ ] Touch-friendly actions (no hover-only menus on mobile)
- [ ] Form labels above inputs (not floating)
- [ ] Single column on mobile (stacked cards, not tables)
- [ ] Drawer/modal for filters on mobile
- [ ] Sufficient tap target spacing (8px+ between tappable elements)
- [ ] Test on actual mobile device (iOS + Android)

---

## 📖 Documentation

Update `COOK_API_REFERENCE.md` to include user management endpoints:

**Sections to add:**
1. Authentication (required for all endpoints)
2. GET /api/admin/users (list)
3. POST /api/admin/users (create)
4. GET /api/admin/users/[userId] (fetch)
5. PATCH /api/admin/users/[userId] (update)
6. DELETE /api/admin/users/[userId] (delete)
7. PATCH /api/admin/users/[userId]/password (reset)
8. PATCH /api/admin/users/[userId]/activate (toggle)
9. GET /api/admin/users/check-its (validate ITS)

For each: method, path, auth, query/body params, response example, error codes.

---

## 🧪 Testing Checklist

### Unit Tests (lib/users.ts functions)
- [ ] Create user with valid data
- [ ] Reject duplicate ITS
- [ ] Hash password correctly
- [ ] Update user fields
- [ ] Deactivate/reactivate user
- [ ] Filter by role/active status
- [ ] Sort by name/its/date

### Integration Tests (API routes)
- [ ] GET /api/admin/users returns filtered results
- [ ] POST /api/admin/users creates user
- [ ] GET /api/admin/users/[userId] returns single user
- [ ] PATCH /api/admin/users/[userId] updates user
- [ ] DELETE /api/admin/users/[userId] deletes user
- [ ] PATCH password endpoint hashes correctly
- [ ] Non-admin gets 403 Forbidden
- [ ] Invalid ITS gets 409 Conflict

### UI/Manual Tests
- [ ] Create new user flow works end-to-end
- [ ] Edit user updates correctly
- [ ] Delete shows confirmation
- [ ] Deactivate/reactivate toggles status
- [ ] Filters work (role, active, search)
- [ ] Sorting works in all directions
- [ ] Form validation shows errors
- [ ] Real-time ITS check works
- [ ] Mobile responsiveness on device
- [ ] No TypeScript errors
- [ ] No console errors/warnings

---

## 🎬 Implementation Order

1. **API Routes** (all 6 endpoints)
2. **Reusable Components** (UserForm, UserTable, UserActionsMenu)
3. **Pages** (List → New → Edit)
4. **Database Indexes**
5. **Documentation**
6. **Testing**

---

## 💡 Nice-to-Have (Post-MVP)

- [ ] User activity log (last login, created/modified dates)
- [ ] Bulk operations (bulk activate, bulk assign role)
- [ ] Export users to CSV
- [ ] User search by partial matches (autocomplete)
- [ ] Email notification on user creation (send temp password)
- [ ] Two-factor authentication
- [ ] User permissions matrix (fine-grained roles)
- [ ] Audit log of admin actions on users

---

## ✨ Success Criteria

- [x] All 6 API endpoints implemented and tested
- [ ] List page shows all users with filters/sort
- [ ] Create page has form with validation
- [ ] Edit page updates user correctly
- [ ] Delete action with confirmation
- [ ] Mobile responsive on actual device
- [ ] TypeScript strict mode passes
- [ ] No console errors/warnings
- [ ] API documentation complete
- [ ] Seed script creates test users correctly


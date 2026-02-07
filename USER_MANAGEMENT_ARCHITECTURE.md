# User Management Architecture Diagram

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Users List Page (/admin/users)                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ • Fetch all users (GET /api/admin/users)                │   │
│  │ • Filter by role, active status, search                 │   │
│  │ • Sort by name, ITS, createdAt                          │   │
│  │ • Display UserTable component                           │   │
│  │ • Actions: Edit, Delete, Activate/Deactivate           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                         │
│        ┌────────────────┼────────────────┐                       │
│        │                │                │                       │
│        ▼                ▼                ▼                       │
│  ┌───────────┐   ┌────────────┐   ┌──────────────┐              │
│  │Create New │   │Edit User   │   │Delete User   │              │
│  │User Page  │   │Page        │   │(with confirm)│              │
│  │(/new)     │   │([userId])  │   │              │              │
│  └───────────┘   └────────────┘   └──────────────┘              │
│        │                │                                         │
│        └────────┬───────┘                                         │
│                 │                                                 │
│        ┌────────▼──────────┐                                     │
│        │  UserForm Comp.   │                                     │
│        │  (Reusable)       │                                     │
│        └───────────────────┘                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ API Calls (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTES (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  GET    /api/admin/users              → List users              │
│  POST   /api/admin/users              → Create user             │
│  GET    /api/admin/users/[userId]     → Fetch single            │
│  PATCH  /api/admin/users/[userId]     → Update user             │
│  DELETE /api/admin/users/[userId]     → Delete user             │
│  PATCH  /api/admin/users/[userId]/password → Reset password    │
│  PATCH  /api/admin/users/[userId]/activate → Toggle active      │
│  GET    /api/admin/users/check-its    → Validate ITS            │
│                                                                   │
│  [Auth: Admin only] [Validation: Zod schemas]                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ MongoDB operations
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 DATABASE LAYER (lib/users.ts)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  getUsersCollection()        → Get collection instance           │
│  createUser()                → Insert new user                   │
│  getAllUsers(filters)        → Find with filters/sorting         │
│  getUserById()               → Find single user                  │
│  getUsersByRole()            → Find by role                      │
│  updateUser()                → Update fields                     │
│  updateUserPassword()        → Hash & update password            │
│  deactivateUser()            → Mark inactive                     │
│  reactivateUser()            → Mark active                       │
│  checkITSExists()            → Validate ITS uniqueness           │
│  countUsers()                → Count documents                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MONGODB COLLECTION: users                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  {                                                               │
│    _id: ObjectId,                                               │
│    name: "John Doe",                                            │
│    its: 12345,               ← UNIQUE INDEX                      │
│    passwordHash: "bcrypt...",                                   │
│    phoneOrEmail: "+919999999999",                               │
│    role: "cook",             ← INDEX for filtering               │
│    isActive: true,           ← INDEX for filtering               │
│    createdAt: Date,          ← INDEX for sorting                │
│    updatedAt: Date                                              │
│  }                                                               │
│                                                                   │
│  Indexes:                                                        │
│  • its (unique)                                                 │
│  • role                                                         │
│  • isActive                                                     │
│  • createdAt                                                    │
│  • {role: 1, isActive: 1} (compound)                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
AdminLayout
│
├─ /admin/users (List Page)
│  ├─ UserFilters (filters, search, sorting)
│  ├─ UserTable (reusable component)
│  │  ├─ UserRow (each row)
│  │  │  ├─ Badge (role, status)
│  │  │  └─ UserActionsMenu
│  │  │     ├─ Edit (link)
│  │  │     ├─ Delete (with ConfirmDialog)
│  │  │     └─ Toggle Active
│  ├─ Pagination
│  └─ "New User" Button
│
├─ /admin/users/new (Create Page)
│  └─ UserForm (mode="create")
│     ├─ TextInput (name)
│     ├─ NumberInput (ITS with real-time check)
│     ├─ TextInput (email/phone)
│     ├─ Select (role dropdown)
│     ├─ PasswordInput (with strength meter)
│     ├─ PasswordInput (confirm password)
│     ├─ Button (Submit)
│     └─ Button (Cancel → back)
│
└─ /admin/users/[userId]/edit (Edit Page)
   ├─ UserForm (mode="edit")
   │  ├─ TextInput (name)
   │  ├─ TextInput (email/phone)
   │  ├─ Select (role)
   │  ├─ Toggle (isActive)
   │  ├─ Button (Submit)
   │  └─ Button (Cancel)
   ├─ Button (Reset Password)
   │  └─ [Modal]
   │     ├─ PasswordInput (new password)
   │     ├─ Button (Update)
   │     └─ Button (Cancel)
   └─ Button (Delete)
      └─ [ConfirmDialog]
         ├─ Alert message
         ├─ Button (Delete)
         └─ Button (Cancel)
```

---

## Request/Response Examples

### 1. GET /api/admin/users (List)

**Query Params:**
```
?role=cook&isActive=true&sortBy=name&sortOrder=asc
```

**Response:**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "its": 12345,
      "phoneOrEmail": "+919999999999",
      "role": "cook",
      "isActive": true,
      "createdAt": "2026-02-08T10:00:00Z",
      "updatedAt": "2026-02-08T10:00:00Z"
    }
  ]
}
```

---

### 2. POST /api/admin/users (Create)

**Request:**
```json
{
  "name": "Jane Doe",
  "its": 54321,
  "password": "SecurePass123",
  "phoneOrEmail": "+919888888888",
  "role": "admin"
}
```

**Response (201):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Doe",
    "its": 54321,
    "phoneOrEmail": "+919888888888",
    "role": "admin",
    "isActive": true,
    "createdAt": "2026-02-08T11:00:00Z"
  },
  "message": "User created successfully"
}
```

**Errors:**
```json
{
  "error": "Invalid payload",
  "details": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "path": ["password"],
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

### 3. PATCH /api/admin/users/[userId] (Update)

**Request:**
```json
{
  "name": "Jane Smith",
  "role": "cook",
  "isActive": false
}
```

**Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "its": 54321,
    "phoneOrEmail": "+919888888888",
    "role": "cook",
    "isActive": false,
    "updatedAt": "2026-02-08T12:00:00Z"
  }
}
```

---

### 4. PATCH /api/admin/users/[userId]/password (Reset)

**Request:**
```json
{
  "newPassword": "NewSecurePass456"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

---

### 5. DELETE /api/admin/users/[userId] (Delete)

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

### 6. GET /api/admin/users/check-its (Validate ITS)

**Query:**
```
?its=12345&excludeUserId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "available": true
}
```

---

## Mobile Responsiveness

### Desktop (≥1024px)
```
┌─────────────────────────────────────────┐
│ Users List                              │
├─────────────────────────────────────────┤
│ Name    │ ITS    │ Role  │ Email │ ... │
├─────────┼────────┼───────┼───────┼─────┤
│ John    │ 12345  │ Cook  │ j@... │ ⋮   │
│ Jane    │ 54321  │ Admin │ ja... │ ⋮   │
└─────────────────────────────────────────┘
```

### Tablet (640px - 1024px)
```
┌──────────────────────────┐
│ Users List               │
├──────────────────────────┤
│ Name      │ Role │ ... │
├───────────┼──────┼─────┤
│ John Doe  │ Cook │  ⋮  │
│ Jane Doe  │ Admin│  ⋮  │
└──────────────────────────┘
```

### Mobile (<640px)
```
┌─────────────────────────┐
│ Users List              │
├─────────────────────────┤
│ John Doe                │
│ ITS: 12345              │
│ Role: Cook              │
│ Active: Yes             │
│ [Edit] [Delete]         │
├─────────────────────────┤
│ Jane Doe                │
│ ITS: 54321              │
│ Role: Admin             │
│ Active: Yes             │
│ [Edit] [Delete]         │
└─────────────────────────┘
```

---

## State Management Flow

```
User List Page (useState)
├─ users: UserRecord[]
├─ filters: { role, isActive, search }
├─ sorting: { sortBy, sortOrder }
├─ pagination: { page, pageSize }
├─ isLoading: boolean
└─ error: string | null

Form Page (useState)
├─ formData: CreateUserInput | UpdateUserInput
├─ errors: Record<string, string>
├─ isSubmitting: boolean
├─ showPasswordStrength: boolean
├─ itsAvailable: boolean | null
└─ lastCheckedIts: number | null
```

---

## Error Handling Strategy

```
API Errors
├─ 400 Bad Request → Invalid input (show validation errors)
├─ 401 Unauthorized → Not logged in (redirect to login)
├─ 403 Forbidden → Not admin role (show alert)
├─ 404 Not Found → User doesn't exist (redirect to list)
├─ 409 Conflict → ITS already exists (show form error)
└─ 500 Server Error → DB issue (show alert, log)

Form Validation
├─ Required fields → Show "required" error
├─ Field format → Show pattern error
├─ ITS uniqueness → Async check, debounced
├─ Password strength → Show meter
├─ Password match → Show mismatch error
└─ Submit → Disable button until valid
```

---

## Security Flow

```
User submits form
│
▼
Frontend validation (Zod schema)
│
▼
API route receives request
│
▼
Verify JWT token from cookies
│
▼
Check user role === "admin"
│
▼
Re-validate with Zod schema
│
▼
Execute DB operation
│
▼
Hash password (if creating/resetting)
│
▼
Remove passwordHash from response
│
▼
Return sanitized response
```


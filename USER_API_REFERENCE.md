# User Management API Reference

## Overview

User management APIs allow admins to create, read, update, and delete users in the system. All endpoints require admin authentication via JWT token in cookies.

---

## Authentication

All user management endpoints require:
- **Authentication:** Valid JWT token in `SESSION_COOKIE_NAME` cookie
- **Authorization:** User must have `role: "admin"`

**Error Response (Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```
Status: `401`

**Error Response (Forbidden - Not Admin):**
```json
{
  "error": "Forbidden"
}
```
Status: `403`

---

## API Endpoints

### 1. GET `/api/admin/users` - List All Users

Fetch all users with optional filtering and sorting.

**Query Parameters:**
- `role` (optional): `"admin" | "cook" | "volunteer"` - Filter by role
- `isActive` (optional): `"true" | "false"` - Filter by status
- `sortBy` (optional): `"name" | "its" | "createdAt"` - Sort field (default: `"createdAt"`)
- `sortOrder` (optional): `"asc" | "desc"` - Sort direction (default: `"desc"`)

**Example Request:**
```bash
GET /api/admin/users?role=cook&isActive=true&sortBy=name&sortOrder=asc
```

**Success Response (200):**
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

**Error Response (400 - Invalid Filter):**
```json
{
  "error": "Invalid role parameter"
}
```

---

### 2. POST `/api/admin/users` - Create New User

Create a new user account with password.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "its": 54321,
  "password": "SecurePass123",
  "phoneOrEmail": "+919888888888",
  "role": "admin"
}
```

**Field Validation:**
- `name`: String, min 1 character, required
- `its`: Positive integer, required, **must be unique**
- `password`: String, required
  - Min 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
- `phoneOrEmail`: String, optional
- `role`: Enum `["admin", "cook", "volunteer"]`, required

**Success Response (201):**
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

**Error Response (400 - Validation Error):**
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

**Error Response (409 - ITS Already Exists):**
```json
{
  "error": "ITS number already exists"
}
```

---

### 3. GET `/api/admin/users/[userId]` - Get Single User

Fetch a specific user by ID.

**Path Parameter:**
- `userId`: MongoDB ObjectId (as string)

**Example Request:**
```bash
GET /api/admin/users/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
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

**Error Response (400 - Invalid ID):**
```json
{
  "error": "Invalid user ID"
}
```

**Error Response (404 - User Not Found):**
```json
{
  "error": "User not found"
}
```

---

### 4. PATCH `/api/admin/users/[userId]` - Update User

Update user information (name, email, role, active status).

**Path Parameter:**
- `userId`: MongoDB ObjectId (as string)

**Request Body (All fields optional):**
```json
{
  "name": "Jane Smith",
  "phoneOrEmail": "+919888888888",
  "role": "cook",
  "isActive": false
}
```

**Field Validation:**
- `name`: String, min 1 character
- `phoneOrEmail`: String
- `role`: Enum `["admin", "cook", "volunteer"]`
- `isActive`: Boolean

**Success Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jane Smith",
    "its": 12345,
    "phoneOrEmail": "+919888888888",
    "role": "cook",
    "isActive": false,
    "createdAt": "2026-02-08T10:00:00Z",
    "updatedAt": "2026-02-08T15:30:00Z"
  }
}
```

**Error Response (400 - Validation Error):**
```json
{
  "error": "Invalid payload",
  "details": [...]
}
```

**Error Response (404 - User Not Found):**
```json
{
  "error": "User not found"
}
```

---

### 5. DELETE `/api/admin/users/[userId]` - Delete User

Permanently delete a user account.

**Path Parameter:**
- `userId`: MongoDB ObjectId (as string)

**Important Notes:**
- Cannot delete your own account (safety check)
- This is a hard delete (irreversible)

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Response (400 - Self-Deletion Attempted):**
```json
{
  "error": "Cannot delete your own account"
}
```

**Error Response (404 - User Not Found):**
```json
{
  "error": "User not found"
}
```

---

### 6. PATCH `/api/admin/users/[userId]/password` - Reset Password

Admin resets a user's password.

**Path Parameter:**
- `userId`: MongoDB ObjectId (as string)

**Request Body:**
```json
{
  "newPassword": "NewSecurePass456"
}
```

**Field Validation:**
- `newPassword`: String, required
  - Min 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number

**Success Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

**Error Response (400 - Validation Error):**
```json
{
  "error": "Invalid payload",
  "details": [...]
}
```

**Error Response (404 - User Not Found):**
```json
{
  "error": "User not found"
}
```

---

### 7. PATCH `/api/admin/users/[userId]/activate` - Toggle Active Status

Activate or deactivate a user account (convenience endpoint).

**Path Parameter:**
- `userId`: MongoDB ObjectId (as string)

**Request Body:**
```json
{
  "isActive": true
}
```

**Field Validation:**
- `isActive`: Boolean, required

**Success Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "its": 12345,
    "phoneOrEmail": "+919999999999",
    "role": "cook",
    "isActive": true,
    "updatedAt": "2026-02-08T16:00:00Z"
  }
}
```

**Error Response (404 - User Not Found):**
```json
{
  "error": "User not found"
}
```

---

### 8. GET `/api/admin/users/check-its` - Validate ITS Availability

Check if an ITS number is available (for use during form submission).

**Query Parameters:**
- `its` (required): Positive integer - ITS number to check
- `excludeUserId` (optional): MongoDB ObjectId (as string) - When editing, exclude this user from the check

**Example Requests:**
```bash
# Check if ITS is available (create mode)
GET /api/admin/users/check-its?its=12345

# Check if ITS is available, excluding current user (edit mode)
GET /api/admin/users/check-its?its=12345&excludeUserId=507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "available": true
}
```

```json
{
  "available": false
}
```

**Error Response (400 - Missing ITS):**
```json
{
  "error": "ITS number is required"
}
```

**Error Response (400 - Invalid ITS):**
```json
{
  "error": "ITS must be a positive number"
}
```

---

## Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `400` | Bad Request | Check request format and validation |
| `401` | Unauthorized | User not logged in; redirect to login |
| `403` | Forbidden | User is not an admin |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | ITS number already exists |
| `500` | Server Error | Database or server issue; try again |

---

## Rate Limiting

Currently no rate limiting. May add in production if needed.

---

## Database Helper Functions

For reference, the following helper functions are available in `lib/users.ts`:

```typescript
// Get all users with filters
getAllUsers(filters?: UserListFilters): Promise<UserRecord[]>

// Get single user
getUserById(id: string | ObjectId): Promise<UserRecord | null>

// Get users by role
getUsersByRole(role: Role): Promise<UserRecord[]>

// Create user
createUser(data: CreateUserInput): Promise<UserRecord>

// Update user
updateUser(id: string | ObjectId, updates: UpdateUserInput): Promise<boolean>

// Update password
updateUserPassword(id: string | ObjectId, newPassword: string): Promise<boolean>

// Deactivate user
deactivateUser(id: string | ObjectId): Promise<boolean>

// Reactivate user
reactivateUser(id: string | ObjectId): Promise<boolean>

// Check ITS exists
checkITSExists(its: number): Promise<boolean>

// Count users
countUsers(filters?: { role?: Role; isActive?: boolean }): Promise<number>
```

---

## Examples

### Create a Cook User

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Robert Cook",
    "its": 54321,
    "password": "CookPass123",
    "phoneOrEmail": "+919876543210",
    "role": "cook"
  }'
```

### List All Active Cooks

```bash
curl "http://localhost:3000/api/admin/users?role=cook&isActive=true&sortBy=name"
```

### Reset a User's Password

```bash
curl -X PATCH http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011/password \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewPass456"
  }'
```

### Check ITS Availability

```bash
curl "http://localhost:3000/api/admin/users/check-its?its=99999"
```

---

## Notes

- **Password hashing:** All passwords are hashed using bcryptjs (cost factor 12) before storing
- **Password in response:** Passwords are never returned in API responses
- **ITS uniqueness:** Enforced at both database (unique index) and API validation levels
- **Soft delete:** Deactivation sets `isActive=false`; hard delete is available via DELETE endpoint
- **Timestamps:** All dates are stored and returned in ISO 8601 format


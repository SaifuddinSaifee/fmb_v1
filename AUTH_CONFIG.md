# FMB Kitchen Ops - Authentication & Config

## Quick Start

### 1. Environment Setup

Create `.env.local` with the following variables:

```env
# MongoDB Connection
MONGODB_URI=your-mongodb-connection-string

# JWT Secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin User Seed (for first-time setup)
ADMIN_ITS=12345678
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin Name
ADMIN_CONTACT=admin@example.com
```

### 2. Seed Admin User

```bash
npm run seed:admin
```

This creates or updates the admin user in MongoDB.

### 3. Run Development Server

```bash
npm run dev
```

The MongoDB client will initialize automatically when the app starts.

---

## Architecture

### Centralized Configuration (`lib/config.ts`)

All application configuration is managed through a single file:

- **MongoDB Client Singleton**: Created once, reused everywhere
- **Database Helper Functions**: `getMongoClient()`, `getDatabase()`
- **Application Constants**: Collection names, roles, session settings
- **Environment Variable Validation**: Fails fast if required vars are missing

### Key Features

1. **Connection Pooling**: MongoDB client persists across hot reloads in development
2. **Single Source of Truth**: All config exported from `lib/config.ts`
3. **Type Safety**: TypeScript types for roles and collections
4. **Environment Validation**: Throws errors on app start if config is missing

### Usage Examples

```typescript
// Get MongoDB client
import { getMongoClient, COLLECTIONS } from "@/lib/config";

const client = await getMongoClient();
const db = client.db();
const users = db.collection(COLLECTIONS.USERS);

// Or use getDatabase helper
import { getDatabase, COLLECTIONS } from "@/lib/config";

const db = await getDatabase();
const users = db.collection(COLLECTIONS.USERS);
```

---

## Authentication

### ITS-Based Login

- Users authenticate with **ITS number** (numeric) and **password**
- Passwords are hashed with bcrypt (cost factor 10)
- JWTs are stored in HTTP-only cookies (7-day expiry)

### Protected Routes

Routes are protected by middleware based on role:

- `/admin/*` - Admin only
- `/cook/*` - Cook (or Admin)
- `/volunteer/*` - Volunteer (or Admin)

### API Endpoints

- `POST /api/auth/login` - Login with ITS + password
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get current user

---

## Database Collections

Defined in `lib/config.ts`:

- `users` - User accounts (ITS, passwordHash, role)
- `stores` - Store locations
- `ingredient_items` - Master ingredient list
- `week_plans` - Weekly menu plans
- `carts` - Shopping carts
- `cart_items` - Cart line items
- `recipes` - Recipe definitions

---

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed:admin` - Create/update admin user

---

## Best Practices

1. **Always import from `lib/config.ts`** for constants and config
2. **Use `getMongoClient()` or `getDatabase()`** instead of direct client access
3. **Use `COLLECTIONS` constant** for collection names (type-safe, prevents typos)
4. **Never commit `.env.local`** to version control
5. **Rotate JWT_SECRET** in production regularly

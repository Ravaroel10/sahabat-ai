# Migration Guide: Prisma to Drizzle ORM

This guide explains how the schema was migrated from Prisma (SQLite) to Drizzle ORM (PostgreSQL).

## Key Changes

### 1. Database Provider
- **Before**: SQLite (`file:./dev.db`)
- **After**: PostgreSQL (`postgresql://...`)

### 2. ORM
- **Before**: Prisma (`@prisma/client`)
- **After**: Drizzle ORM (`drizzle-orm`)

### 3. Schema Differences

#### Field Type Mappings

| Prisma (SQLite) | Drizzle (PostgreSQL) | Notes |
|-----------------|----------------------|-------|
| `String @id @default(cuid())` | `text("id").primaryKey()` | CUID still used for IDs |
| `String` | `text("column_name")` | Regular text fields |
| `String?` | `text("column_name")` | Nullable by default in Drizzle |
| `String @unique` | `text("column_name").unique()` | Unique constraint |
| `String @default("value")` | `text("column_name").default("value")` | Default values |
| `Int` | `integer("column_name")` | Integer fields |
| `DateTime @default(now())` | `timestamp("column_name").defaultNow()` | Current timestamp |
| `DateTime @updatedAt` | `timestamp().defaultNow().$onUpdate(() => new Date())` | Auto-update timestamp |

#### Naming Convention Changes

- **Prisma**: Uses camelCase for everything
- **Drizzle**: Uses snake_case for database columns, camelCase in TypeScript

Examples:
```typescript
// Prisma
model User {
  governmentId String?
  createdAt    DateTime @default(now())
}

// Drizzle
export const user = pgTable("user", {
  governmentId: text("government_id"),  // snake_case in DB
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 4. Relations

#### Prisma Relations
```prisma
model User {
  id        String   @id
  documents Document[]
}

model Document {
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```

#### Drizzle Relations
```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
});

export const document = pgTable("document", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const userRelations = relations(user, ({ many }) => ({
  documents: many(document),
}));

export const documentRelations = relations(document, ({ one }) => ({
  user: one(user, {
    fields: [document.userId],
    references: [user.id],
  }),
}));
```

## Schema Files Comparison

### User Table

**Prisma (schema.prisma)**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  role          String    @default("warga")
  governmentId  String?
  province      String?
  city          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

**Drizzle (src/db/schema.ts)**
```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  role: text("role").default("warga").notNull(),
  governmentId: text("government_id"),
  province: text("province"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  // Better Auth required fields
  emailVerified: boolean("email_verified").default(false).notNull(),
});
```

## Query Syntax Comparison

### Finding a User

**Prisma**
```typescript
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});
```

**Drizzle**
```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const result = await db
  .select()
  .from(user)
  .where(eq(user.email, "user@example.com"))
  .limit(1);

const foundUser = result[0];
```

### Creating a User

**Prisma**
```typescript
const newUser = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
  },
});
```

**Drizzle**
```typescript
import { db } from "@/db";
import { user } from "@/db/schema";

const [newUser] = await db
  .insert(user)
  .values({
    id: generateId(), // You'll need to generate IDs manually
    email: "user@example.com",
    name: "John Doe",
  })
  .returning();
```

### Updating a User

**Prisma**
```typescript
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: "Jane Doe" },
});
```

**Drizzle**
```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const [updated] = await db
  .update(user)
  .set({ name: "Jane Doe" })
  .where(eq(user.id, userId))
  .returning();
```

### Deleting a User

**Prisma**
```typescript
await prisma.user.delete({
  where: { id: userId },
});
```

**Drizzle**
```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

await db.delete(user).where(eq(user.id, userId));
```

### Finding with Relations

**Prisma**
```typescript
const userWithDocuments = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    documents: true,
  },
});
```

**Drizzle**
```typescript
import { db } from "@/db";
import { user, document } from "@/db/schema";
import { eq } from "drizzle-orm";

const userWithDocuments = await db.query.user.findFirst({
  where: eq(user.id, userId),
  with: {
    documents: true,
  },
});
```

## Migration Steps

### 1. Generate ID Helper (Optional)

If you want to keep using CUID:

```bash
npm install @paralleldrive/cuid2
```

```typescript
// src/lib/utils.ts
import { createId } from "@paralleldrive/cuid2";

export function generateId() {
  return createId();
}
```

### 2. Update Existing API Routes

Replace Prisma imports with Drizzle:

```typescript
// Before
import { prisma } from "@/lib/prisma";

// After
import { db } from "@/db";
import { user, document, socialProgram } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
```

### 3. Incremental Migration Strategy

You can migrate gradually:

1. Start with new features using Drizzle
2. Keep existing Prisma code working
3. Migrate one model/feature at a time
4. Test thoroughly before removing Prisma

### 4. Data Migration

If you have existing SQLite data:

```bash
# Export from SQLite
sqlite3 dev.db .dump > data.sql

# Transform and import to PostgreSQL (manual process)
# You'll need to adjust the SQL syntax for PostgreSQL
```

## Benefits of the Migration

1. **Better Type Safety**: Drizzle provides better TypeScript inference
2. **Performance**: PostgreSQL is more robust for production
3. **Better Auth Integration**: Direct schema control for auth tables
4. **Query Builder**: More flexible query building
5. **SQL-like Syntax**: Closer to actual SQL for complex queries

## Keeping Both (Temporary)

During transition, you can keep both:

```typescript
// Old code
import { prisma } from "@/lib/prisma";
const user = await prisma.user.findUnique({ where: { id } });

// New code
import { db } from "@/db";
const user = await db.query.user.findFirst({ where: eq(user.id, id) });
```

They can point to different databases or the same one.

## Complete Removal of Prisma

When ready to fully migrate:

1. Remove Prisma dependencies:
```bash
npm uninstall @prisma/client prisma
```

2. Delete Prisma files:
```bash
rm -rf prisma/
rm -rf node_modules/.prisma/
```

3. Remove Prisma scripts from package.json

4. Update all imports across the codebase

## Rollback Plan

If you need to rollback:

1. Keep the `prisma/` directory
2. Keep Prisma in package.json temporarily
3. Don't delete the SQLite database file
4. Can switch back by reverting imports

## Testing Checklist

- [ ] All CRUD operations work
- [ ] Relations are properly loaded
- [ ] Authentication works end-to-end
- [ ] Existing features still function
- [ ] Performance is acceptable
- [ ] Database migrations run successfully
- [ ] Error handling works correctly
- [ ] Transaction support where needed

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Drizzle + PostgreSQL Guide](https://orm.drizzle.team/docs/get-started-postgresql)
- [Better Auth + Drizzle](https://better-auth.com/docs/adapters/drizzle)

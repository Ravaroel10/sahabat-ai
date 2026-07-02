# 🔐 Authentication Code Snippets

Quick copy-paste code snippets for common authentication patterns.

## Table of Contents
1. [Client Components](#client-components)
2. [Server Components](#server-components)
3. [API Routes](#api-routes)
4. [Database Queries](#database-queries)
5. [Middleware](#middleware)
6. [Hooks and Utilities](#hooks-and-utilities)

---

## Client Components

### Get Current User Session

```tsx
"use client";

import { useSession } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!session) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Hello, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Sign In Button

```tsx
"use client";

import { authClient } from "@/lib/auth-client";

export function SignInButton() {
  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <button onClick={handleSignIn}>
      Sign in with Google
    </button>
  );
}
```

### Sign Out Button

```tsx
"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <button onClick={handleSignOut}>
      Sign out
    </button>
  );
}
```

### Conditional Rendering Based on Auth

```tsx
"use client";

import { useSession } from "@/lib/auth-client";

export function ConditionalContent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;

  return (
    <div>
      {session ? (
        <div>
          <h2>Authenticated Content</h2>
          <p>Welcome, {session.user.name}!</p>
        </div>
      ) : (
        <div>
          <h2>Public Content</h2>
          <p>Please sign in to see more</p>
        </div>
      )}
    </div>
  );
}
```

### Refetch Session

```tsx
"use client";

import { useSession } from "@/lib/auth-client";

export function ProfileUpdater() {
  const { data: session, refetch } = useSession();

  const handleUpdate = async () => {
    // After updating user profile via API
    await fetch("/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ /* updates */ }),
    });

    // Refetch session to get updated data
    await refetch();
  };

  return <button onClick={handleUpdate}>Update Profile</button>;
}
```

---

## Server Components

### Get Session in Server Component

```tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function ServerComponent() {
  const requestHeaders = await headers();
  
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>User ID: {session.user.id}</p>
    </div>
  );
}
```

### Protected Server Page with Redirect

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Only authenticated users can see this</p>
    </div>
  );
}
```

### Role-Based Access in Server Component

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Check role
  if (session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Only admins can see this</p>
    </div>
  );
}
```

---

## API Routes

### Protected GET Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: "Success",
    userId: session.user.id,
  });
}
```

### Protected POST Route with Body

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  
  // Process request with user context
  // ...

  return NextResponse.json({
    success: true,
    userId: session.user.id,
  });
}
```

### Role-Based API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check role
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 }
    );
  }

  // Admin-only logic
  // ...

  return NextResponse.json({ success: true });
}
```

---

## Database Queries

### Query User with Drizzle

```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

// Find user by ID
const userData = await db.query.user.findFirst({
  where: eq(user.id, userId),
});

// Find user by email
const userByEmail = await db.query.user.findFirst({
  where: eq(user.email, "user@example.com"),
});
```

### Query User with Relations

```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const userWithData = await db.query.user.findFirst({
  where: eq(user.id, userId),
  with: {
    documents: true,
    chatHistory: true,
    eligibilityRecords: {
      with: {
        program: true,
      },
    },
  },
});
```

### Update User

```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const [updatedUser] = await db
  .update(user)
  .set({
    province: "Jakarta",
    city: "Jakarta Selatan",
    updatedAt: new Date(),
  })
  .where(eq(user.id, userId))
  .returning();
```

### Create Record with User Reference

```typescript
import { db } from "@/db";
import { chatHistory } from "@/db/schema";
import { generateId } from "@/lib/utils-db";

const [newChat] = await db
  .insert(chatHistory)
  .values({
    id: generateId(),
    userId: session.user.id,
    messages: JSON.stringify(messages),
    priority: "green",
  })
  .returning();
```

### Delete User Records (Cascade)

```typescript
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

// This will cascade delete all related records
// due to onDelete: "cascade" in schema
await db.delete(user).where(eq(user.id, userId));
```

### Complex Query with Filters

```typescript
import { db } from "@/db";
import { eligibilityRecord } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const records = await db.query.eligibilityRecord.findMany({
  where: and(
    eq(eligibilityRecord.userId, userId),
    gte(eligibilityRecord.score, 70),
    eq(eligibilityRecord.status, "eligible")
  ),
  orderBy: [desc(eligibilityRecord.createdAt)],
  limit: 10,
});
```

---

## Middleware

### Basic Route Protection

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### Multiple Protected Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedRoutes = ["/dashboard", "/profile", "/settings"];
const authRoutes = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (sessionCookie && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to sign in
  if (!sessionCookie && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/settings/:path*", "/sign-in", "/sign-up"],
};
```

---

## Hooks and Utilities

### Custom useUser Hook

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function useUser() {
  const { data: session, isPending, error } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: isPending,
    isAuthenticated: !!session,
    error,
  };
}
```

### Usage:

```tsx
"use client";

import { useUser } from "@/hooks/useUser";

export function MyComponent() {
  const { user, isLoading, isAuthenticated } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return <div>Hello, {user.name}!</div>;
}
```

### Require Auth HOC

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthComponent(props: P) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (!isPending && !session) {
        router.push("/sign-in");
      }
    }, [session, isPending, router]);

    if (isPending) {
      return <div>Loading...</div>;
    }

    if (!session) {
      return null;
    }

    return <Component {...props} />;
  };
}
```

### Usage:

```tsx
"use client";

import { withAuth } from "@/lib/withAuth";

function DashboardComponent() {
  return <div>Protected Content</div>;
}

export default withAuth(DashboardComponent);
```

---

## Complete Examples

### Complete Profile Page

```tsx
// app/profile/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <ProfileForm user={session.user} />
    </div>
  );
}
```

```tsx
// components/profile-form.tsx
"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";

export function ProfileForm({ user }: { user: any }) {
  const [province, setProvince] = useState(user.province || "");
  const [city, setCity] = useState(user.city || "");
  const { refetch } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ province, city }),
    });

    if (response.ok) {
      await refetch();
      alert("Profile updated!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={province}
        onChange={(e) => setProvince(e.target.value)}
        placeholder="Province"
      />
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City"
      />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

---

## Tips & Best Practices

### ✅ Do's

- Always check authentication on server-side for security
- Use middleware for consistent route protection
- Leverage TypeScript types for session data
- Handle loading and error states in UI
- Use server components for initial data fetching
- Cache session data appropriately

### ❌ Don'ts

- Don't rely solely on client-side auth checks for security
- Don't expose sensitive user data in client components
- Don't forget to handle session expiration
- Don't make unnecessary refetch calls
- Don't skip error handling

---

## Testing Snippets

### Test Authentication Flow

```typescript
// __tests__/auth.test.ts
import { auth } from "@/lib/auth";

describe("Authentication", () => {
  it("should return null for unauthenticated request", async () => {
    const headers = new Headers();
    const session = await auth.api.getSession({ headers });
    expect(session).toBeNull();
  });
});
```

---

Need more examples? Check:
- `src/app/api/example-protected-route/route.ts`
- `src/app/api/user/profile/route.ts`
- `src/components/auth/user-button.tsx`
- `src/components/auth/sign-in-button.tsx`

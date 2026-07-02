# 🚀 Quick Start: Authentication Setup

Get authentication up and running in 5 minutes!

## Prerequisites Checklist

- [ ] PostgreSQL database (get free at [Supabase](https://supabase.com) or [Neon](https://neon.tech))
- [ ] Google OAuth2 credentials
- [ ] Dependencies installed (already done ✅)

## Step 1: Get PostgreSQL Database (2 minutes)

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click "New Project"
4. Copy the connection string (Direct Connection, not Pooler)
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

### Option B: Neon
1. Go to [neon.tech](https://neon.tech)
2. Sign up/Login
3. Create new project
4. Copy the connection string

### Option C: Local PostgreSQL
```bash
# Create database
createdb bantu_arah

# Connection string
postgresql://localhost:5432/bantu_arah
```

## Step 2: Get Google OAuth2 Credentials (3 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project (or select existing)
3. Search for "Google+ API" → Enable it
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: **Web application**
6. Add authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Click Create
8. Copy **Client ID** and **Client Secret**

## Step 3: Configure Environment Variables (1 minute)

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and fill in these values:
   ```env
   DATABASE_URL="postgresql://your-connection-string-here"
   GOOGLE_CLIENT_ID="your-google-client-id-here"
   GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

## Step 4: Initialize Database (1 minute)

```bash
# Push schema to database
npm run db:push
```

This will create all necessary tables in your PostgreSQL database.

## Step 5: Start Development Server (10 seconds)

```bash
npm run dev
```

## Step 6: Test Authentication (1 minute)

1. Open browser to `http://localhost:3000/sign-in`
2. Click "Sign in with Google"
3. Authorize the app
4. You should be redirected to `/dashboard`
5. See your name and email displayed
6. Test sign out

## 🎉 Done!

Your authentication is now fully working!

## What You Get

- ✅ Google OAuth2 login
- ✅ Session management
- ✅ Protected routes
- ✅ User profile
- ✅ Sign in/out functionality
- ✅ PostgreSQL database with all tables

## Project Structure

```
src/
├── lib/
│   ├── auth.ts           # Server auth config
│   └── auth-client.ts    # Client auth hooks
├── db/
│   ├── index.ts          # Database client
│   └── schema.ts         # All database tables
├── app/
│   ├── api/auth/[...all]/route.ts  # Auth endpoints
│   ├── sign-in/page.tsx            # Sign in page
│   └── dashboard/page.tsx          # Protected page
└── components/auth/
    ├── sign-in-button.tsx   # Google sign in button
    └── user-button.tsx      # User menu with sign out
```

## Common Issues & Fixes

### Database Connection Failed
- ✅ Verify `DATABASE_URL` is correct
- ✅ Check if database exists
- ✅ Ensure you're using the Direct Connection string (not Pooler for Supabase)

### Google OAuth Error
- ✅ Verify redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- ✅ Ensure Google+ API is enabled
- ✅ Check Client ID and Secret are correct
- ✅ Make sure you're using credentials from the correct project

### "Not authenticated" on Dashboard
- ✅ Clear browser cookies
- ✅ Sign out and sign in again
- ✅ Check browser console for errors

## Next Steps

### Using Authentication in Your Code

#### Get session on client (React components)
```tsx
"use client";
import { useSession } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;
  
  return <div>Hello, {session.user.name}!</div>;
}
```

#### Get session on server (Server Components)
```tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function MyPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!session) return <div>Not authenticated</div>;
  
  return <div>Hello, {session.user.name}!</div>;
}
```

#### Add sign in button anywhere
```tsx
import { SignInButton } from "@/components/auth/sign-in-button";

export function Header() {
  return (
    <header>
      <SignInButton />
    </header>
  );
}
```

#### Add user menu anywhere
```tsx
import { UserButton } from "@/components/auth/user-button";

export function Navbar() {
  return (
    <nav>
      <UserButton />
    </nav>
  );
}
```

### Protect Additional Routes

Edit `src/middleware.ts`:
```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",    // Add your protected routes
    "/settings/:path*",   // Add more as needed
    "/sign-in",
    "/sign-up"
  ],
};
```

### Customize User Fields

Edit `src/db/schema.ts` in the `user` table:
```typescript
export const user = pgTable("user", {
  // ... existing fields ...
  
  // Add your custom fields
  phoneNumber: text("phone_number"),
  dateOfBirth: timestamp("date_of_birth"),
  // etc.
});
```

Then run:
```bash
npm run db:push
```

### Add More OAuth Providers

Edit `src/lib/auth.ts`:
```typescript
export const auth = betterAuth({
  // ... existing config ...
  socialProviders: {
    google: { /* ... */ },
    github: {  // Add GitHub
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
```

## Production Deployment

1. Add production environment variables to your hosting platform
2. Update Google OAuth redirect URIs:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
3. Set `NEXT_PUBLIC_APP_URL` to your production domain
4. Run migrations on production database
5. Deploy!

## Tools & Commands

```bash
# View database in browser
npm run db:studio

# Generate migrations
npm run db:generate

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate
```

## Need Help?

Check these files:
- `AUTH_SETUP.md` - Detailed setup guide
- `MIGRATION_GUIDE.md` - Prisma to Drizzle migration
- `AUTH_IMPLEMENTATION_SUMMARY.md` - Complete technical overview

Or open an issue in the project repository.

---

**You're all set!** 🎊 Happy coding!

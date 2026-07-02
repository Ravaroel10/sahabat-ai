# Authentication Setup Guide

This project uses **Better Auth** with **Google OAuth2**, **Drizzle ORM**, and **PostgreSQL**.

## Prerequisites

1. PostgreSQL database (local or cloud)
2. Google OAuth2 credentials
3. Node.js and npm installed

## Step 1: Set Up PostgreSQL Database

### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (if not installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
psql -U postgres
CREATE DATABASE bantu_arah;
\q
```

### Option B: Cloud PostgreSQL (Recommended)
- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Railway**: https://railway.app (Free tier available)

Get your database connection string in this format:
```
postgresql://username:password@host:port/database
```

## Step 2: Get Google OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth2 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
5. Copy the Client ID and Client Secret

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
```env
# Database - PostgreSQL
DATABASE_URL="postgresql://username:password@host:port/bantu_arah"

# Google OAuth (required for authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Keep other variables as they are...
```

## Step 4: Run Database Migrations

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

## Step 5: Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/sign-in` to test authentication.

## Project Structure

```
src/
├── db/
│   ├── index.ts          # Database client
│   └── schema.ts         # Drizzle schema (all tables)
├── lib/
│   ├── auth.ts           # Better Auth server config
│   └── auth-client.ts    # Better Auth React client
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts  # Auth API routes
│   ├── sign-in/
│   │   └── page.tsx      # Sign-in page
│   └── dashboard/
│       └── page.tsx      # Protected dashboard
├── components/
│   └── auth/
│       ├── sign-in-button.tsx
│       └── user-button.tsx
└── middleware.ts         # Route protection
```

## Usage Examples

### Sign In with Google

```tsx
import { SignInButton } from "@/components/auth/sign-in-button";

export default function MyPage() {
  return <SignInButton />;
}
```

### Display User Info

```tsx
import { UserButton } from "@/components/auth/user-button";

export default function Header() {
  return (
    <header>
      <UserButton />
    </header>
  );
}
```

### Access Session on Client

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

### Access Session on Server

```tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function ServerPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Hello, {session.user.name}!</div>;
}
```

### Sign Out

```tsx
"use client";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return <button onClick={handleSignOut}>Sign out</button>;
}
```

## Database Schema

The schema includes Better Auth tables plus your application tables:

### Better Auth Tables
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth provider accounts
- `verification` - Email verification tokens

### Application Tables
- `social_program` - Social assistance programs
- `eligibility_record` - User eligibility records
- `document_template` - Document templates
- `document` - Generated documents
- `chat_history` - Chat conversations
- `need` - User needs
- `offer` - User offers
- `audit_log` - Audit trail

## Migration from Prisma

If you want to keep both Prisma and Drizzle temporarily:

1. Both can coexist - they're just different ways to access the database
2. Update your existing code to use Drizzle gradually
3. The User table schema is compatible with Better Auth requirements

To fully migrate:

1. Update all Prisma imports to use Drizzle
2. Replace `prisma.user.findUnique()` with Drizzle queries
3. Remove Prisma dependencies when ready:
   ```bash
   npm uninstall @prisma/client prisma
   ```

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if PostgreSQL is running
- Ensure database exists
- Check firewall/network settings for cloud databases

### Google OAuth Issues
- Verify redirect URIs match exactly
- Ensure Google+ API is enabled
- Check Client ID and Secret are correct
- Make sure you're using the correct environment (dev/prod)

### Session Issues
- Clear browser cookies
- Verify NEXT_PUBLIC_APP_URL matches your actual URL
- Check middleware configuration

## Additional Resources

- [Better Auth Docs](https://better-auth.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Google OAuth2 Setup](https://developers.google.com/identity/protocols/oauth2)

## Security Notes

- Never commit `.env` to version control
- Use strong database passwords
- Rotate OAuth secrets regularly
- Enable 2FA on Google Cloud Console
- Use HTTPS in production
- Keep dependencies updated

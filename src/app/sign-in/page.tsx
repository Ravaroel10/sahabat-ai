import { SignInButton } from "@/components/auth/sign-in-button";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to SAHABAT AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your account
          </p>
        </div>
        <div className="mt-8">
          <SignInButton />
        </div>
      </div>
    </div>
  );
}

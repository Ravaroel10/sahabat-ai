import { auth } from "@/lib/auth";

// Infer types from Better Auth instance
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

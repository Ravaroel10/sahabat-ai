import { createId } from "@paralleldrive/cuid2";

/**
 * Generate a unique CUID for database records
 * Compatible with Prisma's @default(cuid())
 */
export function generateId(): string {
  return createId();
}


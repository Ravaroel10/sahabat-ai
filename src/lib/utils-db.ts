import { createId } from "@paralleldrive/cuid2";

/**
 * Generate a unique CUID for database records
 * Generates a CUID2 compatible with database ID columns
 */
export function generateId(): string {
  return createId();
}


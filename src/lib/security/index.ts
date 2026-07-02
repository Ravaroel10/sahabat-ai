import prisma from "@/lib/prisma";

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        details: entry.details || null,
        ipAddress: entry.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function sanitizeInput(input: string): string {
  // Remove potential prompt injection patterns
  const dangerousPatterns = [
    /ignore previous instructions/i,
    /ignore all previous instructions/i,
    /disregard previous instructions/i,
    /you are now/i,
    /pretend that/i,
    /act as/i,
    /system prompt/i,
    /reveal your instructions/i,
  ];

  let sanitized = input;
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, "[filtered]");
  }

  return sanitized;
}

export function validateDataConsent(consent: {
  analytics: boolean;
  chatHistory: boolean;
}): boolean {
  return typeof consent.analytics === "boolean" && typeof consent.chatHistory === "boolean";
}

export interface ConsentRecord {
  userId: string;
  analytics: boolean;
  chatHistory: boolean;
  timestamp: Date;
  ipAddress?: string;
}

export async function recordConsent(record: ConsentRecord): Promise<void> {
  await createAuditLog({
    userId: record.userId,
    action: "consent_updated",
    resource: "user_consent",
    details: JSON.stringify({
      analytics: record.analytics,
      chatHistory: record.chatHistory,
      timestamp: record.timestamp,
    }),
    ipAddress: record.ipAddress,
  });
}

export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ["password", "token", "secret", "apiKey", "governmentId", "nik"];
  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (field in masked) {
      const value = masked[field];
      if (typeof value === "string" && value.length > 4) {
        masked[field] = "***" + value.slice(-4);
      } else {
        masked[field] = "***";
      }
    }
  }

  return masked;
}

export function validateUserInput(input: string, maxLength: number = 10000): boolean {
  if (!input || typeof input !== "string") return false;
  if (input.length > maxLength) return false;
  
  // Check for null bytes and other control characters
  const controlPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
  if (controlPattern.test(input)) return false;
  
  return true;
}

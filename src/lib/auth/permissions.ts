export type Role = "warga" | "relawan" | "ngo" | "admin";

export interface Permission {
  action: string;
  resource: string;
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  warga: [
    { action: "read", resource: "programs" },
    { action: "read", resource: "documents" },
    { action: "create", resource: "chat" },
    { action: "create", resource: "eligibility" },
    { action: "create", resource: "documents" },
    { action: "create", resource: "needs" },
    { action: "read", resource: "offers" },
    { action: "create", resource: "factcheck" },
  ],
 relawan: [
    { action: "read", resource: "programs" },
    { action: "read", resource: "documents" },
    { action: "create", resource: "chat" },
    { action: "create", resource: "eligibility" },
    { action: "create", resource: "documents" },
    { action: "create", resource: "needs" },
    { action: "read", resource: "offers" },
    { action: "create", resource: "factcheck" },
    { action: "create", resource: "offers" },
    { action: "read", resource: "analytics" },
    { action: "read", resource: "dashboard" },
  ],
  ngo: [
    { action: "read", resource: "programs" },
    { action: "read", resource: "documents" },
    { action: "create", resource: "chat" },
    { action: "create", resource: "eligibility" },
    { action: "create", resource: "documents" },
    { action: "create", resource: "needs" },
    { action: "read", resource: "offers" },
    { action: "create", resource: "factcheck" },
    { action: "create", resource: "offers" },
    { action: "read", resource: "analytics" },
    { action: "read", resource: "dashboard" },
    { action: "update", resource: "offers" },
    { action: "delete", resource: "offers" },
  ],
  admin: [
    { action: "manage", resource: "all" },
  ],
};

export function hasPermission(
  role: Role,
  action: string,
  resource: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  
  if (!permissions) return false;
  
  const hasSpecific = permissions.some(
    (p) =>
      (p.action === action || p.action === "manage") &&
      (p.resource === resource || p.resource === "all")
  );
  
  if (hasSpecific) return true;
  
  return permissions.some(
    (p) => p.action === "manage" && p.resource === "all"
  );
}

export function canAccessDashboard(role: Role): boolean {
  return hasPermission(role, "read", "dashboard") || hasPermission(role, "read", "analytics");
}

export function canModerate(role: Role): boolean {
  return role === "admin" || role === "ngo";
}

export function canViewAnalytics(role: Role): boolean {
  return hasPermission(role, "read", "analytics");
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case "warga":
      return "Warga";
    case "relawan":
      return "Relawan";
    case "ngo":
      return "NGO/Donatur";
    case "admin":
      return "Administrator";
    default:
      return role;
  }
}

export function getRoleDescription(role: Role): string {
  switch (role) {
    case "warga":
      return "Akses dasar untuk mencari informasi dan layanan";
    case "relawan":
      return "Akses untuk membantu warga dan melihat analytics";
    case "ngo":
      return "Akses penuh untuk mengelola bantuan dan analytics";
    case "admin":
      return "Akses penuh ke semua fitur dan pengaturan";
    default:
      return "";
  }
}

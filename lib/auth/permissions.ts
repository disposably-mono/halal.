import type { AdminRole } from "@prisma/client";

/**
 * Capability-based authorization for the admin panel.
 *
 * Roles map to a fixed set of capabilities, expressing a strict
 * separation-of-duties model:
 *   - SUPERADMIN (COMELEC account): manages admin accounts ONLY; cannot run elections.
 *   - CANVASSER (Canvassing Head): owns the results domain — closing elections and
 *     exporting/certifying results — and nothing else.
 *   - COMMISSIONER (Moderator/Chair/Vice): election setup — lifecycle, voters, candidates.
 *   - OFFICER: authenticated read access (dashboard + live monitor) only.
 *
 * This file is the single source of truth. Re-tune separation of duties by
 * editing ROLE_CAPABILITIES — every guard and UI gate derives from it.
 *
 * Keep this module free of any runtime Prisma/Node imports so it stays safe to
 * import from the Edge middleware (`@prisma/client` is a type-only import here).
 */
export type Capability =
  | "accounts:manage"
  | "election:lifecycle"
  | "election:close"
  | "voters:manage"
  | "voters:export"
  | "candidates:manage"
  | "results:export"
  | "admin:view";

export const ROLE_CAPABILITIES: Record<AdminRole, readonly Capability[]> = {
  SUPERADMIN: ["accounts:manage", "admin:view"],
  CANVASSER: ["election:close", "results:export", "admin:view"],
  COMMISSIONER: [
    "election:lifecycle",
    "voters:manage",
    "voters:export",
    "candidates:manage",
    "admin:view",
  ],
  OFFICER: ["admin:view"],
};

/** True when the given role is granted the capability. Unknown/undefined → false. */
export function can(
  role: AdminRole | string | undefined | null,
  cap: Capability,
): boolean {
  if (!role) return false;
  const caps = ROLE_CAPABILITIES[role as AdminRole];
  return caps ? caps.includes(cap) : false;
}

/** The full capability set for a role — convenient for computing UI gates. */
export function capabilitiesFor(
  role: AdminRole | string | undefined | null,
): Set<Capability> {
  if (!role) return new Set();
  return new Set(ROLE_CAPABILITIES[role as AdminRole] ?? []);
}

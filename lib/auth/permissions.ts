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
  | "recounts:run"
  | "admin:view"
  | "elections:view"
  | "voters:view"
  | "candidates:view"
  | "results:view"
  | "history:view";

export const ROLE_CAPABILITIES: Record<AdminRole, readonly Capability[]> = {
  SUPERADMIN: [
    "accounts:manage",
    "admin:view",
    "elections:view",
    "voters:view",
    "candidates:view",
    "results:view",
    "history:view",
  ],
  CANVASSER: [
    "election:close",
    "results:export",
    "recounts:run",
    "admin:view",
    "elections:view",
    "results:view",
  ],
  COMMISSIONER: [
    "election:lifecycle",
    "voters:manage",
    "voters:export",
    "candidates:manage",
    "admin:view",
    "elections:view",
    "voters:view",
    "candidates:view",
    "results:view",
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

/**
 * Roles an admin may assign through the accounts UI.
 *
 * SUPERADMIN is intentionally excluded: the COMELEC super-admin tier is fixed at
 * bootstrap (seed) and can never be granted, demoted, or transferred through the
 * app. This keeps account-management authority pinned to the known COMELEC
 * accounts and prevents privilege escalation via the very screen that hands out
 * roles.
 */
export const GRANTABLE_ROLES: readonly AdminRole[] = [
  "COMMISSIONER",
  "CANVASSER",
  "OFFICER",
];

/** True when a role may be assigned to / from an account through the accounts UI. */
export function isGrantableRole(
  role: AdminRole | string | undefined | null,
): role is AdminRole {
  return !!role && (GRANTABLE_ROLES as readonly string[]).includes(role);
}

// ─── User-facing permission messages ─────────────────────────────────────────
// Centralized here so every guard, action, and UI surface speaks with one voice
// instead of leaking raw "Forbidden"/"Unauthorized" discriminants.

export const PERMISSION_DENIED_MESSAGE =
  "You don't have permission to do this. Ask the COMELEC super-admin if you think this is a mistake.";

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";

/**
 * Turns the `requireCapabilityOrError` discriminant ("Unauthorized" | "Forbidden")
 * into a friendly, actionable sentence for toasts and error banners.
 */
export function permissionErrorMessage(error: string | undefined | null): string {
  return error === "Unauthorized" ? SESSION_EXPIRED_MESSAGE : PERMISSION_DENIED_MESSAGE;
}

/**
 * Per-capability explanation shown when a page/route refusal bounces the user back
 * to the dashboard via `?denied=<capability>`. Each line names who *is* allowed so
 * the refusal is self-explanatory.
 */
export const CAPABILITY_DENIED_MESSAGES: Record<Capability, string> = {
  "accounts:manage": "Only the COMELEC super-admin can manage admin accounts.",
  "election:lifecycle": "Only a Commissioner can set up or schedule elections.",
  "election:close": "Only the Canvassing Head can close an election.",
  "voters:manage": "Only a Commissioner can manage the voter roster.",
  "voters:export": "Only a Commissioner can export the voter roster.",
  "candidates:manage": "Only a Commissioner can manage candidates.",
  "results:export": "Only the Canvassing Head can export official results.",
  "recounts:run": "Only the Canvassing Head can initiate a recount.",
  "admin:view": "You don't have access to that page.",
  "elections:view": "You don't have access to that page.",
  "voters:view": "You don't have access to that page.",
  "candidates:view": "You don't have access to that page.",
  "results:view": "You don't have access to that page.",
  "history:view": "You don't have access to that page.",
};

/**
 * Resolves a `?denied=` query value into a dashboard banner message. Accepts a
 * known capability, the legacy `"1"` sentinel, or anything else (→ generic copy).
 * Returns null when there is nothing to show.
 */
export function deniedMessage(denied: string | undefined | null): string | null {
  if (!denied) return null;
  return (
    CAPABILITY_DENIED_MESSAGES[denied as Capability] ??
    "You don't have permission to access that page."
  );
}

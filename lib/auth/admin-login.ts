import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { findDifferentOfficerKeyMatch } from "@/lib/auth/officer-key";

const DUMMY_PASSWORD_HASH =
  "$2b$12$vluSzNas.K9RRXVA9825bOgkOpRXCn1mK7G9A8q1Y3an7O9CrhexC";

export type AdminCredentialFailure =
  | "primary"
  | "officerKey"
  | "ownOfficerKey"
  | "noOtherOfficer";

export type AdminCredentialResult =
  | {
      ok: true;
      admin: {
        id: string;
        email: string;
        name: string;
        role: "SUPERADMIN" | "COMMISSIONER" | "CANVASSER" | "OFFICER";
      };
      verifier?: {
        id: string;
        email: string;
        name: string;
      };
    }
  | { ok: false; reason: AdminCredentialFailure };

export class AdminCredentialUnavailableError extends Error {
  constructor() {
    super("Unable to verify credentials right now. Please try again.");
    this.name = "AdminCredentialUnavailableError";
  }
}

export async function checkAdminCredentials(
  email: string,
  password: string,
  officerKey?: string,
): Promise<AdminCredentialResult> {
  if (!email || !password) return { ok: false, reason: "primary" };

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        officerKey: true,
      },
    });

    const passwordValid = await bcrypt.compare(
      password,
      admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!admin || !passwordValid) return { ok: false, reason: "primary" };

    if (officerKey === undefined) return { ok: true, admin };

    const otherAdmins = await prisma.adminUser.findMany({
      where: { id: { not: admin.id } },
      select: { id: true, email: true, name: true, officerKey: true },
    });
    if (otherAdmins.length === 0) {
      return { ok: false, reason: "noOtherOfficer" };
    }

    const keyMatch = await findDifferentOfficerKeyMatch(
      officerKey,
      admin.officerKey,
      otherAdmins.map((otherAdmin) => otherAdmin.officerKey),
    );
    if (keyMatch.result !== "valid") {
      return { ok: false, reason: keyMatch.result };
    }

    const verifier = otherAdmins[keyMatch.matchIndex];

    return {
      ok: true,
      admin,
      verifier: {
        id: verifier.id,
        email: verifier.email,
        name: verifier.name,
      },
    };
  } catch (error) {
    console.error("admin-login: credential verification failed", error);
    throw new AdminCredentialUnavailableError();
  }
}

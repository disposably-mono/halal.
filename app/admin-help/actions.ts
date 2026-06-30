"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_HELP_COOKIE,
  signAdminHelpAccess,
} from "@/lib/admin-help-access";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/server/rate-limit";

export type AdminHelpAccessState = { error: string } | null;

export async function unlockAdminHelp(
  _previous: AdminHelpAccessState,
  formData: FormData,
): Promise<AdminHelpAccessState> {
  const officerKey = formData.get("officerKey");
  if (typeof officerKey !== "string" || officerKey.length < 6) {
    return { error: "Enter a valid officer key." };
  }

  // This unlock compares the submitted key against every officer's hash, so it
  // is a prime brute-force target. Throttle per-IP before the bcrypt loop runs.
  const ip = await clientIp();
  if (!rateLimit(`admin-help-unlock:${ip}`, RATE_LIMITS.adminHelpUnlock).ok) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  let officers: { officerKey: string }[];
  try {
    officers = await prisma.adminUser.findMany({
      select: { officerKey: true },
    });
  } catch {
    return { error: "Officer verification is unavailable right now. Try again shortly." };
  }

  let valid = false;
  for (const officer of officers) {
    if (await bcrypt.compare(officerKey, officer.officerKey)) {
      valid = true;
      break;
    }
  }

  if (!valid) return { error: "That officer key was not recognized." };

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_HELP_COOKIE, signAdminHelpAccess(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 30,
    path: "/admin-help",
  });

  redirect("/admin-help");
}

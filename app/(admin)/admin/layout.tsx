import type { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { AdminShell } from "./_components/AdminShell";
import type { NavSectionModel } from "./_components/nav-model";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const role = session.user?.role;
  const canManageAccounts = can(role, "accounts:manage");
  const canCreateElection = can(role, "election:lifecycle");
  const canViewVoters = can(role, "voters:view");
  const canViewCandidates = can(role, "candidates:view");
  const canViewHistory = can(role, "history:view");

  const adminName = session.user?.name ?? "Admin";
  const adminInitial = adminName[0]?.toUpperCase() ?? "A";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  // Serializable nav model, built AFTER the capability filter so unauthorized
  // links never reach the client component.
  const navSections: NavSectionModel[] = [
    {
      label: "Overview",
      items: [{ href: "/admin", label: "Dashboard", iconKey: "dashboard", exact: true }],
    },
    ...(canCreateElection
      ? [
          {
            label: "Elections",
            items: [
              { href: "/admin/elections/new", label: "New Election", iconKey: "new-election" as const },
            ],
          },
        ]
      : []),
    {
      label: "Reports",
      items: [
        { href: "/admin/results", label: "Results", iconKey: "results" as const },
        ...(canViewVoters
          ? [{ href: "/admin/voters", label: "Voters", iconKey: "voters" as const }]
          : []),
        ...(canViewCandidates
          ? [{ href: "/admin/candidates", label: "Candidates", iconKey: "candidates" as const }]
          : []),
      ],
    },
    ...(canManageAccounts || canViewHistory
      ? [
          {
            label: "Administration",
            items: [
              ...(canManageAccounts
                ? [{ href: "/admin/accounts", label: "Accounts", iconKey: "accounts" as const }]
                : []),
              ...(canViewHistory
                ? [{ href: "/admin/history", label: "History", iconKey: "history" as const }]
                : []),
            ],
          },
        ]
      : []),
  ];

  const signOutForm = (
    <form action={handleSignOut}>
      <button
        type="submit"
        aria-label="Sign out"
        className="text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer bg-transparent border-0 rounded-[4px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        Sign out
      </button>
    </form>
  );

  return (
    <AdminShell
      sections={navSections}
      adminName={adminName}
      adminInitial={adminInitial}
      signOutForm={signOutForm}
    >
      {children}
    </AdminShell>
  );
}

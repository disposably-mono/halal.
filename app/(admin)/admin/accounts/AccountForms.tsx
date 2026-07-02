"use client";

import { useEffect, useState, useTransition } from "react";
import type { AdminRole } from "@prisma/client";
import { useServerActionForm } from "@/lib/client/use-server-action-form";
import {
  createAdmin,
  updateAdminRole,
  resetAdminPassword,
  resetAdminOfficerKey,
  deleteAdmin,
  type AccountActionResult,
} from "./actions";
import { AdminInput, AdminSecretInput, Card, ConfirmDialog, Toast } from "@/components/admin/ui";
import { ThemedSelect } from "@/components/admin/ThemedSelect";
import { Button } from "@/components/ui/button";
import { GRANTABLE_ROLES } from "@/lib/auth/permissions";

// ─── Types & constants ──────────────────────────────────────────────────────

export type Account = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  lastLogin: string | null;
  createdAt: string;
};

// SUPERADMIN is intentionally absent: the COMELEC tier is fixed and never granted
// through the UI (server enforces this too). Existing super-admins render as a
// locked pill instead of a dropdown.
const ROLE_OPTIONS: readonly AdminRole[] = GRANTABLE_ROLES;

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPERADMIN: "COMELEC · Super-admin",
  COMMISSIONER: "Commissioner",
  CANVASSER: "Canvassing Head",
  OFFICER: "Officer",
};

const ROLE_HINTS: Record<AdminRole, string> = {
  SUPERADMIN: "Manages accounts only — cannot run elections",
  COMMISSIONER: "Election lifecycle, voters & candidates",
  CANVASSER: "Closes elections & exports results",
  OFFICER: "Read-only monitor & dashboard",
};

const ROLE_SELECT_OPTIONS = ROLE_OPTIONS.map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

type ToastState = { msg: string; color: "green" | "red" | "amber" | "blue" } | null;

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Manager (owns toast state) ─────────────────────────────────────────────

export function AccountsManager({
  accounts,
  currentUserId,
  superadminCount,
}: {
  accounts: Account[];
  currentUserId: string;
  superadminCount: number;
}) {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="flex flex-col gap-[18px]">
      <CreateAdminForm onResult={setToast} />

      <Card title="Accounts" noPad>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Account", "Role", "Last login", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-[7px] text-[10px] font-semibold uppercase tracking-[0.06em] text-white/35"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  isSelf={account.id === currentUserId}
                  isLastSuperadmin={
                    account.role === "SUPERADMIN" && superadminCount <= 1
                  }
                  onResult={setToast}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && <Toast msg={toast.msg} color={toast.color} />}
    </div>
  );
}

// ─── Create form ────────────────────────────────────────────────────────────

function CreateSubmit({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} variant="adminPrimary" size="adminMd">
      {isPending ? "Creating…" : "Create account"}
    </Button>
  );
}

function CreateAdminForm({ onResult }: { onResult: (t: ToastState) => void }) {
  const { state: result, isPending, handleSubmit } = useServerActionForm<AccountActionResult | null>(
    createAdmin,
    null,
    { shouldRefresh: (nextResult) => Boolean(nextResult?.success) },
  );

  useEffect(() => {
    if (result?.success) onResult({ msg: "Account created.", color: "green" });
  }, [result, onResult]);

  return (
    <Card title="New account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <AdminInput name="name" placeholder="Juan Dela Cruz" required />
          </Field>
          <Field label="Email">
            <AdminInput name="email" type="email" placeholder="name@olps.edu" required />
          </Field>
          <Field label="Role">
            <ThemedSelect
              name="role"
              defaultValue="OFFICER"
              required
              options={ROLE_SELECT_OPTIONS}
            />
          </Field>
          <div className="hidden sm:block" />
          <Field label="Password" hint="Min 8 characters">
            <AdminSecretInput name="password" secretLabel="password" placeholder="••••••••" required />
          </Field>
          <Field label="Officer key" hint="Min 6 characters — unique per officer">
            <AdminSecretInput name="officerKey" secretLabel="officer key" placeholder="••••••" required />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-white/40">
            Share the password and officer key with the officer out-of-band.
          </p>
          <CreateSubmit isPending={isPending} />
        </div>

        {result && !result.success && (
          <p className="text-[11px] text-red-400">✗ {result.error}</p>
        )}
      </form>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className="text-[10px] text-white/50">
        {label}
        {hint && <span className="text-white/30"> · {hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Account row ────────────────────────────────────────────────────────────

function AccountRow({
  account,
  isSelf,
  isLastSuperadmin,
  onResult,
}: {
  account: Account;
  isSelf: boolean;
  isLastSuperadmin: boolean;
  onResult: (t: ToastState) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [secretOpen, setSecretOpen] = useState<null | "password" | "officerKey">(null);
  const [secretValue, setSecretValue] = useState("");

  const isSuperadmin = account.role === "SUPERADMIN";

  function notify(result: AccountActionResult, okMsg: string) {
    if (result.success) onResult({ msg: okMsg, color: "green" });
    else onResult({ msg: result.error, color: "red" });
  }

  function onRoleChange(role: string) {
    if (role === account.role) return;
    startTransition(async () => {
      notify(await updateAdminRole(account.id, role), "Role updated.");
    });
  }

  function submitSecret() {
    const kind = secretOpen;
    if (!kind) return;
    const value = secretValue;
    startTransition(async () => {
      const result =
        kind === "password"
          ? await resetAdminPassword(account.id, value)
          : await resetAdminOfficerKey(account.id, value);
      notify(result, kind === "password" ? "Password reset." : "Officer key reset.");
      if (result.success) {
        setSecretOpen(null);
        setSecretValue("");
      }
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteAdmin(account.id);
      notify(result, "Account deleted.");
      if (result.success) setConfirmDelete(false);
    });
  }

  return (
    <tr className="border-b border-white/[0.03] last:border-0 align-top">
      {/* Account */}
      <td className="px-4 py-[10px]">
        <div className="text-[12px] font-medium text-white/85">
          {account.name}
          {isSelf && <span className="ml-2 text-[9px] text-amber-400/80">you</span>}
        </div>
        <div className="font-mono text-[11px] text-white/45">{account.email}</div>
      </td>

      {/* Role */}
      <td className="px-4 py-[10px]">
        {isSuperadmin ? (
          <div className="inline-flex items-center gap-[6px] rounded-[7px] border border-amber-400/25 bg-amber-400/[0.07] px-[10px] py-[7px] text-[12px] font-medium text-amber-300/90">
            <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            {ROLE_LABELS.SUPERADMIN}
          </div>
        ) : (
          <ThemedSelect
            value={account.role}
            disabled={pending}
            onValueChange={onRoleChange}
            options={ROLE_SELECT_OPTIONS}
            className="min-w-[170px]"
          />
        )}
        <div className="mt-[3px] text-[10px] text-white/35">
          {isSuperadmin ? "COMELEC tier — locked" : ROLE_HINTS[account.role]}
        </div>
      </td>

      {/* Last login */}
      <td className="px-4 py-[10px] text-[11px] text-white/50">
        {formatDate(account.lastLogin)}
      </td>

      {/* Actions */}
      <td className="px-4 py-[10px]">
        <div className="flex flex-wrap gap-[6px]">
          <RowButton onClick={() => { setSecretOpen("password"); setSecretValue(""); }}>
            Reset password
          </RowButton>
          <RowButton onClick={() => { setSecretOpen("officerKey"); setSecretValue(""); }}>
            Reset key
          </RowButton>
          <RowButton
            tone="danger"
            disabled={isSelf || isLastSuperadmin}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </RowButton>
        </div>

        {secretOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AdminSecretInput
              secretLabel={secretOpen === "password" ? "password" : "officer key"}
              autoFocus
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder={secretOpen === "password" ? "New password" : "New officer key"}
              className="min-w-[180px]"
            />
            <Button
              onClick={submitSecret}
              disabled={pending || secretValue.length === 0}
              variant="adminPrimary"
              size="adminMd"
            >
              Save
            </Button>
            <Button
              onClick={() => { setSecretOpen(null); setSecretValue(""); }}
              variant="adminGhost"
              size="adminMd"
            >
              Cancel
            </Button>
          </div>
        )}
      </td>

      <td className="p-0">
        <ConfirmDialog
          open={confirmDelete}
          title="Delete account?"
          body={`${account.name} (${account.email}) will lose all access. This cannot be undone.`}
          confirmLabel="Delete"
          confirmVariant="adminDestructive"
          isPending={pending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={onDelete}
        />
      </td>
    </tr>
  );
}

function RowButton({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  const base =
    "rounded-[5px] border px-[8px] py-[3px] text-[10px] transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const tones =
    tone === "danger"
      ? "border-red-400/20 bg-red-400/[0.06] text-red-300 hover:bg-red-400/[0.12]"
      : "border-white/[0.1] bg-white/[0.03] text-white/60 hover:bg-white/[0.07]";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${tones}`}>
      {children}
    </button>
  );
}

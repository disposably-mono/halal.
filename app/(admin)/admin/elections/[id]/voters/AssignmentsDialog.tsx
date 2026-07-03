"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildAssignmentsTsv,
  type VoterAssignment,
} from "@/lib/domain/assignments-export";

/**
 * Admin helper: shows the control-number → Student ID assignment table in a
 * dialog with one-click TSV copy (pastes cleanly into Sheets/Excel). Reuses the
 * ConfirmDialog overlay styling for visual consistency.
 */
export function AssignmentsDialog({
  voters,
}: {
  voters: readonly VoterAssignment[];
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildAssignmentsTsv(voters));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-white/12 bg-white/4 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 transition-colors hover:bg-white/8 hover:text-white/90"
      >
        Copy Assignments
      </button>

      {open && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[80vh] w-[90%] max-w-[560px] flex-col rounded-[14px] border border-white/12 bg-admin-raised">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
              <p className="text-[13px] font-bold text-white/90">
                Control Number Assignments
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded text-white/40 transition-colors hover:text-white/80"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="overflow-auto px-5 py-3">
              {voters.length === 0 ? (
                <p className="py-6 text-center text-[12px] text-white/40">
                  No voters registered yet.
                </p>
              ) : (
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="text-left text-white/40">
                      <th className="py-1 pr-4 font-semibold uppercase tracking-[0.08em]">
                        Control #
                      </th>
                      <th className="py-1 pr-4 font-semibold uppercase tracking-[0.08em]">
                        Student ID
                      </th>
                      <th className="py-1 pr-4 font-semibold uppercase tracking-[0.08em]">
                        Grade
                      </th>
                      <th className="py-1 font-semibold uppercase tracking-[0.08em]">
                        Section
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {voters.map((v) => (
                      <tr
                        key={v.voterCode}
                        className="border-t border-white/5"
                      >
                        <td className="py-1 pr-4 text-gold/80">
                          {v.voterCode}
                        </td>
                        <td className="py-1 pr-4 text-white/70">
                          {v.studentId}
                        </td>
                        <td className="py-1 pr-4 text-white/50">
                          {v.gradeLevel}
                        </td>
                        <td className="py-1 text-white/50">{v.section}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/8 px-5 py-3">
              <Button
                onClick={handleCopy}
                disabled={voters.length === 0}
                variant="adminPrimary"
                size="adminMd"
              >
                {copied ? "Copied!" : "Copy as TSV"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

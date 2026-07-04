"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ADMIN_STATUS_LABELS, type AdminStatus } from "./types";

function BarsIcon() {
  return (
    <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ElectionSubNav({
  electionId,
  status,
  candidatesFinalized,
  votersFinalized,
}: {
  electionId: string;
  status: AdminStatus;
  candidatesFinalized: boolean;
  votersFinalized: boolean;
}) {
  const pathname = usePathname();
  const base = `/admin/elections/${electionId}`;
  const tabs = [
    { href: `${base}/candidates`, label: "Candidates", step: 1, done: candidatesFinalized, disabled: false },
    { href: `${base}/voters`, label: "Voters", step: 2, done: votersFinalized, disabled: false },
    { href: `${base}/control`, label: "Control", step: 3, done: status !== "DRAFT", disabled: false },
    { href: `${base}/monitor`, label: "Monitor", step: null, done: false, disabled: status === "DRAFT" || status === "SCHEDULED" },
  ];

  return (
    <div className="overflow-x-auto border-b border-white/6 bg-admin-bg">
      <div className="mx-auto flex h-[47px] min-w-max max-w-7xl items-center gap-[4px] px-[18px] sm:px-[27px]" aria-label="Election setup navigation">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const marker = tab.step ? (
            <span className={`flex h-[19px] w-[19px] items-center justify-center rounded-full border text-[10px] font-bold ${tab.done
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
              : isActive
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-white/12 text-white/60"
              }`}>
              {tab.done ? "✓" : tab.step}
            </span>
          ) : <BarsIcon />;

          return tab.disabled ? (
            <span key={tab.label} className="ml-[9px] flex cursor-not-allowed select-none items-center gap-[6px] border-l border-white/8 px-[13px] py-[6px] text-[12px] text-white/60" title="Available once the election opens">
              {marker}
              {tab.label}
            </span>
          ) : (
            <Link key={tab.label} href={tab.href} className={`relative flex items-center gap-[7px] rounded-[7px] px-[11px] py-[7px] text-[12px] no-underline transition-all ${tab.step === null ? "ml-[9px] border-l border-white/8 pl-[16px]" : ""} ${isActive ? "bg-white/6 text-white/90" : "text-white/50 hover:bg-white/3 hover:text-white/70"}`}>
              {isActive && <span className="absolute bottom-[0px] left-[9px] right-[9px] h-[2px] rounded-t-[2px] bg-gold" />}
              {marker}
              {tab.label}
              {tab.step && tab.step < 3 && <span className="ml-[4px] text-white/12">›</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SetupStepper({
  votersFinalized,
  candidatesFinalized,
  status,
}: {
  votersFinalized: boolean;
  candidatesFinalized: boolean;
  status: AdminStatus;
}) {
  const electionLaunched = status === "OPEN" || status === "CLOSED" || status === "SCHEDULED";
  const steps = [
    { label: "Candidates", done: candidatesFinalized },
    { label: "Voters", done: votersFinalized },
    { label: "Control", done: electionLaunched },
  ];
  const firstIncomplete = steps.findIndex((step) => !step.done);

  return (
    <div className="flex items-center gap-[0px]">
      {steps.map((step, i) => {
        const isCurrent = !step.done && i === firstIncomplete;
        return (
          <div key={step.label} className="flex items-center">
            {i > 0 && <div className={`h-px w-[36px] ${steps[i - 1].done ? "bg-emerald-400/40" : "bg-white/8"}`} />}
            <div className="flex items-center gap-[7px]">
              <div className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${step.done ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-400" : isCurrent ? "border-gold/40 bg-gold/15 text-gold" : "border-white/10 bg-white/4 text-white/60"}`}>
                {step.done ? <CheckIcon /> : <span>{i + 1}</span>}
              </div>
              <span className={`text-[12px] font-medium ${step.done ? "text-emerald-400/70" : isCurrent ? "text-gold/80" : "text-white/60"}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SetupNextStep({
  href,
  title,
  description,
  label,
}: {
  href: string;
  title: string;
  description: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-[13px] rounded-xl border border-gold/20 bg-gold/5 px-[18px] py-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[13px] font-semibold text-white/80">{title}</p>
        <p className="mt-[2px] text-[11px] text-white/40">{description}</p>
      </div>
      <Button asChild variant="adminPrimary" size="adminMd" className="shrink-0">
        <Link href={href}>
          {label}
          <span aria-hidden="true">→</span>
        </Link>
      </Button>
    </div>
  );
}

export { ADMIN_STATUS_LABELS };

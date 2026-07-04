"use client";

import type { ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement, useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-[18px] py-[27px] sm:px-[27px]", className)}>
      {children}
    </div>
  );
}

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

export function Breadcrumb({ items }: { items: readonly BreadcrumbItem[] }) {
  const visibleItems = items.length > 2 ? items.slice(-2) : items;

  return (
    <nav aria-label="Breadcrumb" className="overflow-hidden text-[12px] text-white/45">
      <ol className="flex items-center gap-[9px]">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-[0px] items-center gap-[9px]">
              {index > 0 && <span className="shrink-0 text-gold/60">/</span>}
              {item.href && !isLast ? (
                <Link href={item.href} className="truncate text-white/45 no-underline transition-colors hover:text-gold">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="truncate text-white/70">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  breadcrumb,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-[13px] sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-[0px]">
        {breadcrumb}
        {eyebrow && <p className="mt-[9px] text-[11px] font-semibold uppercase tracking-[0.12em] text-gold/70">{eyebrow}</p>}
        <h1 className="mt-[4px] truncate font-display text-[36px] leading-none tracking-normal text-white/95 sm:text-[43px]">
          {title}
        </h1>
        {meta && <div className="mt-[9px] text-[13px] text-white/50">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-[9px]">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-[11px] rounded-[13px] border border-white/[0.07] bg-admin-surface py-[54px] text-center">
      {icon && <div className="flex h-[45px] w-[45px] items-center justify-center rounded-[11px] border border-white/[0.07] text-white/60">{icon}</div>}
      <div className="text-[15px] font-medium text-white/60">{title}</div>
      {hint && <div className="max-w-sm text-[12px] text-white/40">{hint}</div>}
      {action && <div className="mt-[4px]">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const generatedId = useId();
  const inputId = htmlFor ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
      id: (children.props as { id?: string }).id ?? inputId,
      "aria-describedby": describedBy,
      "aria-invalid": Boolean(error) || undefined,
    })
    : children;

  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={inputId} className="text-[11px] text-white/50">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      {control}
      {hint && <p id={hintId} className="text-[11px] text-white/35">{hint}</p>}
      {error && <p id={errorId} className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

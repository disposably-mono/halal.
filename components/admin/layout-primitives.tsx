"use client";

import type { ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement, useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6", className)}>
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
    <nav aria-label="Breadcrumb" className="overflow-hidden text-[11px] text-white/45">
      <ol className="flex items-center gap-2">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
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
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb}
        {eyebrow && <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold/70">{eyebrow}</p>}
        <h1 className="mt-1 truncate font-display text-[32px] leading-none tracking-normal text-white/95 sm:text-[38px]">
          {title}
        </h1>
        {meta && <div className="mt-2 text-[12px] text-white/50">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
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
    <div className="flex flex-col items-center gap-[10px] rounded-[12px] border border-white/[0.07] bg-admin-surface py-12 text-center">
      {icon && <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/[0.07] text-white/60">{icon}</div>}
      <div className="text-[13px] font-medium text-white/60">{title}</div>
      {hint && <div className="max-w-sm text-[11px] text-white/40">{hint}</div>}
      {action && <div className="mt-1">{action}</div>}
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
    <div className="flex flex-col gap-[5px]">
      <label htmlFor={inputId} className="text-[10px] text-white/50">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      {control}
      {hint && <p id={hintId} className="text-[10px] text-white/35">{hint}</p>}
      {error && <p id={errorId} className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

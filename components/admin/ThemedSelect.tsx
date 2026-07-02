"use client";

import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

// A fully themed dropdown built on Radix Select. Native <select> popups are
// rendered by the OS and ignore CSS on most Linux/Chromium setups (the popup
// stays white), so we render our own portal-based listbox instead. Radix also
// renders a hidden native <select> for `name`, so FormData submission and native
// `required` validation keep working unchanged.

export type ThemedSelectOption = { value: string; label: string };

interface ThemedSelectProps {
  options: readonly ThemedSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Extra classes for the trigger button (width, padding overrides, etc.). */
  className?: string;
  ariaLabel?: string;
}

const triggerClass =
  "group inline-flex w-full items-center justify-between gap-2 rounded-[7px] border border-white/[0.10] bg-white/[0.04] px-[10px] py-[7px] text-[12px] font-mono text-white/80 outline-none transition-colors hover:border-white/20 focus:border-gold/50 focus:ring-2 focus:ring-gold/10 disabled:cursor-not-allowed disabled:opacity-40 data-[placeholder]:text-white/40";

const contentClass =
  "z-[10000] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[8px] border border-white/[0.10] bg-admin-raised shadow-xl";

const itemClass =
  "relative flex cursor-pointer select-none items-center justify-between gap-3 rounded-[5px] px-[10px] py-[6px] text-[12px] font-mono text-white/75 outline-none data-[highlighted]:bg-gold/15 data-[highlighted]:text-gold data-[state=checked]:text-gold data-[disabled]:opacity-40";

function ChevronIcon() {
  return (
    <svg style={{ width: 12, height: 12 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg style={{ width: 11, height: 11 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ThemedSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  disabled,
  placeholder,
  className,
  ariaLabel,
}: ThemedSelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      required={required}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger className={cn(triggerClass, className)} aria-label={ariaLabel}>
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="text-white/40 transition-colors group-hover:text-white/60">
          <ChevronIcon />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" sideOffset={4} className={contentClass}>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item key={opt.value} value={opt.value} className={itemClass}>
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="text-gold">
                  <CheckIcon />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

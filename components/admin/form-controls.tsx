"use client";

import type { ComponentProps } from "react";
import { SecretInput } from "@/components/ui/secret-input";
import { cn } from "@/lib/utils";

export const adminInputClass =
  "bg-white/4 border border-white/10 rounded-[7px] px-[10px] py-[7px] text-[12px] text-white/80 font-mono outline-hidden transition-colors focus:border-gold/50 focus:ring-2 focus:ring-gold/10 w-full scheme-dark disabled:opacity-40 disabled:cursor-not-allowed";

export function AdminInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(adminInputClass, className)} {...props} />;
}

export function AdminSecretInput({ className, ...props }: ComponentProps<typeof SecretInput>) {
  return <SecretInput className={cn(adminInputClass, className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(adminInputClass, className)} {...props} />;
}

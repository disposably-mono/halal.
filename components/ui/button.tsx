import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        // Admin theme — dark navy + amber accents. Always pair with size="adminMd" or "adminSm".
        adminPrimary:
          "font-semibold bg-amber-400 text-[#0b1220] hover:opacity-90 active:scale-[0.97] focus-visible:border-amber-200 focus-visible:ring-amber-400/30 disabled:opacity-40",
        adminGhost:
          "font-semibold text-white/60 border border-white/[0.10] bg-transparent hover:text-white/80 hover:border-white/[0.20] active:scale-[0.97] focus-visible:border-amber-400/45 focus-visible:ring-amber-400/20 disabled:opacity-30",
        adminEmerald:
          "font-semibold bg-emerald-400 text-[#0b1220] hover:opacity-90 active:scale-[0.97] focus-visible:border-emerald-200 focus-visible:ring-emerald-400/30 disabled:opacity-30",
        adminBlue:
          "font-semibold bg-blue-400/[0.10] text-blue-400 border border-blue-400/25 hover:bg-blue-400/20 active:scale-[0.97] focus-visible:border-blue-400/50 focus-visible:ring-blue-400/25 disabled:opacity-30",
        adminDestructive:
          "font-semibold bg-red-400/[0.10] text-red-400 border border-red-400/25 hover:bg-red-400/20 active:scale-[0.97] focus-visible:border-red-400/50 focus-visible:ring-red-400/25 disabled:opacity-30",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        // Admin sizes — preserve original BTN_PRIMARY/BTN_SM dimensions.
        adminMd: "h-auto rounded-[7px] gap-[5px] px-[13px] py-[7px] text-[12px]",
        adminSm: "h-auto rounded-[7px] gap-[5px] px-[10px] py-[5px] text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

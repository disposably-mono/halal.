import type { ToastVariant } from "@/components/admin/toast";

export type ControlToastAction =
  | "open"
  | "close"
  | "recount"
  | "reschedule"
  | "advance"
  | "archive"
  | "restore";

export function getControlSuccessToast(action: ControlToastAction): { msg: string; variant: ToastVariant } {
  const messages: Record<ControlToastAction, { msg: string; variant: ToastVariant }> = {
    open: { msg: "Election is now OPEN", variant: "success" },
    close: { msg: "Election closed", variant: "warning" },
    recount: { msg: "Recount completed", variant: "success" },
    reschedule: { msg: "Schedule updated", variant: "warning" },
    advance: { msg: "Advanced to Scheduled", variant: "info" },
    archive: { msg: "Election archived", variant: "warning" },
    restore: { msg: "Election restored", variant: "success" },
  };
  return messages[action];
}

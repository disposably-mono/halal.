import type { ReactNode } from "react";

// This layout wraps all /admin/** pages.
// The dashboard page renders its own topbar + sidebar.
// Sub-pages (candidates, voters, control) render inside this bg.

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#0b1220", color: "rgba(255,255,255,0.9)" }}
    >
      {children}
    </div>
  );
}

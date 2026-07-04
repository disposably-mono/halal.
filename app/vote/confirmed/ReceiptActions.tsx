"use client";

import Link from "next/link";
import { useEffect } from "react";

export function ReceiptActions() {
  useEffect(() => {
    void fetch("/api/ballot-confirmation", { method: "DELETE", keepalive: true });
  }, []);

  return (
    <div className="print:hidden flex flex-wrap justify-center gap-[14px]">
      <button
        type="button"
        onClick={() => window.print()}
        className="px-[27px] py-[14px] bg-gold text-navy-deep font-heading text-[14px] tracking-[0.16em] uppercase rounded-sm"
      >
        Print Receipt
      </button>
      <Link
        href="/verify"
        className="px-[27px] py-[14px] border border-white/15 text-white/70 font-heading text-[14px] tracking-[0.16em] uppercase hover:border-gold/30 hover:text-gold transition-colors rounded-sm"
      >
        Verify Later
      </Link>
    </div>
  );
}

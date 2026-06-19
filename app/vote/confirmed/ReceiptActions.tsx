"use client";

import Link from "next/link";

export function ReceiptActions() {
  return (
    <div className="print:hidden flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="px-6 py-3 bg-gold text-navy-deep font-heading text-xs tracking-[0.16em] uppercase rounded-sm"
      >
        Print Receipt
      </button>
      <Link
        href="/verify"
        className="px-6 py-3 border border-white/15 text-white/70 font-heading text-xs tracking-[0.16em] uppercase hover:border-gold/30 hover:text-gold transition-colors rounded-sm"
      >
        Verify Later
      </Link>
    </div>
  );
}

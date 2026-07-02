"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root client error boundary. Catches render/runtime crashes anywhere in the
 * route tree and shows a branded, generic screen. The real error is logged to
 * the console for operators; it is never rendered to the user.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy-deep px-6 text-center">
      <p className="mb-3 font-tagline text-sm italic text-white/30">
        VOX POPULI VOX DEI
      </p>
      <h1 className="font-display text-6xl uppercase tracking-wide text-white">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md font-body text-sm leading-6 text-white/60">
        An unexpected error interrupted your request. Your data is safe. Please
        try again.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="rounded-sm bg-gold px-6 py-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-gold/90"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-sm border border-white/15 px-6 py-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";

/** Branded 404 for unmatched routes. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy-deep px-6 text-center">
      <p className="mb-3 font-tagline text-sm italic text-white/30">
        VOX POPULI VOX DEI
      </p>
      <h1 className="font-display text-7xl uppercase tracking-wide text-gold">
        404
      </h1>
      <p className="mt-3 font-heading text-lg uppercase tracking-[0.2em] text-white/80">
        Page not found
      </p>
      <p className="mt-4 max-w-md font-body text-sm leading-6 text-white/60">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-sm bg-gold px-6 py-3 font-heading text-sm font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-gold/90"
      >
        Go Home
      </Link>
    </main>
  );
}

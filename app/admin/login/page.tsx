"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [officerKey, setOfficerKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasError = error.length > 0;

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      officerKey,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid credentials or officer key. Please try again.");
      setOfficerKey("");
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1225] p-4 font-sans">

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: 600,
          height: 500,
          background:
            "radial-gradient(circle at 50% 30%, rgba(212,168,67,0.08) 0%, transparent 65%)",
        }}
      />

      <div className="relative w-full max-w-[360px] space-y-5">

        {/* ── Wordmark ── */}
        <div className="space-y-1.5 text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
            OLPS COMELEC
          </p>
          <h1 className="text-[42px] font-semibold leading-none tracking-[-1.5px] text-white/90">
            halal.
          </h1>
          <p className="text-[12px] italic tracking-[0.06em] text-white/35">
            VOX POPULI VOX DEI
          </p>
        </div>

        {/* ── Card ── */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1a2540]">

          {/* Card header */}
          <div className="border-b border-white/[0.08] px-6 py-5">
            <h2 className="text-[14px] font-semibold text-white/90">
              {step === 1 ? "Admin Sign In" : "Officer Verification"}
            </h2>
            <p className="mt-0.5 text-[12px] text-white/40">
              {step === 1
                ? "Enter your COMELEC admin credentials."
                : "Enter your unique personal officer key to complete sign in."}
            </p>
          </div>

          {/* Form body */}
          <div className="px-6 py-5">
            {step === 1 ? (
              <form onSubmit={handleStep1} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="admin-email"
                    className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/40"
                  >
                    Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="comelec@olps.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/35 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] focus-visible:ring-2 focus-visible:ring-amber-400/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="admin-password"
                    className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/40"
                  >
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/35 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] focus-visible:ring-2 focus-visible:ring-amber-400/20"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 h-10 w-full rounded-lg bg-amber-400 text-[13px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2540]"
                >
                  Continue →
                </button>
              </form>
            ) : (
              <form onSubmit={handleStep2} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="admin-officer-key"
                    className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/40"
                  >
                    Officer Key
                  </label>
                  <input
                    id="admin-officer-key"
                    type="password"
                    placeholder="Enter your officer key"
                    value={officerKey}
                    onChange={(e) => setOfficerKey(e.target.value)}
                    required
                    autoFocus
                    aria-invalid={hasError}
                    aria-describedby={hasError ? "admin-login-error" : undefined}
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 font-mono text-[13px] tracking-[0.06em] text-white/90 placeholder:text-white/35 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] focus-visible:ring-2 focus-visible:ring-amber-400/20"
                  />
                </div>

                {error && (
                  <div
                    id="admin-login-error"
                    role="alert"
                    className="rounded-lg border border-red-500/20 bg-red-500/[0.10] px-3 py-2.5 text-[12px] text-red-400"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-1 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                      setPassword("");
                      setOfficerKey("");
                    }}
                    className="h-10 flex-1 rounded-lg border border-white/[0.12] text-[13px] text-white/60 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/20"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-10 flex-1 rounded-lg bg-amber-400 text-[13px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2540] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex justify-center gap-2">
          <div
            className={`h-[5px] rounded-full transition-all duration-300 ${step === 1
              ? "w-8 bg-amber-400"
              : "w-6 bg-amber-400/30"
              }`}
          />
          <div
            className={`h-[5px] rounded-full transition-all duration-300 ${step === 2
              ? "w-8 bg-amber-400"
              : "w-6 bg-white/10"
              }`}
          />
        </div>

      </div>
    </div>
  );
}

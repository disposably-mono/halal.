"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SecretInput } from "@/components/ui/secret-input";
import { verifyAdminCredentials } from "./actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [officerKey, setOfficerKey] = useState("");
  const [credentialsError, setCredentialsError] = useState("");
  const [officerKeyError, setOfficerKeyError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const hasCredentialsError = credentialsError.length > 0;
  const hasOfficerKeyError = officerKeyError.length > 0;

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setCredentialsError("");
    setVerifying(true);

    let result;
    try {
      result = await verifyAdminCredentials(email, password);
    } catch {
      setCredentialsError("Unable to verify credentials right now. Please try again.");
      setVerifying(false);
      return;
    }
    setVerifying(false);

    if (!result.ok) {
      setCredentialsError("Incorrect email or password. Please try again.");
      return;
    }

    setOfficerKeyError("");
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOfficerKeyError("");

    let credentialCheck;
    try {
      credentialCheck = await verifyAdminCredentials(
        email,
        password,
        officerKey,
      );
    } catch {
      setOfficerKeyError("Unable to verify the officer key right now. Please try again.");
      setLoading(false);
      return;
    }

    if (!credentialCheck.ok) {
      setLoading(false);
      if (credentialCheck.reason === "primary") {
        setCredentialsError("Incorrect email or password. Please try again.");
        setPassword("");
        setOfficerKey("");
        setStep(1);
      } else if (credentialCheck.reason === "ownOfficerKey") {
        setOfficerKeyError(
          "You cannot use your own officer key. Ask another COMELEC officer to verify.",
        );
        setOfficerKey("");
      } else if (credentialCheck.reason === "noOtherOfficer") {
        setOfficerKeyError(
          "Another admin account is required for officer verification.",
        );
      } else if (credentialCheck.reason === "rateLimited") {
        setCredentialsError(
          "Too many sign-in attempts. Please wait a few minutes and try again.",
        );
        setPassword("");
        setOfficerKey("");
        setStep(1);
      } else {
        setOfficerKeyError(
          "That key does not match another COMELEC officer. Please try again.",
        );
        setOfficerKey("");
      }
      return;
    }

    let result;
    try {
      result = await signIn("credentials", {
        email,
        password,
        officerKey,
        redirect: false,
      });
    } catch {
      setOfficerKeyError("Sign in could not be completed. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);

    if (result?.error) {
      setOfficerKeyError("Sign in could not be completed. Please try again.");
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
                : "Ask another COMELEC officer to enter their personal key."}
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setCredentialsError("");
                    }}
                    required
                    autoFocus
                    aria-invalid={hasCredentialsError}
                    aria-describedby={hasCredentialsError ? "admin-credentials-error" : undefined}
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
                  <SecretInput
                    id="admin-password"
                    secretLabel="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setCredentialsError("");
                    }}
                    required
                    aria-invalid={hasCredentialsError}
                    aria-describedby={hasCredentialsError ? "admin-credentials-error" : undefined}
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/35 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] focus-visible:ring-2 focus-visible:ring-amber-400/20"
                  />
                </div>
                {credentialsError && (
                  <div
                    id="admin-credentials-error"
                    role="alert"
                    className="rounded-lg border border-red-500/20 bg-red-500/[0.10] px-3 py-2.5 text-[12px] text-red-400"
                  >
                    {credentialsError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={verifying}
                  className="mt-1 h-10 w-full rounded-lg bg-amber-400 text-[13px] font-semibold text-[#0b1220] transition-opacity hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2540] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifying ? "Checking…" : "Continue →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleStep2} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="admin-officer-key"
                    className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/40"
                  >
                    Another Officer&apos;s Key
                  </label>
                  <SecretInput
                    id="admin-officer-key"
                    secretLabel="officer key"
                    placeholder="Enter your officer key"
                    value={officerKey}
                    onChange={(e) => {
                      setOfficerKey(e.target.value);
                      setOfficerKeyError("");
                    }}
                    required
                    autoFocus
                    aria-invalid={hasOfficerKeyError}
                    aria-describedby={hasOfficerKeyError ? "admin-officer-key-error" : undefined}
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 font-mono text-[13px] tracking-[0.06em] text-white/90 placeholder:text-white/35 outline-none transition-colors focus:border-amber-400/50 focus:bg-amber-400/[0.04] focus-visible:ring-2 focus-visible:ring-amber-400/20"
                  />
                </div>

                {officerKeyError && (
                  <div
                    id="admin-officer-key-error"
                    role="alert"
                    className="rounded-lg border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2.5 text-[12px] text-amber-300"
                  >
                    {officerKeyError}
                  </div>
                )}

                <div className="mt-1 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setCredentialsError("");
                      setOfficerKeyError("");
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

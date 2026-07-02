"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { SecretInput } from "@/components/ui/secret-input";
import { Button } from "@/components/ui/button";
import { verifyAdminCredentials } from "./actions";
import { getOfficerKeyFailure } from "./login-copy";

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
      const failure = getOfficerKeyFailure(credentialCheck.reason);
      if (failure.field === "credentials") {
        setCredentialsError(failure.message);
        setPassword("");
        setOfficerKey("");
      } else {
        setOfficerKeyError(failure.message);
        if (credentialCheck.reason !== "noOtherOfficer") setOfficerKey("");
      }
      if (failure.shouldResetToCredentials) {
        setStep(1);
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
    <div className="flex min-h-screen items-center justify-center bg-admin-bg p-4 font-sans">
      <div className="relative w-full max-w-[360px] space-y-5">

        {/* ── Wordmark ── */}
        <div className="space-y-1.5 text-center">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            OLPS COMELEC
          </p>
          <h1 className="text-[42px] font-semibold leading-none tracking-normal text-white/90">
            halal.
          </h1>
          <p className="text-[12px] italic tracking-[0.06em] text-white/60">
            VOX POPULI VOX DEI
          </p>
        </div>

        {/* ── Card ── */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-admin-surface">

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
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/40 outline-none transition-colors focus:border-gold/50 focus:bg-gold/[0.04] focus-visible:ring-2 focus-visible:ring-gold/20"
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
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-[13px] text-white/90 placeholder:text-white/40 outline-none transition-colors focus:border-gold/50 focus:bg-gold/[0.04] focus-visible:ring-2 focus-visible:ring-gold/20"
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
                <Button
                  type="submit"
                  disabled={verifying}
                  variant="adminPrimary"
                  size="adminMd"
                  className="mt-1 min-h-11 w-full"
                >
                  {verifying ? "Checking..." : "Continue"}
                  {!verifying && <ArrowRight aria-hidden="true" />}
                </Button>
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
                    className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 font-mono text-[13px] tracking-[0.06em] text-white/90 placeholder:text-white/40 outline-none transition-colors focus:border-gold/50 focus:bg-gold/[0.04] focus-visible:ring-2 focus-visible:ring-gold/20"
                  />
                </div>

                {officerKeyError && (
                  <div
                    id="admin-officer-key-error"
                    role="alert"
                    className="rounded-lg border border-gold/20 bg-gold/[0.08] px-3 py-2.5 text-[12px] text-gold"
                  >
                    {officerKeyError}
                  </div>
                )}

                <div className="mt-1 flex gap-2.5">
                  <Button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setCredentialsError("");
                      setOfficerKeyError("");
                      setPassword("");
                      setOfficerKey("");
                    }}
                    variant="adminGhost"
                    size="adminMd"
                    className="min-h-11 flex-1"
                  >
                    <ArrowLeft aria-hidden="true" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="adminPrimary"
                    size="adminMd"
                    className="min-h-11 flex-1"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                    {!loading && <ShieldCheck aria-hidden="true" />}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex justify-center gap-2">
          <div
            className={`h-[5px] rounded-full transition-all duration-300 ${step === 1
              ? "w-8 bg-gold"
              : "w-6 bg-gold/30"
              }`}
          />
          <div
            className={`h-[5px] rounded-full transition-all duration-300 ${step === 2
              ? "w-8 bg-gold"
              : "w-6 bg-white/10"
              }`}
          />
        </div>

      </div>
    </div>
  );
}

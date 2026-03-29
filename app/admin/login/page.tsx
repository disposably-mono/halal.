"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [officerKey, setOfficerKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setStep(1);
      setPassword("");
      setOfficerKey("");
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-[#1B1F5E] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-[#F5C000] text-xs font-mono tracking-widest uppercase">
            OLPS COMELEC
          </p>
          <h1 className="text-white text-4xl font-bold tracking-tight">
            halal.
          </h1>
          <p className="text-white/40 text-sm italic">
            VOX POPULI VOX DEI
          </p>
        </div>

        {/* Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">
              {step === 1 ? "Admin Sign In" : "Officer Verification"}
            </CardTitle>
            <CardDescription className="text-white/50">
              {step === 1
                ? "Enter your COMELEC admin credentials."
                : "Enter your unique personal officer key to complete sign in."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white/70 text-sm">Email</label>
                  <Input
                    type="email"
                    placeholder="comelec@olps.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/70 text-sm">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#F5C000] text-[#1B1F5E] hover:bg-[#F5C000]/90 font-semibold"
                >
                  Continue →
                </Button>
              </form>
            ) : (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white/70 text-sm">Officer Key</label>
                  <Input
                    type="password"
                    placeholder="e.g. ***REMOVED***"
                    value={officerKey}
                    onChange={(e) => setOfficerKey(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 font-mono"
                    required
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-white/20 text-white/70 hover:bg-white/10"
                    onClick={() => { setStep(1); setError(""); }}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#F5C000] text-[#1B1F5E] hover:bg-[#F5C000]/90 font-semibold"
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? "bg-[#F5C000]" : "bg-white/20"}`} />
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? "bg-[#F5C000]" : "bg-white/20"}`} />
        </div>

      </div>
    </div>
  );
}

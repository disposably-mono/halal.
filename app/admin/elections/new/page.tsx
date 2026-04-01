import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createElection } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function NewElectionPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-navy-deep">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-navy">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link
            href="/admin"
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            ← Elections
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm">New Election</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold">Create Election</h1>
          <p className="text-white/40 text-sm mt-1">
            Set up the election details. You can add candidates and voters after
            creation.
          </p>
        </div>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-base">
              Election Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createElection} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm">
                  Election Name <span className="text-gold">*</span>
                </label>
                <Input
                  name="name"
                  placeholder="e.g. JHSSCT Elections AY 2025–2026"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                  required
                />
              </div>

              {/* Division */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm">
                  Division <span className="text-gold">*</span>
                </label>
                <select
                  name="division"
                  required
                  className="w-full h-10 rounded-md border border-white/20 bg-white/10 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                >
                  <option value="" className="bg-navy">
                    Select a division
                  </option>
                  <option value="GS" className="bg-navy">
                    Grade School (Grades 3–5)
                  </option>
                  <option value="JHS" className="bg-navy">
                    Junior High School (Grades 6–9)
                  </option>
                  <option value="SHS" className="bg-navy">
                    Senior High School (Grades 10–11)
                  </option>
                  <option value="HC" className="bg-navy">
                    House Council (Grades 10–11)
                  </option>
                </select>              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm">
                  Schedule (optional)
                </label>
                <p className="text-white/30 text-xs">
                  Leave blank to open and close the election manually.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-white/40 text-xs">Opens</label>
                    <Input
                      name="scheduledOpen"
                      type="datetime-local"
                      className="bg-white/10 border-white/20 text-white/70 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-white/40 text-xs">Closes</label>
                    <Input
                      name="scheduledClose"
                      type="datetime-local"
                      className="bg-white/10 border-white/20 text-white/70 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Link href="/admin" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/20 text-white/60 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex-1 bg-gold text-navy hover:bg-gold/90 font-semibold"
                >
                  Create & Add Candidates →
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

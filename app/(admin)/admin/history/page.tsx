import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminHistoryPage() {
  await requireCapability("accounts:manage");

  const history = await prisma.adminLoginHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  return (
    <div className="flex flex-col gap-[18px] p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-white/90">
            Login History
          </h1>
          <p className="mt-[3px] text-[12px] text-white/50">
            Successful admin sign-ins and the officer who verified each one.
          </p>
        </div>
        <span className="rounded-[6px] border border-white/[0.07] bg-white/[0.04] px-[9px] py-[4px] text-[11px] text-white/50">
          Latest {history.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a2540]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.07] text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Officer logged in</th>
                <th className="px-4 py-3">Verified by</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b border-white/[0.06] last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-white/45">
                    {dateFormatter.format(entry.createdAt)}
                  </td>
                  <OfficerCell name={entry.officerName} email={entry.officerEmail} />
                  <OfficerCell name={entry.verifierName} email={entry.verifierEmail} />
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-[12px] text-white/35">
                    No successful admin sign-ins have been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-white/25">
        Times are shown in Philippine Standard Time. The latest 250 sign-ins are displayed.
      </p>
    </div>
  );
}

function OfficerCell({ name, email }: { name: string; email: string }) {
  return (
    <td className="px-4 py-3">
      <p className="text-[12px] font-medium text-white/80">{name}</p>
      <p className="mt-0.5 font-mono text-[10px] text-white/35">{email}</p>
    </td>
  );
}

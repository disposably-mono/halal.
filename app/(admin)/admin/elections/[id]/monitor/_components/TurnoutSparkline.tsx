"use client";

import type { Snapshot } from "./monitor-shared";

export function TurnoutSparkline({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) return null;
  const values = snapshots.map((s) => s.payload.turnout?.pct ?? 0);
  const max = Math.max(...values, 1);
  const W = 224;
  const H = 45;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - (v / max) * (H - 4);
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  const lastX = W;
  const lastY = H - (last / max) * (H - 4);

  return (
    <div className="mt-[13px]">
      <p className="mb-[7px] text-[10px] uppercase tracking-[0.12em] text-white/35">
        Turnout over session
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        <polyline
          points={pts}
          fill="none"
          stroke="rgba(52,211,153,0.45)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lastX} cy={lastY} r="3" fill="#34d399" />
      </svg>
    </div>
  );
}

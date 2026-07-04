"use client";

import type { Snapshot } from "./monitor-shared";

export function MomentumChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) return null;
  const deltas = snapshots.slice(1).map((s, i) => {
    const prev = snapshots[i].payload.positions.reduce((sum, p) => sum + p.totalVotes, 0);
    const curr = s.payload.positions.reduce((sum, p) => sum + p.totalVotes, 0);
    return Math.max(0, curr - prev);
  });
  const visible = deltas.slice(-12);
  const maxD = Math.max(...visible, 1);
  const W = 224;
  const H = 49;
  const barW = Math.floor((W - (visible.length - 1) * 2) / visible.length);

  return (
    <div className="mt-[18px]">
      <p className="mb-[7px] text-[10px] uppercase tracking-[0.12em] text-white/35">
        Vote momentum
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {visible.map((d, i) => {
          const barH = Math.max(2, (d / maxD) * (H - 6));
          const x = i * (barW + 2);
          const y = H - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="2"
              fill={
                i === visible.length - 1
                  ? "rgba(251,191,36,0.6)"
                  : "rgba(255,255,255,0.12)"
              }
            />
          );
        })}
      </svg>
    </div>
  );
}

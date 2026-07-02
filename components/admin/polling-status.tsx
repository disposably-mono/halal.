"use client";

import { Button } from "@/components/ui/button";

export function PollingStatus({
  updatedAt,
  isFetching,
  error,
  onRefresh,
}: {
  updatedAt?: Date | string | number | null;
  isFetching?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}) {
  const label = getPollingLabel({ updatedAt, isFetching, error });

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
      <span className="inline-flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${error ? "bg-red-400" : isFetching ? "bg-gold" : "bg-emerald-400"}`} />
        {label}
      </span>
      {onRefresh && (
        <Button type="button" onClick={onRefresh} variant="adminGhost" size="adminSm">
          Refresh
        </Button>
      )}
    </div>
  );
}

function getPollingLabel({
  updatedAt,
  isFetching,
  error,
}: {
  updatedAt?: Date | string | number | null;
  isFetching?: boolean;
  error?: string | null;
}) {
  if (error) return "Connection lost — retrying";
  if (isFetching) return "Refreshing…";
  if (!updatedAt) return "Live";
  const ageSeconds = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000));
  return `Live · updated ${ageSeconds}s ago`;
}

"use client";

import { useMemo, useState } from "react";
import { Card, ThemedSelect, type ThemedSelectOption } from "@/components/admin/ui";
import { AccountLogTable, type AccountLogRow } from "./AccountLogTable";

type ShowLimit = "25" | "50" | "100" | "ALL";

const DEFAULT_LIMIT: ShowLimit = "50";

const LIMIT_OPTIONS: ThemedSelectOption[] = [
  { value: "25", label: "Latest 25" },
  { value: "50", label: "Latest 50" },
  { value: "100", label: "Latest 100" },
  { value: "ALL", label: "All rows" },
];

export function AccountChangesCard({ logs }: { logs: AccountLogRow[] }) {
  const [limit, setLimit] = useState<ShowLimit>(DEFAULT_LIMIT);
  const visible = useMemo(
    () => (limit === "ALL" ? logs : logs.slice(0, Number(limit))),
    [logs, limit],
  );

  return (
    <Card
      title="Account changes"
      meta={
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/45">{visible.length} of {logs.length} shown</span>
          <ThemedSelect
            options={LIMIT_OPTIONS}
            value={limit}
            onValueChange={(value) => setLimit(value as ShowLimit)}
            className="h-7 w-[110px] py-1 text-[11px]"
            ariaLabel="Show account change rows"
          />
        </div>
      }
      noPad
    >
      <AccountLogTable logs={visible} />
    </Card>
  );
}

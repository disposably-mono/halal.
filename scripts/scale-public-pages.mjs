import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { scalePublicFileContents } from "./lib/scale-public-page-class.mjs";

const TARGET_FILES = [
  "app/LandingClient.tsx",
  "app/results/ResultsClient.tsx",
  "app/results/page.tsx",
  "app/verify/page.tsx",
  "app/verify/VerifyForm.tsx",
  "app/vote/page.tsx",
  "app/vote/confirmed/page.tsx",
  "app/vote/_components/VoteForm.tsx",
  "app/vote/confirmed/ReceiptActions.tsx",
  "app/_components/ComelecBirdPlaceholder.tsx",
  "app/_components/CountdownUnit.tsx",
  "app/_components/DivisionStatusCard.tsx",
  "app/_components/InfoBand.tsx",
  "app/_components/LandingFooter.tsx",
  "app/_components/LandingNav.tsx",
  "app/_components/PublicEmptyState.tsx",
  "app/_components/PublicFooter.tsx",
  "app/_components/PublicNav.tsx",
  "app/results/_components/ElectionSelector.tsx",
  "app/results/_components/ElectionSummary.tsx",
  "app/results/_components/HoldingState.tsx",
  "app/results/_components/PositionCard.tsx",
  "app/results/_components/TurnoutBadge.tsx",
  "app/results/_components/VoteBar.tsx",
];

const isDryRun = process.argv.includes("--dry-run");
let changedFiles = 0;

for (const relativePath of TARGET_FILES) {
  const absolutePath = resolve(relativePath);
  const original = readFileSync(absolutePath, "utf8");
  const scaled = scalePublicFileContents(original);

  if (scaled === original) {
    continue;
  }

  changedFiles += 1;

  if (isDryRun) {
    console.log(`would change: ${relativePath}`);
    continue;
  }

  writeFileSync(absolutePath, scaled, "utf8");
  console.log(`changed: ${relativePath}`);
}

console.log(`\n${isDryRun ? "Would change" : "Changed"} ${changedFiles} of ${TARGET_FILES.length} files.`);

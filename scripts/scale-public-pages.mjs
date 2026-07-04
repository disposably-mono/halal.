import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  scaleAdminLoginFileContents,
  scaleBallotFileContents,
  scalePublicFileContents,
} from "./lib/scale-public-page-class.mjs";

const PUBLIC_TARGET_FILES = [
  "app/LandingClient.tsx",
  "app/about/page.tsx",
  "app/admin-help/page.tsx",
  "app/creator/page.tsx",
  "app/officers/page.tsx",
  "app/privacy/PrivacyClient.tsx",
  "app/voter-help/page.tsx",
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
  "app/_components/PublicHelpShell.tsx",
  "app/_components/PublicNav.tsx",
  "app/_components/PublicPageDecor.tsx",
  "app/results/_components/ElectionSelector.tsx",
  "app/results/_components/ElectionSummary.tsx",
  "app/results/_components/HoldingState.tsx",
  "app/results/_components/PositionCard.tsx",
  "app/results/_components/TurnoutBadge.tsx",
  "app/results/_components/VoteBar.tsx",
];

const BALLOT_TARGET_FILES = [
  "app/vote/ballot/BallotClient.tsx",
  "app/vote/ballot/_components/AbstentionModal.tsx",
  "app/vote/ballot/_components/BallotFooter.tsx",
  "app/vote/ballot/_components/BallotHeader.tsx",
  "app/vote/ballot/_components/CandidateRow.tsx",
  "app/vote/ballot/_components/PositionSection.tsx",
];

const ADMIN_TARGET_FILES = ["app/admin/login/page.tsx"];

const FILE_GROUPS = [
  { paths: PUBLIC_TARGET_FILES, transform: scalePublicFileContents },
  { paths: BALLOT_TARGET_FILES, transform: scaleBallotFileContents },
  { paths: ADMIN_TARGET_FILES, transform: scaleAdminLoginFileContents },
];

const isDryRun = process.argv.includes("--dry-run");
let changedFiles = 0;
const totalFiles = FILE_GROUPS.reduce((sum, group) => sum + group.paths.length, 0);

for (const { paths, transform } of FILE_GROUPS) {
  for (const relativePath of paths) {
    const absolutePath = resolve(relativePath);
    const original = readFileSync(absolutePath, "utf8");
    const scaled = transform(original);

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
}

console.log(`\n${isDryRun ? "Would change" : "Changed"} ${changedFiles} of ${totalFiles} files.`);

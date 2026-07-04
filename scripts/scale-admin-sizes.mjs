import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { scaleFileContents } from "./lib/scale-tailwind-class.mjs";

const TARGET_DIRS = ["app/(admin)", "components/admin"];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && full.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const files = TARGET_DIRS.flatMap((dir) => walk(dir));
  let changedFiles = 0;

  for (const file of files) {
    const original = readFileSync(file, "utf8");
    const scaled = scaleFileContents(original);
    if (scaled !== original) {
      changedFiles += 1;
      if (dryRun) {
        console.log(`would change: ${file}`);
      } else {
        writeFileSync(file, scaled, "utf8");
        console.log(`changed: ${file}`);
      }
    }
  }

  console.log(`\n${dryRun ? "Would change" : "Changed"} ${changedFiles} of ${files.length} files.`);
}

main();

/**
 * Load-test seed: creates one OPEN, verifiable election with positions,
 * candidates, and a configurable roster of voters, then writes the voter set to
 * scripts/load/.data/voters.json for the k6 load scripts and the correctness
 * harness.
 *
 * Run with the tsconfig path alias active:
 *   npm run seed:load
 * Env knobs:
 *   VOTER_COUNT            (default 800)
 *   DIVISION               GS | JHS | SHS | HC   (default SHS)
 *   CANDIDATES_PER_POSITION(default 3)
 *   SCHOOL_YEAR            (default 2099 — kept away from real cohorts so the
 *                           generated control numbers never collide with live data)
 *
 * This creates real rows in whatever DATABASE_URL points at. Point it at a
 * throwaway/test database, never production.
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Division } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DIVISION_POSITIONS, DIVISION_GRADE_RANGE } from "@/lib/elections/constants";
import { pickCandidateDefaultGrade } from "@/lib/domain/ballot";
import { createAuditKeyMaterial } from "@/lib/domain/ballot-audit";
import { controlNumberPrefix, formatControlNumber } from "@/lib/domain/control-number";

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const DATA_FILE = path.resolve(process.cwd(), "scripts/load/.data/voters.json");

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function main() {
  const division = (process.env.DIVISION as Division) || "SHS";
  const voterCount = envInt("VOTER_COUNT", 800);
  const candidatesPerPosition = envInt("CANDIDATES_PER_POSITION", 3);
  const schoolYear = envInt("SCHOOL_YEAR", 2099);

  const positionDefs = DIVISION_POSITIONS[division];
  if (!positionDefs || positionDefs.length === 0) {
    throw new Error(`No positions defined for division ${division}`);
  }
  const range = DIVISION_GRADE_RANGE[division];
  const grades = Array.from(
    { length: range.max - range.min + 1 },
    (_, i) => range.min + i,
  );

  const audit = createAuditKeyMaterial();
  const election = await prisma.election.create({
    data: {
      name: `[LOAD TEST] ${division} ${new Date().toISOString()}`,
      division,
      status: "OPEN",
      auditKeyEncrypted: audit.encryptedKey,
      auditFingerprint: audit.fingerprint,
      auditVersion: audit.version,
    },
    select: { id: true },
  });
  const electionId = election.id;

  // Positions + candidates.
  for (let order = 0; order < positionDefs.length; order++) {
    const def = positionDefs[order];
    const position = await prisma.position.create({
      data: {
        electionId,
        title: def.title,
        order,
        eligibleGrades: def.eligibleGrades,
        candidateGrade: def.candidateGrade,
        isActive: true,
      },
      select: { id: true },
    });
    await prisma.candidate.createMany({
      data: Array.from({ length: candidatesPerPosition }, (_, i) => ({
        positionId: position.id,
        electionId,
        fullName: `${def.title} Candidate ${i + 1}`,
        gradeLevel: pickCandidateDefaultGrade(def.candidateGrade),
      })),
    });
  }

  // Seed per-cohort sequence counters from any control numbers already in the
  // DB, so re-runs and real data never collide with the unique voterCode.
  const existing = await prisma.voter.findMany({ select: { voterCode: true } });
  const nextSeqByPrefix = new Map<string, number>();
  for (const { voterCode } of existing) {
    const prefix = voterCode.slice(0, 5);
    const seq = parseInt(voterCode.slice(5, 8), 10);
    if (!Number.isNaN(seq)) {
      nextSeqByPrefix.set(prefix, Math.max(nextSeqByPrefix.get(prefix) ?? 0, seq));
    }
  }

  const voterRows: {
    electionId: string;
    studentId: string;
    gradeLevel: number;
    division: Division;
    section: string;
    voterCode: string;
  }[] = [];

  for (let i = 0; i < voterCount; i++) {
    const grade = grades[i % grades.length];
    const section = SECTIONS[Math.floor(i / grades.length) % SECTIONS.length];
    const prefix = controlNumberPrefix(schoolYear, grade, section);
    const seq = (nextSeqByPrefix.get(prefix) ?? 0) + 1;
    nextSeqByPrefix.set(prefix, seq);

    voterRows.push({
      electionId,
      studentId: `${schoolYear}-${String(i + 1).padStart(4, "0")}`,
      gradeLevel: grade,
      division,
      section,
      voterCode: formatControlNumber({ year: schoolYear, grade, section, seq }),
    });
  }

  // Batch insert (chunked to keep statements reasonable).
  for (let i = 0; i < voterRows.length; i += 500) {
    await prisma.voter.createMany({ data: voterRows.slice(i, i + 500) });
  }

  // Re-read to get the generated voter ids, and the positions/candidates the
  // load scripts need to build valid ballots.
  const [voters, positions] = await Promise.all([
    prisma.voter.findMany({
      where: { electionId },
      select: { id: true, gradeLevel: true },
    }),
    prisma.position.findMany({
      where: { electionId, isActive: true },
      select: {
        id: true,
        eligibleGrades: true,
        candidates: { select: { id: true } },
      },
    }),
  ]);

  const payload = {
    electionId,
    division,
    schoolYear,
    positions: positions.map((p) => ({
      id: p.id,
      eligibleGrades: p.eligibleGrades,
      candidateIds: p.candidates.map((c) => c.id),
    })),
    voters: voters.map((v) => ({ id: v.id, gradeLevel: v.gradeLevel })),
  };

  mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2));

  const sample = voterRows.slice(0, 3).map((v) => `${v.voterCode} / ${v.studentId}`);
  console.log("Load-test election seeded:");
  console.log(`  electionId : ${electionId}`);
  console.log(`  division   : ${division}  (grades ${range.min}-${range.max})`);
  console.log(`  positions  : ${positions.length}`);
  console.log(`  voters     : ${voters.length}`);
  console.log(`  sample     : ${sample.join(", ")}`);
  console.log(`  data file  : ${DATA_FILE}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

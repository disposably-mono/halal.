/**
 * app/api/elections/[id]/results-pdf/route.ts
 *
 * Streams an official-results PDF for a CLOSED election.
 * Only accessible to authenticated admins.
 *
 * GET /api/elections/:id/results-pdf
 *
 * Install dependency: npm install @react-pdf/renderer
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { requireCapabilityOrError } from "@/lib/server/auth";
import { permissionErrorMessage } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { ResultsPDF, type ResultPosition } from "@/lib/pdf/ResultsPDF";
import type { AuditSnapshot } from "@/lib/domain/audit-tally";
import { buildVoteMap, computePositionTally } from "@/lib/domain/tally";
import { verifyStoredCertification } from "@/lib/server/election-audit";
import { DIVISION_CODES } from "@/lib/ui/division-labels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "Asia/Manila",
  });
}

function schoolYearLabel(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  return m >= 5 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  // Results export is the Canvassing Head's domain.
  const guard = await requireCapabilityOrError("results:export");
  if (!guard.ok) {
    return NextResponse.json(
      { error: permissionErrorMessage(guard.error) },
      { status: guard.error === "Forbidden" ? 403 : 401 },
    );
  }

  const { id: electionId } = params;

  // ── Fetch election ────────────────────────────────────────────────────────
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: {
      id: true,
      name: true,
      division: true,
      status: true,
      updatedAt: true,
      _count: { select: { voters: true } },
      certification: { select: { snapshot: true } },
      auditKeyEncrypted: true,
      auditVersion: true,
    },
  });

  if (!election) {
    return NextResponse.json({ error: "Election not found." }, { status: 404 });
  }

  if (election.status !== "CLOSED") {
    return NextResponse.json(
      { error: "PDF export is only available for closed elections." },
      { status: 400 }
    );
  }

  if (election.auditVersion !== null) {
    const certification = await prisma.electionCertification.findUnique({
      where: { electionId },
      select: { snapshot: true, snapshotHash: true, signature: true },
    });
    if (!certification || !election.auditKeyEncrypted || !verifyStoredCertification({
      encryptedKey: election.auditKeyEncrypted,
      snapshot: certification.snapshot,
      snapshotHash: certification.snapshotHash,
      signature: certification.signature,
    })) {
      return NextResponse.json(
        { error: "The official result certification failed integrity verification." },
        { status: 409 },
      );
    }
  }

  // ── Fetch positions with candidates and vote counts ───────────────────────
  const positions = await prisma.position.findMany({
    where: { electionId, isActive: true },
    orderBy: { order: "asc" },
    include: {
      candidates: {
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true },
      },
    },
  });

  // Fetch vote tallies in a single query
  const voteCounts = await prisma.vote.groupBy({
    by: ["candidateId"],
    where: { electionId },
    _count: { candidateId: true },
  });

  const voteMap = buildVoteMap(voteCounts);

  // Voted-voter turnout grouped by grade, so each position's abstention baseline
  // can be the turnout *eligible for that position* — not the whole electorate.
  // (JHS per-grade governor positions only appear on one grade's ballot, so
  // counting the rest of the school as abstainers over-counts abstentions.)
  const votedByGrade = await prisma.voter.groupBy({
    by: ["gradeLevel"],
    where: { electionId, hasVoted: true },
    _count: { _all: true },
  });
  const votedGradeCounts = new Map<number, number>(
    votedByGrade.map((g) => [g.gradeLevel, g._count._all] as [number, number]),
  );
  const totalVoted = votedByGrade.reduce((s, g) => s + g._count._all, 0);
  // Eligible turnout = voted voters whose grade is on this position's ballot. An
  // empty eligibleGrades means "no grade filter" → the whole voted electorate.
  const eligibleTurnoutFor = (eligibleGrades: number[]): number =>
    eligibleGrades.length === 0
      ? totalVoted
      : eligibleGrades.reduce((s, grade) => s + (votedGradeCounts.get(grade) ?? 0), 0);

  // Build the shape expected by ResultsPDF
  const legacyResultPositions: ResultPosition[] = positions.map((pos) => {
    // eligibleTurnoutFor(...) is exactly the "voters who voted" figure
    // computePositionTally expects — its abstentions math (max(0, voters -
    // votesCast)) reproduces the same formula this route used inline before.
    const tally = computePositionTally(pos.candidates, voteMap, eligibleTurnoutFor(pos.eligibleGrades));

    return {
      id: pos.id,
      title: pos.title,
      totalVoters: election._count.voters,
      abstentions: tally.abstentions,
      candidates: tally.candidates.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        votes: c.votes,
        isWinner: c.isWinner,
        isTie: c.isTie,
      })),
    };
  });
  const certified = election.certification?.snapshot as unknown as AuditSnapshot | undefined;
  const resultPositions: ResultPosition[] = certified
    ? certified.positions.map((position) => {
        const positionVoteMap = new Map(position.candidates.map((c) => [c.id, c.votes] as [string, number]));
        const totalVotesForPosition = position.candidates.reduce((sum, c) => sum + c.votes, 0);
        // Same reconstruction trick as the legacy branch above: the certified
        // snapshot's abstentions figure is authoritative, so feed it back in
        // to keep the shared tally's math consistent with it while still
        // sourcing isWinner/isTie from one place.
        const tally = computePositionTally(
          position.candidates,
          positionVoteMap,
          position.abstentions + totalVotesForPosition,
        );
        return {
          id: position.id,
          title: position.title,
          totalVoters: certified.turnout.total,
          abstentions: position.abstentions,
          candidates: tally.candidates.map((c) => ({
            id: c.id,
            fullName: c.fullName,
            votes: c.votes,
            isWinner: c.isWinner,
            isTie: c.isTie,
          })),
        };
      })
    : legacyResultPositions;

  // ── Render PDF ────────────────────────────────────────────────────────────
  try {
    const now = new Date();

    // Fix: cast through unknown to satisfy @react-pdf/renderer's ReactElement expectation
    const element = React.createElement(ResultsPDF, {
      electionName: election.name,
      division: DIVISION_CODES[election.division] ?? (election.division as string),
      schoolYear: schoolYearLabel(now),
      dateClosed: formatDate(election.updatedAt),
      generatedAt: formatDateTime(now),
      positions: resultPositions,
    }) as unknown as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);

    const filename = `results-${election.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${electionId.slice(-6)}.pdf`;

    // Fix: convert Buffer to Uint8Array which is a valid BodyInit
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Keep the render detail server-side only — it can expose internals/paths.
    console.error("[results-pdf] render error:", message);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 }
    );
  }
}

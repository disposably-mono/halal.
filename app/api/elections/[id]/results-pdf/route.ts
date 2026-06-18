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
import { prisma } from "@/lib/prisma";
import { ResultsPDF, type ResultPosition } from "@/lib/pdf/ResultsPDF";

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
      { error: guard.error },
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

  // Fix: filter out null candidateId (abstentions) before building the map
  const voteMap = new Map<string, number>(
    voteCounts
      .filter((v): v is typeof v & { candidateId: string } => v.candidateId !== null)
      .map((v) => [v.candidateId, v._count.candidateId] as [string, number])
  );

  const totalVoted = await prisma.voter.count({
    where: { electionId, hasVoted: true },
  });

  // Build the shape expected by ResultsPDF
  const resultPositions: ResultPosition[] = positions.map((pos) => {
    const candidatesWithVotes = pos.candidates.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      votes: voteMap.get(c.id) ?? 0,
    }));

    const maxVotes = Math.max(0, ...candidatesWithVotes.map((c) => c.votes));
    const tiedTopCount = candidatesWithVotes.filter(
      (c) => c.votes > 0 && c.votes === maxVotes,
    ).length;
    const totalVotesForPosition = candidatesWithVotes.reduce(
      (s, c) => s + c.votes,
      0
    );
    const abstentions = Math.max(0, totalVoted - totalVotesForPosition);

    return {
      id: pos.id,
      title: pos.title,
      totalVoters: election._count.voters,
      abstentions,
      candidates: candidatesWithVotes.map((c) => ({
        ...c,
        isWinner: c.votes > 0 && c.votes === maxVotes,
        isTie: tiedTopCount > 1 && c.votes === maxVotes,
      })),
    };
  });

  // ── Render PDF ────────────────────────────────────────────────────────────
  try {
    const now = new Date();

    // Fix: cast through unknown to satisfy @react-pdf/renderer's ReactElement expectation
    const element = React.createElement(ResultsPDF, {
      electionName: election.name,
      division: election.division as string,
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
    console.error("[results-pdf] render error:", message);
    return NextResponse.json(
      { error: "Failed to generate PDF.", detail: message },
      { status: 500 }
    );
  }
}

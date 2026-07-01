import { prisma } from "@/lib/prisma";
import LandingClient from "./LandingClient";
import { DIVISION_LABELS, DIVISION_ORDER, formatDivisionGrades } from "@/lib/ui/division-labels";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Get all active (non-archived) elections, then pick most relevant per division
  const elections = await prisma.election.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      name: true,
      division: true,
      status: true,
      scheduledOpen: true,
      scheduledClose: true,
      _count: { select: { voters: true } },
    },
    orderBy: { scheduledOpen: "desc" },
  });

  // Per division: prefer OPEN > SCHEDULED > DRAFT > CLOSED, then most recent
  const statusPriority: Record<string, number> = {
    OPEN: 0,
    SCHEDULED: 1,
    DRAFT: 2,
    CLOSED: 3,
  };

  const divisionMap = new Map<string, typeof elections[0]>();
  for (const election of elections) {
    const existing = divisionMap.get(election.division);
    if (!existing) {
      divisionMap.set(election.division, election);
    } else {
      const existingPriority = statusPriority[existing.status] ?? 99;
      const newPriority = statusPriority[election.status] ?? 99;
      if (newPriority < existingPriority) {
        divisionMap.set(election.division, election);
      }
    }
  }

  // Countdown target: earliest SCHEDULED or OPEN election (with non-null scheduledOpen)
  const countdownElection =
    elections
      .filter(
        (e): e is typeof e & { scheduledOpen: Date } =>
          (e.status === "SCHEDULED" || e.status === "OPEN") &&
          e.scheduledOpen !== null
      )
      .sort((a, b) => a.scheduledOpen.getTime() - b.scheduledOpen.getTime())[0] ?? null;

  const divisionCards = DIVISION_ORDER.map((div) => {
    const election = divisionMap.get(div) ?? null;
    return {
      division: div,
      label: DIVISION_LABELS[div],
      sublabel: formatDivisionGrades(div as "GS" | "JHS" | "SHS" | "HC"),
      election: election
        ? {
          id: election.id,
          name: election.name,
          status: election.status as string,
          scheduledOpen: election.scheduledOpen?.toISOString() ?? "",
          scheduledClose: election.scheduledClose?.toISOString() ?? "",
          _count: election._count,
        }
        : null,
    };
  });

  return (
    <LandingClient
      divisionCards={divisionCards}
      countdownTarget={
        countdownElection
          ? {
            date: countdownElection.scheduledOpen.toISOString(),
            electionName: countdownElection.name,
            status: countdownElection.status,
          }
          : null
      }
    />
  );
}

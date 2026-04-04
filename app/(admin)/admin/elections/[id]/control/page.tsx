import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ControlClient from "./ControlClient";

interface PageProps {
  params: { id: string };
}

export default async function ControlPage({ params }: PageProps) {
  const [election, auditLogs] = await Promise.all([
    prisma.election.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        division: true,
        status: true,
        scheduledOpen: true,
        scheduledClose: true,
        _count: { select: { voters: true, votes: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { electionId: params.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!election) notFound();

  // Get voted count (hasVoted=true) — not vote row count
  const votedCount = await prisma.voter.count({
    where: { electionId: params.id, hasVoted: true },
  });

  return (
    <ControlClient
      election={{ ...election, votedCount }}
      auditLogs={auditLogs}
    />
  );
}

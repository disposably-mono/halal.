import { revalidatePath } from "next/cache";

export function revalidateAdminDashboard(): void {
  revalidatePath("/admin");
}

export function revalidateElectionCandidates(electionId: string): void {
  revalidatePath(`/admin/elections/${electionId}/candidates`);
}

export function revalidateElectionVoters(electionId: string): void {
  revalidatePath(`/admin/elections/${electionId}/voters`);
}

export function revalidateElectionControl(electionId: string): void {
  revalidatePath(`/admin/elections/${electionId}/control`);
}

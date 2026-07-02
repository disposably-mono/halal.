export type ReceiptVoteRow = {
  isAbstain: boolean;
  positionId: string;
  position: { title: string };
  candidate: { fullName: string; gradeLevel: number } | null;
};

export type VerifiedSelection = {
  positionId: string;
  positionTitle: string;
  choiceLabel: string;
  detail: string;
};

export function toVerifiedSelections(votes: readonly ReceiptVoteRow[]): VerifiedSelection[] {
  return votes.map((vote) => {
    if (vote.isAbstain || !vote.candidate) {
      return {
        positionId: vote.positionId,
        positionTitle: vote.position.title,
        choiceLabel: "Abstain",
        detail: "No candidate selected",
      };
    }

    return {
      positionId: vote.positionId,
      positionTitle: vote.position.title,
      choiceLabel: vote.candidate.fullName,
      detail: `Grade ${vote.candidate.gradeLevel}`,
    };
  });
}

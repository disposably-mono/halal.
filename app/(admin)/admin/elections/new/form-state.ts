import type { CreateElectionInput } from "@/lib/validation/schemas";
import { CreateElectionSchema, safeParseFormData } from "@/lib/validation/schemas";

export type CreateElectionFormState = {
  success: boolean;
  errors?: Partial<Record<keyof CreateElectionInput, string>>;
  data?: CreateElectionInput;
};

const FIELD_MESSAGES: Record<keyof CreateElectionInput, string> = {
  division: "Select a valid division.",
  name: "Election name is required.",
  scheduledClose: "Enter a valid close time.",
  scheduledOpen: "Enter a valid open time.",
};

export const INITIAL_CREATE_ELECTION_STATE: CreateElectionFormState = {
  success: false,
};

export function validateCreateElectionForm(formData: FormData): CreateElectionFormState {
  const parsed = safeParseFormData(CreateElectionSchema, formData);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const errors = parsed.error.issues.reduce<Partial<Record<keyof CreateElectionInput, string>>>(
    (nextErrors, issue) => {
      const field = issue.path[0] as keyof CreateElectionInput | undefined;
      if (!field || nextErrors[field]) return nextErrors;
      return { ...nextErrors, [field]: FIELD_MESSAGES[field] };
    },
    {},
  );

  return { success: false, errors };
}

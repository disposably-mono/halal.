import { z } from "zod";
import type { Division, ElectionStatus } from "@prisma/client";
import { CONTROL_NUMBER_REGEX, STUDENT_ID_REGEX } from "@/lib/domain/control-number";

const NonEmptyString = z.string().trim().min(1);
const Cuid = z.string().min(1);

const DIVISION_VALUES = ["GS", "JHS", "SHS", "HC"] as const satisfies readonly Division[];
const ELECTION_STATUS_VALUES = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED"] as const satisfies readonly ElectionStatus[];

export const DivisionSchema = z.enum(DIVISION_VALUES);
export const ElectionStatusSchema = z.enum(ELECTION_STATUS_VALUES);

const NormalizedControlNumber = z
  .string()
  .transform((s) => s.trim().toUpperCase())
  .pipe(z.string().regex(CONTROL_NUMBER_REGEX));

const NormalizedStudentId = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().regex(STUDENT_ID_REGEX));

export const VoterLoginSchema = z.object({
  voterCode: NormalizedControlNumber,
  studentId: NormalizedStudentId,
});

const OptionalDateString = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

export const CreateElectionSchema = z.object({
  name: NonEmptyString,
  division: DivisionSchema,
  scheduledOpen: OptionalDateString,
  scheduledClose: OptionalDateString,
});

export const SeedPositionsSchema = z.object({
  electionId: Cuid,
  division: DivisionSchema,
});

export const AddSinglePositionSchema = z.object({
  electionId: Cuid,
  division: DivisionSchema,
  title: NonEmptyString,
});

export const RemovePositionSchema = z.object({
  positionId: Cuid,
  electionId: Cuid,
});

export const AddCandidateSchema = z.object({
  positionId: Cuid,
  electionId: Cuid,
  fullName: NonEmptyString,
});

export const RemoveCandidateSchema = z.object({
  candidateId: Cuid,
  electionId: Cuid,
});

export const ElectionIdSchema = z.object({
  electionId: Cuid,
});

export const RemoveVoterSchema = z.object({
  voterId: Cuid,
  electionId: Cuid,
});

const SchoolYear = z
  .string()
  .transform((s) => parseInt(s, 10))
  .pipe(z.number().int().min(2000).max(2100));

export const AddVotersFromCSVSchema = z.object({
  electionId: Cuid,
  csvText: NonEmptyString,
  schoolYear: SchoolYear,
});

const GradeLevelString = z
  .string()
  .transform((s) => parseInt(s, 10))
  .pipe(z.number().int().min(1).max(12));

export const AddVoterManualSchema = z.object({
  electionId: Cuid,
  studentId: NonEmptyString,
  gradeLevel: GradeLevelString,
  section: NonEmptyString,
  schoolYear: SchoolYear,
});

export type VoterLoginInput = z.infer<typeof VoterLoginSchema>;
export type CreateElectionInput = z.infer<typeof CreateElectionSchema>;
export type SeedPositionsInput = z.infer<typeof SeedPositionsSchema>;
export type AddSinglePositionInput = z.infer<typeof AddSinglePositionSchema>;
export type RemovePositionInput = z.infer<typeof RemovePositionSchema>;
export type AddCandidateInput = z.infer<typeof AddCandidateSchema>;
export type RemoveCandidateInput = z.infer<typeof RemoveCandidateSchema>;
export type ElectionIdInput = z.infer<typeof ElectionIdSchema>;
export type RemoveVoterInput = z.infer<typeof RemoveVoterSchema>;
export type AddVotersFromCSVInput = z.infer<typeof AddVotersFromCSVSchema>;
export type AddVoterManualInput = z.infer<typeof AddVoterManualSchema>;

function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const obj: Record<string, FormDataEntryValue> = {};
  Array.from(formData.entries()).forEach(([key, value]) => {
    obj[key] = value;
  });
  return obj;
}

export function parseFormData<T extends z.ZodTypeAny>(schema: T, formData: FormData): z.infer<T> {
  return schema.parse(formDataToObject(formData));
}

export function safeParseFormData<T extends z.ZodTypeAny>(schema: T, formData: FormData) {
  return schema.safeParse(formDataToObject(formData));
}

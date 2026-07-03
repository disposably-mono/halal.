import { z } from "zod";
import type { AdminRole, Division, ElectionStatus } from "@prisma/client";
import {
  CONTROL_NUMBER_REGEX,
  SECTION_REGEX,
  STUDENT_ID_REGEX,
} from "@/lib/domain/control-number";

const NonEmptyString = z.string().trim().min(1);
const Cuid = z.string().min(1);

const DIVISION_VALUES = ["GS", "JHS", "SHS", "HC"] as const satisfies readonly Division[];
const ELECTION_STATUS_VALUES = ["DRAFT", "SCHEDULED", "OPEN", "CLOSED"] as const satisfies readonly ElectionStatus[];
const ADMIN_ROLE_VALUES = [
  "SUPERADMIN",
  "COMMISSIONER",
  "CANVASSER",
  "OFFICER",
] as const satisfies readonly AdminRole[];

export const DivisionSchema = z.enum(DIVISION_VALUES);
export const ElectionStatusSchema = z.enum(ELECTION_STATUS_VALUES);
export const AdminRoleSchema = z.enum(ADMIN_ROLE_VALUES);

const NormalizedControlNumber = z
  .string()
  .transform((s) => s.trim().toUpperCase())
  .pipe(z.string().regex(CONTROL_NUMBER_REGEX));

const NormalizedStudentId = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().regex(STUDENT_ID_REGEX));

// Section is a single A–H letter — the exact slot a control number encodes. A
// roster row outside this range would mint an unusable code, so reject it here.
const NormalizedSection = z
  .string()
  .transform((s) => s.trim().toUpperCase())
  .pipe(z.string().regex(SECTION_REGEX));

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

// Bounds the CSV import payload so an oversized upload can't be used to tie up
// the parser/DB import path — 200KB comfortably covers a full-school roster.
const CSVText = NonEmptyString.max(200_000, "CSV file is too large (max 200KB).");

export const AddVotersFromCSVSchema = z.object({
  electionId: Cuid,
  csvText: CSVText,
  schoolYear: SchoolYear,
});

const GradeLevelString = z
  .string()
  .transform((s) => parseInt(s, 10))
  .pipe(z.number().int().min(1).max(12));

export const AddVoterManualSchema = z.object({
  electionId: Cuid,
  studentId: NormalizedStudentId,
  gradeLevel: GradeLevelString,
  section: NormalizedSection,
  schoolYear: SchoolYear,
});

// ─── Admin account management ───────────────────────────────────────────────

const Password = z.string().min(8, "Password must be at least 8 characters.");
// The officer key is the sole factor guarding /admin-help and co-signs admin
// login (2FA), so it needs meaningfully more entropy than a 6-char minimum.
const OfficerKey = z.string().min(12, "Officer key must be at least 12 characters.");
const Email = z.string().trim().toLowerCase().email();

export const CreateAdminSchema = z.object({
  email: Email,
  name: NonEmptyString,
  role: AdminRoleSchema,
  password: Password,
  officerKey: OfficerKey,
});

export const UpdateAdminRoleSchema = z.object({
  adminId: Cuid,
  role: AdminRoleSchema,
});

export const ResetPasswordSchema = z.object({
  adminId: Cuid,
  password: Password,
});

export const ResetOfficerKeySchema = z.object({
  adminId: Cuid,
  officerKey: OfficerKey,
});

export const DeleteAdminSchema = z.object({
  adminId: Cuid,
});

export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminRoleInput = z.infer<typeof UpdateAdminRoleSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ResetOfficerKeyInput = z.infer<typeof ResetOfficerKeySchema>;
export type DeleteAdminInput = z.infer<typeof DeleteAdminSchema>;

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

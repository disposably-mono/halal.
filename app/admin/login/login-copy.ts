export type OfficerKeyFailureReason =
  | "primary"
  | "ownOfficerKey"
  | "noOtherOfficer"
  | "rateLimited"
  | "unknown";

export type LoginFailureCopy = {
  field: "credentials" | "officerKey";
  message: string;
  shouldResetToCredentials: boolean;
};

export function getOfficerKeyFailure(reason: OfficerKeyFailureReason | string): LoginFailureCopy {
  if (reason === "primary") {
    return {
      field: "credentials",
      message: "Incorrect email or password. Please try again.",
      shouldResetToCredentials: true,
    };
  }

  if (reason === "ownOfficerKey") {
    return {
      field: "officerKey",
      message: "You cannot use your own officer key. Ask another COMELEC officer to verify.",
      shouldResetToCredentials: false,
    };
  }

  if (reason === "noOtherOfficer") {
    return {
      field: "officerKey",
      message: "Another admin account is required for officer verification.",
      shouldResetToCredentials: false,
    };
  }

  if (reason === "rateLimited") {
    return {
      field: "credentials",
      message: "Too many sign-in attempts. Please wait a few minutes and try again.",
      shouldResetToCredentials: true,
    };
  }

  return {
    field: "officerKey",
    message: "That key does not match another COMELEC officer. Please try again.",
    shouldResetToCredentials: false,
  };
}

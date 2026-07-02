// Serializable nav model shared between the server layout (which computes it from
// capability checks) and the client AdminShell (which renders it). Keep this file
// free of JSX/React so it can be safely imported by both server and client code.

export type NavIconKey =
  | "dashboard"
  | "new-election"
  | "results"
  | "voters"
  | "candidates"
  | "accounts"
  | "history";

export interface NavItemModel {
  href: string;
  label: string;
  iconKey: NavIconKey;
  exact?: boolean;
}

export interface NavSectionModel {
  label: string;
  items: NavItemModel[];
}

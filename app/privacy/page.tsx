import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy | halal. OLPS COMELEC",
  description:
    "How HALAL handles OLPS COMELEC voter records, anonymous ballots, receipt verification, admin access, cookies, and operational logs.",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}

import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Data & Privacy Policy · OLPS COMELEC",
  description:
    "How the OLPS COMELEC HALAL voting system handles student and admin data, cookies, and voter anonymity under the Data Privacy Act (RA 10173).",
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}

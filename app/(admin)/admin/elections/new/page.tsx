import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Breadcrumb, PageContainer, PageHeader } from "@/components/admin/ui";
import { NewElectionForm } from "./NewElectionForm";

export default async function NewElectionPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <PageContainer className="max-w-3xl space-y-[27px]">
      <PageHeader
        eyebrow="Setup"
        title="Create Election"
        breadcrumb={<Breadcrumb items={[{ href: "/admin", label: "Dashboard" }, { label: "New Election" }]} />}
        meta="Set up the details. You can add candidates and voters after creation."
      />
      <NewElectionForm />
    </PageContainer>
  );
}

import { PeopleCreateClient } from "@/app/[tenant]/(modules)/people/_components/people-create-client";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";

export default function PeopleCreatePage() {
  return (
    <div className="px-4 py-4 space-y-6">
      <PageBreadcrumb
        title="Novo cadastro"
        items={[
          { label: "Pessoas", href: "/people" },
          { label: "Novo cadastro" },
        ]}
      />
      <PeopleCreateClient />
    </div>
  );
}




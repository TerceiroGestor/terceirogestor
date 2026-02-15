import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PeopleCreateClient } from "@/modules/people/shared/ui/people-create-client";

export function PeopleCreatePage() {
  return (
    <div className="space-y-6 px-4 py-4">
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


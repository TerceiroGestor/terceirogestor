import { notFound } from "next/navigation";
import { getPersonById } from "@/modules/people/features/edit/data";
import { PeopleEditClient } from "@/modules/people/shared/ui/people-edit-client";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { resolvePersonDisplayNames } from "@/modules/people/shared/domain/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function PeopleEditPage({ params }: PageProps) {
  const { id } = await params;
  const person = getPersonById(id);
  if (!person) {
    notFound();
  }
  const displayNames = resolvePersonDisplayNames(
    person.fullName,
    person.socialName,
  );

  return (
    <div className="px-4 py-4 space-y-6">
      <PageBreadcrumb
        title="Editar cadastro"
        items={[
          { label: "Pessoas", href: "/people" },
          { label: displayNames.primary, href: `/people/${person.id}` },
          { label: "Editar" },
        ]}
      />
      <PeopleEditClient person={person} />
    </div>
  );
}

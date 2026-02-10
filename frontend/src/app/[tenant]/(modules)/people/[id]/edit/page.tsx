import { notFound } from "next/navigation";
import { getPersonById } from "../../data";
import { PeopleEditClient } from "@/app/[tenant]/(modules)/people/_components/people-edit-client";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { resolvePersonDisplayNames } from "../../utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PeopleEditPage({ params }: PageProps) {
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


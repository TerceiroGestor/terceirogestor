import { notFound } from "next/navigation";
import { getPersonById } from "../data";
import { PeopleDetailClientPage } from "../_components/people-detail-client-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PeopleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const person = getPersonById(id);
  if (!person) {
    notFound();
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <PeopleDetailClientPage person={person} />
    </div>
  );
}

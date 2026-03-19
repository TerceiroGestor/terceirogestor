import { redirect } from "next/navigation";

export default async function PeopleFamilyRelationNewRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  redirect(`/${tenant}/person/${id}/family-relations/new`);
}

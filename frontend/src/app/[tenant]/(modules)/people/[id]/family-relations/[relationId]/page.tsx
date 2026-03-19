import { redirect } from "next/navigation";

export default async function PeopleFamilyRelationDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; relationId: string }>;
}) {
  const { tenant, id, relationId } = await params;
  redirect(`/${tenant}/person/${id}/family-relations/${relationId}`);
}

import { redirect } from "next/navigation";

export default async function PeopleDetentionDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; detentionId: string }>;
}) {
  const { tenant, id, detentionId } = await params;
  redirect(`/${tenant}/person/${id}/detentions/${detentionId}`);
}

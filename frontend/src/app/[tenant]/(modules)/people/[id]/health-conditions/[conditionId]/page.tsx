import { redirect } from "next/navigation";

export default async function PeopleHealthConditionDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; conditionId: string }>;
}) {
  const { tenant, id, conditionId } = await params;
  redirect(`/${tenant}/person/${id}/health-conditions/${conditionId}`);
}

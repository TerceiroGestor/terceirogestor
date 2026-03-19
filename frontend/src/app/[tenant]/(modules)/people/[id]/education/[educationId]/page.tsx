import { redirect } from "next/navigation";

export default async function PeopleEducationDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; educationId: string }>;
}) {
  const { tenant, id, educationId } = await params;
  redirect(`/${tenant}/person/${id}/education/${educationId}`);
}

import { redirect } from "next/navigation";

export default async function PeopleMedicationDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; medicationId: string }>;
}) {
  const { tenant, id, medicationId } = await params;
  redirect(`/${tenant}/person/${id}/medications/${medicationId}`);
}

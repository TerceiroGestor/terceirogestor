import { redirect } from "next/navigation";

export default async function PeopleBenefitDetailCompatibilityPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string; benefitId: string }>;
}) {
  const { tenant, id, benefitId } = await params;
  redirect(`/${tenant}/person/${id}/benefits/${benefitId}`);
}

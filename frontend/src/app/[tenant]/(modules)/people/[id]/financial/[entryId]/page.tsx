import { redirect } from "next/navigation";

export default async function PeopleFinancialDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; entryId: string }>;
}) {
  const { tenant, id, entryId } = await params;
  redirect(`/${tenant}/person/${id}/financial/${entryId}`);
}

import { redirect } from "next/navigation";

export default async function PeopleFinancialExpenseNewRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  redirect(`/${tenant}/person/${id}/financial/expenses/new`);
}

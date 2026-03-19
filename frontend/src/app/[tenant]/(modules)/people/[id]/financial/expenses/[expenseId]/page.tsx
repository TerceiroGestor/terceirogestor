import { redirect } from "next/navigation";

export default async function PeopleFinancialExpenseDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; expenseId: string }>;
}) {
  const { tenant, id, expenseId } = await params;
  redirect(`/${tenant}/person/${id}/financial/expenses/${expenseId}`);
}

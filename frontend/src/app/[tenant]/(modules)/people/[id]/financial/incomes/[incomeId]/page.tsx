import { redirect } from "next/navigation";

export default async function PeopleFinancialIncomeDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; incomeId: string }>;
}) {
  const { tenant, id, incomeId } = await params;
  redirect(`/${tenant}/person/${id}/financial/incomes/${incomeId}`);
}

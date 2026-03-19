import { redirect } from "next/navigation";

export default async function PeopleFinancialTransferDetailRedirect({
  params,
}: {
  params: Promise<{ tenant: string; id: string; transferId: string }>;
}) {
  const { tenant, id, transferId } = await params;
  redirect(`/${tenant}/person/${id}/financial/transfers/${transferId}`);
}

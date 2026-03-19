import { redirect } from "next/navigation";

export default async function CycleCreatePage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(`/${tenant}/people-groups/new`);
}

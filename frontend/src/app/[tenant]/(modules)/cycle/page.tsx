import { redirect } from "next/navigation";

export default async function CyclesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(`/${tenant}/people-groups`);
}

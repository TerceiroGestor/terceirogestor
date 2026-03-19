import { redirect } from "next/navigation";

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant } = await params;
  redirect(`/${tenant}/people-groups`);
}

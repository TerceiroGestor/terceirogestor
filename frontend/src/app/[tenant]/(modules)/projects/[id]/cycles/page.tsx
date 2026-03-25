import { redirect } from "next/navigation";

export default async function ProjectCyclesManagePage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  redirect(`/${tenant}/projects/${id}`);
}

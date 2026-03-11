import { redirect } from "next/navigation";
import { withTenantPath } from "@/lib/tenant-path";

export default async function PersonEditRoutePage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  redirect(withTenantPath(`/person/${id}`, tenant));
}

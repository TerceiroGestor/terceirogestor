import { redirect } from "next/navigation";
import { withTenantPath } from "@/lib/tenant-path";

export default function PersonEditRoutePage({
  params,
}: {
  params: { tenant: string; id: string };
}) {
  redirect(withTenantPath(`/person/${params.id}`, params.tenant));
}

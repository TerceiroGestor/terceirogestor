import { redirect } from "next/navigation";
import { withTenantPath } from "@/lib/tenant-path";

export default function PeopleLegacyPage({
  params,
}: {
  params: { tenant: string };
}) {
  redirect(withTenantPath("/person", params.tenant));
}

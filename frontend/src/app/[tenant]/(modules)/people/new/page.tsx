import { redirect } from "next/navigation";
import { withTenantPath } from "@/lib/tenant-path";

export default function PeopleCreateLegacyPage({
  params,
}: {
  params: { tenant: string };
}) {
  redirect(withTenantPath("/person/new", params.tenant));
}

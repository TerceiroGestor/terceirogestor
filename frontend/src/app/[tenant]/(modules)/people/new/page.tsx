import { redirect } from "next/navigation";
import { withTenantPath } from "@/lib/tenant-path";

export default async function PeopleCreateLegacyPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(withTenantPath("/person/new", tenant));
}

import { redirect } from "next/navigation";
import { withTenantPath } from "@/lib/tenant-path";

export default function PantryExitPage({ params }: { params: { tenant: string } }) {
  redirect(withTenantPath("/pantry/stock", params.tenant));
}

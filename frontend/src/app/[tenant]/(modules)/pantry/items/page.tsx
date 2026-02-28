import { redirect } from "next/navigation";
import { withTenantPath } from "@/lib/tenant-path";

export default function PantryItemsPage({ params }: { params: { tenant: string } }) {
  redirect(withTenantPath("/pantry/stock", params.tenant));
}

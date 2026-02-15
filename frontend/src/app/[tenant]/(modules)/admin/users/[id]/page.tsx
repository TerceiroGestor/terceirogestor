import { AdminUserDetailClientPage } from "@/modules/core/features/admin-users/ui/admin-user-detail-client-page";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const resolved = await params;
  return <AdminUserDetailClientPage userId={resolved.id} />;
}

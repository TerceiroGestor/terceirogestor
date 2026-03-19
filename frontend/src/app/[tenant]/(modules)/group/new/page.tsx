import { ProjectGroupsCreateStandalonePage } from "@/modules/projects/features/detail/ui/project-groups-create-standalone-page";

export default async function GroupNewPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return <ProjectGroupsCreateStandalonePage tenantSlug={tenant} />;
}

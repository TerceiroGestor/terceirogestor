"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Person } from "../types";
import { PeopleRelationsForm } from "./people-relations-form";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export function PeopleEditClient({ person }: { person: Person }) {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  return (
    <PeopleRelationsForm
      initialValues={person}
      onSubmit={(values) => console.log(values)}
      onCancel={() =>
        router.push(withTenantPath(`/people/${person.id}`, tenantSlug))
      }
    />
  );
}

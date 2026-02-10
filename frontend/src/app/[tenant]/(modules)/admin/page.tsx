"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);

  React.useEffect(() => {
    router.replace(withTenantPath("/admin/users", tenantSlug));
  }, [router, tenantSlug]);

  return (
    <div className="px-4 py-6 text-sm text-muted-foreground">
      Redirecionando...
    </div>
  );
}

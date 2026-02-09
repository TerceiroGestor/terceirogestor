"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTenantSlugFromPath, withTenantPath } from "@/lib/tenant-path";

export type FamilyPreviewMember = {
  id?: string;
  name: string;
  role: string;
  avatar: string;
};

export function FamilyPreview({ members }: { members: FamilyPreviewMember[] }) {
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  if (!members.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Sem familiares registrados.
      </p>
    );
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-4">
        {members.map((member) => (
          <div key={member.name} className="flex items-center gap-2">
            <div className="text-xs text-right">
              {member.id ? (
                <Link
                  href={withTenantPath(`/people/${member.id}`, tenantSlug)}
                  className="font-medium text-foreground hover:text-foreground/80"
                >
                  {member.name}
                </Link>
              ) : (
                <p className="font-medium text-foreground">{member.name}</p>
              )}
              <p className="text-[11px] text-muted-foreground">{member.role}</p>
            </div>
            <Avatar className="h-9 w-9 ring-2 ring-background">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>
                {member.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Cake, HeartPulse, Pill, ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/api";
import {
  getInitials,
  resolvePersonDisplayNames,
} from "@/app/[tenant]/(modules)/people/utils";
import Link from "next/link";
import { withTenantPath } from "@/lib/tenant-path";

type PersonIdentityCardProps = {
  personId?: string;
  tenantSlug?: string | null;
  fullName: string;
  socialName?: string | null;
  ageLabel?: string | null;
  avatarUrl?: string | null;
  hasHealthCondition?: boolean | null;
  hasMedication?: boolean | null;
  isBirthdayToday?: boolean | null;
};

export function PersonIdentityCard({
  personId,
  tenantSlug,
  fullName,
  socialName,
  ageLabel,
  avatarUrl,
  hasHealthCondition,
  hasMedication,
  isBirthdayToday,
}: PersonIdentityCardProps) {
  const { primary, secondary } = resolvePersonDisplayNames(
    fullName,
    socialName,
  );
  const avatarSrc = resolveMediaUrl(avatarUrl || "/avatar.jpg");

  return (
    <div className="flex w-full items-center gap-4 rounded-2xl border border-border bg-muted/30 px-4 py-3">
      <div className="relative">
        <Avatar className="h-36 w-36">
          <AvatarImage src={avatarSrc} />
          <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-base font-semibold text-foreground">
              {primary}
            </div>
            {secondary ? (
              <div className="text-sm text-muted-foreground">{secondary}</div>
            ) : null}
          </div>
          {personId ? (
            <Link
              href={withTenantPath(`/people/${personId}`, tenantSlug)}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              Ver detalhes
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {ageLabel ?? "Idade nao informada"}
        </div>
        <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
          {hasHealthCondition ? (
            <Badge variant="outline" className="gap-1">
              <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
              Saude
            </Badge>
          ) : null}
          {hasMedication ? (
            <Badge variant="outline" className="gap-1">
              <Pill className="h-3.5 w-3.5 text-blue-500" />
              Medicacao
            </Badge>
          ) : null}
          {isBirthdayToday ? (
            <Badge variant="outline" className="gap-1">
              <Cake className="h-3.5 w-3.5 text-amber-500" />
              Aniversario
            </Badge>
          ) : null}
          {!hasHealthCondition && !hasMedication && !isBirthdayToday ? (
            <span className="text-xs text-muted-foreground">
              Sem sinalizadores no momento
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

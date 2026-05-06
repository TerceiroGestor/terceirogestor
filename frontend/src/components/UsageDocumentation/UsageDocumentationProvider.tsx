"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  UsageDocumentation,
  type UsageDocumentationItem,
  type UsageFlowItem,
} from "@/components/UsageDocumentation/UsageDocumentation";
import {
  buildUsageDocumentationItems,
  type UsageDocumentationSection,
} from "@/components/UsageDocumentation/usage-documentation.helpers";
import { ACTION_CREATE_TEXT } from "@/modules/actions/features/create/config/action-create.constants";
import { ADMIN_USAGE_TEXT } from "@/modules/core/admin/admin.constants";
import { DEPOSIT_USAGE_TEXT } from "@/modules/deposit/shared/domain/deposit.constants";
import { PANTRY_USAGE_TEXT } from "@/modules/pantry/shared/domain/pantry.constants";
import { PEOPLE_SEGMENT_USAGE_TEXT } from "@/modules/people-segments/shared/domain/people-segments.constants";
import { PROGRAM_USAGE_TEXT } from "@/modules/programs/shared/domain/programs.constants";

export type UsageDocumentationConfig = {
  title: string;
  items?: UsageDocumentationItem[];
  children?: React.ReactNode;
  widthPx?: number;
};

type UsageDocumentationContextValue = {
  setConfig: (config: UsageDocumentationConfig | null) => void;
};

const UsageDocumentationContext =
  React.createContext<UsageDocumentationContextValue | null>(null);

const GLOBAL_HELP_FLOWS: UsageFlowItem[] = [
  {
    id: "flow-onboarding-inicial",
    title: "Configuracao inicial da instituicao",
    description:
      "Guia completo para configurar instituicao, programas, equipe e iniciar operacao.",
    tourId: "onboarding",
    searchText: "onboarding configuracao inicial instituicao programas equipe usuarios",
  },
  {
    id: "flow-cadastro-pessoa",
    title: "Como cadastrar nova pessoa",
    description:
      "Mostra o fluxo da lista de pessoas ate o formulario de novo cadastro.",
    tourId: "people-create",
    searchText: "cadastrar pessoa novo beneficiario familia atendimento cadastro",
  },
];

type UsageDocumentationRouteFallback = {
  title: string;
  items: UsageDocumentationItem[];
};

type UsageDocumentationRouteRule = {
  pattern: RegExp;
  fallback: UsageDocumentationRouteFallback;
};

function buildRouteFallback(
  prefix: string,
  title: string,
  sections: readonly UsageDocumentationSection[],
): UsageDocumentationRouteFallback {
  return {
    title,
    items: buildUsageDocumentationItems(prefix, sections),
  };
}

const ROUTE_FALLBACKS: UsageDocumentationRouteRule[] = [
  {
    pattern: /^\/(?:[^/]+\/)?programs\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "programs-detail",
      PROGRAM_USAGE_TEXT.detail.title,
      PROGRAM_USAGE_TEXT.detail.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?people-groups\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "people-segments-detail",
      PEOPLE_SEGMENT_USAGE_TEXT.detail.title,
      PEOPLE_SEGMENT_USAGE_TEXT.detail.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?deposit\/items\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "deposit-items-detail",
      DEPOSIT_USAGE_TEXT.items.title,
      DEPOSIT_USAGE_TEXT.items.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?deposit\/entries\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "deposit-entries-detail",
      DEPOSIT_USAGE_TEXT.entries.title,
      DEPOSIT_USAGE_TEXT.entries.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?deposit\/exits\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "deposit-exits-detail",
      DEPOSIT_USAGE_TEXT.exits.title,
      DEPOSIT_USAGE_TEXT.exits.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?deposit\/donors\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "deposit-donors-detail",
      DEPOSIT_USAGE_TEXT.donors.title,
      DEPOSIT_USAGE_TEXT.donors.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?pantry\/items\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "pantry-items-detail",
      PANTRY_USAGE_TEXT.items.title,
      PANTRY_USAGE_TEXT.items.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?pantry\/entries\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "pantry-entries-detail",
      PANTRY_USAGE_TEXT.entries.title,
      PANTRY_USAGE_TEXT.entries.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?pantry\/exits\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "pantry-exits-detail",
      PANTRY_USAGE_TEXT.exits.title,
      PANTRY_USAGE_TEXT.exits.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?pantry\/donors\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "pantry-donors-detail",
      PANTRY_USAGE_TEXT.donors.title,
      PANTRY_USAGE_TEXT.donors.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?admin\/users\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "admin-users",
      ADMIN_USAGE_TEXT.users.title,
      ADMIN_USAGE_TEXT.users.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?admin\/roles\/(?:new|[^/]+)\/?$/,
    fallback: buildRouteFallback(
      "admin-roles",
      ADMIN_USAGE_TEXT.roles.title,
      ADMIN_USAGE_TEXT.roles.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?actions\/new\/?$/,
    fallback: buildRouteFallback(
      "actions-create",
      ACTION_CREATE_TEXT.usage.title,
      ACTION_CREATE_TEXT.usage.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?actions\/[^/]+\/?$/,
    fallback: buildRouteFallback(
      "actions-create",
      ACTION_CREATE_TEXT.usage.title,
      ACTION_CREATE_TEXT.usage.sections,
    ),
  },
  {
    pattern: /^\/(?:[^/]+\/)?projects\/[^/]+\/actions\/?$/,
    fallback: buildRouteFallback(
      "actions-create",
      ACTION_CREATE_TEXT.usage.title,
      ACTION_CREATE_TEXT.usage.sections,
    ),
  },
];

function normalizePathname(pathname: string | null): string {
  const value = String(pathname ?? "").trim();
  if (!value) return "";
  if (value === "/") return value;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveRouteFallback(pathname: string): UsageDocumentationRouteFallback | null {
  if (!pathname) return null;
  const match = ROUTE_FALLBACKS.find((rule) => rule.pattern.test(pathname));
  return match?.fallback ?? null;
}

export function UsageDocumentationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [config, setConfig] = React.useState<UsageDocumentationConfig | null>(null);
  const normalizedPathname = React.useMemo(
    () => normalizePathname(pathname),
    [pathname],
  );
  const routeFallback = React.useMemo(
    () => resolveRouteFallback(normalizedPathname),
    [normalizedPathname],
  );
  const contextValue = React.useMemo(
    () => ({ setConfig }),
    [],
  );

  const defaultTitle = React.useMemo(() => {
    const value = normalizedPathname;
    if (!value) return "Ajuda";
    return value;
  }, [normalizedPathname]);

  return (
    <UsageDocumentationContext.Provider value={contextValue}>
      {children}
      <UsageDocumentation
        title={config?.title ?? routeFallback?.title ?? defaultTitle}
        items={config?.items ?? routeFallback?.items}
        flows={GLOBAL_HELP_FLOWS}
        widthPx={config?.widthPx}
      >
        {config?.children ?? (
          <div className="text-sm text-muted-foreground">
            Documentação desta página ainda não foi cadastrada.
          </div>
        )}
      </UsageDocumentation>
    </UsageDocumentationContext.Provider>
  );
}

export function useRegisterUsageDocumentation(
  config: UsageDocumentationConfig | null,
) {
  const ctx = React.useContext(UsageDocumentationContext);
  const contextSetConfig = ctx?.setConfig;

  React.useEffect(() => {
    contextSetConfig?.(config);
    return () => contextSetConfig?.(null);
  }, [config, contextSetConfig]);
}

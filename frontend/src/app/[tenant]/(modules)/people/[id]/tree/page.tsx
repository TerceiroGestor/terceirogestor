"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { SectionCard } from "@/components/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PersonIdentityAvatarTrigger } from "@/components/person-identity-card";
import { useAuth } from "@/features/auth/auth-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  getPersonRelationsTree,
  type ApiPersonRelationsTreeResponse,
} from "@/features/people/api";
import {
  getAgeFromBirthDate,
  resolvePersonDisplayNames,
} from "@/app/[tenant]/(modules)/people/utils";
import {
  getTenantSlugFromPath,
  withTenantPath,
} from "@/lib/tenant-path";
import type {
  PersonRelationsTree,
  PersonTreeEdge,
  PersonTreeNode,
} from "@/app/[tenant]/(modules)/people/types";

const depthOptions = [
  { value: "1", label: "1 nivel" },
  { value: "2", label: "2 niveis" },
  { value: "3", label: "3 niveis" },
  { value: "4", label: "4 niveis" },
];

const relationLegend = [
  "Pai/Mae",
  "Filho(a)",
  "Irmao(a)",
  "Conjuge",
];

const mapApiTree = (
  data: ApiPersonRelationsTreeResponse,
): PersonRelationsTree => ({
  rootId: data.rootId,
  depth: data.depth,
  truncated: data.truncated,
  nodes: data.nodes.map((node) => ({
    ...node,
  })),
  edges: data.edges.map((edge) => ({
    ...edge,
  })),
});

const resolveRelationLabel = (
  nodeId: string,
  tree: PersonRelationsTree | null,
  parentEdges: Map<string, PersonTreeEdge>,
) => {
  if (!tree) return null;
  if (nodeId === tree.rootId) return "Pessoa base";
  return parentEdges.get(nodeId)?.type ?? "Relacionado";
};

const resolveParentName = (
  node: PersonTreeNode,
  nodesById: Map<string, PersonTreeNode>,
  depthById: Map<string, number>,
  parentEdges: Map<string, PersonTreeEdge>,
) => {
  const edge = parentEdges.get(node.id);
  if (!edge) return null;
  const fromDepth = depthById.get(edge.fromId);
  const toDepth = depthById.get(edge.toId);
  if (fromDepth === undefined || toDepth === undefined) return null;
  const parentId =
    fromDepth === node.depth - 1 ? edge.fromId : edge.toId;
  return nodesById.get(parentId)?.fullName ?? null;
};

export default function PeopleTreePage() {
  const params = useParams();
  const pathname = usePathname();
  const tenantSlug = getTenantSlugFromPath(pathname);
  const { token } = useAuth();
  useRequireAuth();

  const [depthValue, setDepthValue] = React.useState("2");
  const [tree, setTree] = React.useState<PersonRelationsTree | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const personId = React.useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  React.useEffect(() => {
    if (!token || !personId) return;
    setIsLoading(true);
    setError(null);
    getPersonRelationsTree(token, personId, {
      depth: Number(depthValue) || 2,
    })
      .then((data) => setTree(mapApiTree(data)))
      .catch((err) => {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Falha ao carregar arvore genealogica.";
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [token, personId, depthValue]);

  const nodes = tree?.nodes ?? [];
  const edges = tree?.edges ?? [];
  const depthById = React.useMemo(() => {
    return new Map(nodes.map((node) => [node.id, node.depth]));
  }, [nodes]);
  const nodesById = React.useMemo(() => {
    return new Map(nodes.map((node) => [node.id, node]));
  }, [nodes]);

  const parentEdges = React.useMemo(() => {
    const map = new Map<string, PersonTreeEdge>();
    edges.forEach((edge) => {
      const fromDepth = depthById.get(edge.fromId);
      const toDepth = depthById.get(edge.toId);
      if (fromDepth === undefined || toDepth === undefined) return;
      if (toDepth === fromDepth + 1 && !map.has(edge.toId)) {
        map.set(edge.toId, edge);
      }
      if (fromDepth === toDepth + 1 && !map.has(edge.fromId)) {
        map.set(edge.fromId, edge);
      }
    });
    return map;
  }, [edges, depthById]);

  const columns = React.useMemo(() => {
    if (!tree) return [];
    const maxDepth = Math.max(0, ...nodes.map((node) => node.depth));
    const buckets: PersonTreeNode[][] = Array.from(
      { length: maxDepth + 1 },
      () => [],
    );
    nodes.forEach((node) => {
      buckets[node.depth]?.push(node);
    });
    buckets.forEach((bucket) =>
      bucket.sort((a, b) => a.fullName.localeCompare(b.fullName)),
    );
    return buckets;
  }, [tree, nodes]);

  const rootNode = tree ? nodesById.get(tree.rootId) : null;
  const rootLabel = rootNode
    ? resolvePersonDisplayNames(rootNode.fullName, rootNode.socialName)
        .primary
    : "Pessoa";
  const detailPath = personId ? `/people/${personId}` : "/people";
  const detailHref = withTenantPath(detailPath, tenantSlug);

  return (
    <>
      <PageBreadcrumb
        title="Arvore genealogica"
        items={[
          { label: "Pessoas", href: "/people" },
          { label: rootLabel, href: detailPath },
          { label: "Arvore genealogica" },
        ]}
        actionSlot={
          <Button variant="outline" size="sm" asChild>
            <Link href={detailHref}>Voltar ao detalhe</Link>
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-6">
        <SectionCard
          title="Mapa de relacoes"
          subtitle="Veja parentescos diretos e indiretos."
          actions={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Profundidade
              </span>
              <Select value={depthValue} onValueChange={setDepthValue}>
                <SelectTrigger className="h-8 w-[120px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {depthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          footer={
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span>Legenda:</span>
              {relationLegend.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          }
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">
              {nodes.length} pessoas encontradas
            </Badge>
            <Badge variant="outline">
              Niveis: {tree?.depth ?? depthValue}
            </Badge>
            {tree?.truncated ? (
              <Badge variant="destructive">
                Limite de pessoas atingido
              </Badge>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              Carregando arvore...
            </div>
          ) : null}

          {!isLoading && !error && tree ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-4">
              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
                {columns.map((column, index) => (
                  <div key={`depth-${index}`} className="space-y-3">
                    <div className="rounded-full border border-border/50 bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {index === 0 ? "Pessoa base" : `Nivel ${index}`}
                    </div>
                    {column.length ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {column.map((node) => {
                          const display = resolvePersonDisplayNames(
                            node.fullName,
                            node.socialName,
                          );
                          const ageValue = getAgeFromBirthDate(node.birthDate);
                          const ageLabel =
                            ageValue !== null
                              ? `${ageValue} anos`
                              : "Idade nao informada";
                          const relationLabel = resolveRelationLabel(
                            node.id,
                            tree,
                            parentEdges,
                          );
                          const parentName = resolveParentName(
                            node,
                            nodesById,
                            depthById,
                            parentEdges,
                          );
                          const connectionLabel = parentName
                            ? `Ligado a ${parentName}`
                            : relationLabel
                              ? `Relacionado (${relationLabel})`
                              : "Relacionado";

                          return (
                            <div
                              key={node.id}
                              className={[
                                "flex items-start gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-3 shadow-sm",
                                node.id === tree.rootId
                                  ? "border-primary/40 bg-primary/5"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <PersonIdentityAvatarTrigger
                                personId={node.id}
                                tenantSlug={tenantSlug}
                                fullName={node.fullName}
                                socialName={node.socialName}
                                birthDate={node.birthDate}
                                avatarUrl={node.avatarUrl}
                                hasHealthCondition={node.hasHealthCondition}
                                hasMedication={node.hasMedication}
                                avatarClassName="h-12 w-12"
                                buttonClassName="shrink-0"
                                tooltipLabel="Ver perfil"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {display.primary}
                                </p>
                                {display.secondary ? (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {display.secondary}
                                  </p>
                                ) : null}
                                <p className="text-[11px] text-muted-foreground">
                                  {ageLabel}
                                </p>
                                {node.id !== tree.rootId ? (
                                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span className="relative inline-flex h-2 w-10 items-center">
                                      <span className="absolute left-0 right-0 top-1/2 h-px bg-border/60" />
                                      <span className="absolute right-0 h-2 w-2 rounded-full border border-border bg-background" />
                                    </span>
                                    <span className="truncate">
                                      {connectionLabel}
                                    </span>
                                  </div>
                                ) : null}
                                <div className="mt-2 flex flex-wrap items-center gap-1">
                                  {relationLabel ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      {relationLabel}
                                    </Badge>
                                  ) : null}
                                  {parentName ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {parentName}
                                    </Badge>
                                  ) : null}
                                  {node.personType ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {node.personType}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                        Sem pessoas neste nivel.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>
    </>
  );
}

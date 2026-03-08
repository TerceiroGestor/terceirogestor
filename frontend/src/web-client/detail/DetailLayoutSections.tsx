"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  DetailRelationConfig,
  DetailTabTemplate,
} from "@/web-client/registry/types";
import {
  ModuleEmptyState,
  ModuleSectionHeader,
  MODULE_TABS_LIST_CLASS_NAME,
  MODULE_TAB_TRIGGER_CLASS_NAME,
} from "@/web-client/ui/ModulePrimitives";
import { ListView } from "@/web-client/views/ListView";

function renderRelationSection<
  TContext extends Record<string, unknown>,
  TRow,
>(relation: DetailRelationConfig<TContext, TRow>, context: TContext) {
  if (relation.visible && !relation.visible(context)) return null;

  const loading = relation.loading?.(context) ?? false;
  const rows = relation.rows(context) ?? [];
  const action = relation.action;
  const actionHidden = action?.hidden?.(context) ?? false;
  const actionDisabled = action?.disabled?.(context) ?? false;
  const emptyLabel =
    typeof relation.emptyLabel === "function"
      ? relation.emptyLabel(context)
      : relation.emptyLabel;

  return (
    <section key={relation.key} className="border-t border-border/60 pt-4">
      <ModuleSectionHeader
        title={relation.label}
        description={relation.description}
        meta={!loading ? rows.length : undefined}
        actionSlot={
          action && !actionHidden ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-none border-b border-border/60 px-1"
              onClick={() => action.onClick(context)}
              disabled={actionDisabled}
            >
              {action.icon}
              {action.label}
            </Button>
          ) : null
        }
      />

      <div className="pt-1">
        {loading ? (
          <ModuleEmptyState
            title="Carregando"
            description="Buscando registros relacionados."
            compact
          />
        ) : rows.length ? (
          <ListView<TRow>
            data={rows}
            columns={relation.columns}
            renderCard={
              relation.renderCard
                ? (row) => relation.renderCard?.(row, context)
                : undefined
            }
            groupByFields={relation.groupBy?.(context) ?? []}
            getRowId={relation.getRowId}
            onRowClick={
              relation.onRowClick
                ? (row) => relation.onRowClick?.(row, context)
                : undefined
            }
          />
        ) : (
          <ModuleEmptyState
            title="Sem registros"
            description={emptyLabel ?? "Sem registros."}
            compact
          />
        )}
      </div>
    </section>
  );
}

export function DetailRelationsRenderer<
  TContext extends Record<string, unknown>,
>({
  relations,
  context,
  className,
}: {
  relations: DetailRelationConfig<TContext, any>[];
  context: TContext;
  className?: string;
}) {
  const visibleRelations = React.useMemo(
    () =>
      relations.filter((relation) =>
        relation.visible ? relation.visible(context) : true,
      ),
    [context, relations],
  );

  if (!visibleRelations.length) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {visibleRelations.map((relation) =>
        renderRelationSection(relation, context),
      )}
    </div>
  );
}

export function DetailTabsRenderer<
  TContext extends Record<string, unknown>,
>({
  tabs,
  context,
}: {
  tabs: DetailTabTemplate<TContext>[];
  context: TContext;
}) {
  const visibleTabs = React.useMemo(
    () => tabs.filter((tab) => (tab.visible ? tab.visible(context) : true)),
    [context, tabs],
  );
  const defaultTab = visibleTabs[0]?.key;

  if (!defaultTab) return null;

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className={MODULE_TABS_LIST_CLASS_NAME}>
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className={MODULE_TAB_TRIGGER_CLASS_NAME}
          >
            <span>{tab.label}</span>
            {tab.badge ? (
              <span className="ml-2 text-[11px] font-medium tabular-nums text-muted-foreground">
                {tab.badge(context)}
              </span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>

      {visibleTabs.map((tab) => {
        const hasRelations = Boolean(tab.relations?.length);
        const content = tab.content?.(context) ?? null;

        return (
          <TabsContent key={tab.key} value={tab.key} className="mt-4 space-y-4">
            {content}
            {hasRelations ? (
              <DetailRelationsRenderer
                relations={tab.relations ?? []}
                context={context}
              />
            ) : null}
            {!content && !hasRelations ? (
              <ModuleEmptyState
                title="Sem conteudo"
                description={tab.emptyLabel ?? "Sem conteudo."}
                compact
              />
            ) : null}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

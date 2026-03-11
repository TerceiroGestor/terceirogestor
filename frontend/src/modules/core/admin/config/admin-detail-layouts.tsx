"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RichText } from "@/components/ui/richtext/RichText";
import { RichTextReadonly } from "@/components/ui/richtext/RichTextReadonly";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  RBAC_ACTION_LABELS,
  RBAC_ACTION_ORDER,
  RBAC_MODULE_LABELS,
  splitPermissionKey,
} from "@/features/admin/config/rbac.constants";
import { resolveMediaUrl } from "@/lib/api";
import { formatDateOnlyPtBR, formatDateTimePtBR } from "@/lib/date";
import { cn } from "@/lib/utils";
import type {
  AdminPermissionRecord,
  AdminRoleFormDraft,
  AdminRolePermissionOption,
  AdminRoleRecord,
  AdminSettingsOverviewRecord,
  AdminTenantFormDraft,
  AdminTenantRecord,
  AdminUserFormDraft,
  AdminUserRecord,
  AdminUserRoleOption,
} from "@/modules/core/admin/admin.types";
import type { DetailShellAuditContext } from "@/web-client/detail/DetailShellEngine";
import { DetailAuditFeed } from "@/web-client/detail/DetailAuditFeed";
import { DetailIdentityMediaField } from "@/web-client/detail/DetailIdentityMediaField";
import { DetailSideTabs } from "@/web-client/detail/DetailSideTabs";
import { buildGroupedAuditFeed } from "@/web-client/detail/audit-feed-utils";
import type { DetailLayoutConfig } from "@/web-client/registry/types";
import { CompactMultiSelect } from "@/web-client/ui/CompactMultiSelect";
import { ModuleMetricsStrip, type ModuleMetricItem } from "@/web-client/ui/ModuleMetricsStrip";
import { ModuleEmptyState, ModuleSectionHeader, ModuleSurface } from "@/web-client/ui/ModulePrimitives";

const AUTO_EDITING = {
  saveMode: "auto",
  autoSave: {
    trigger: "field-commit",
  },
} as const;

const lineInputClassName =
  "h-10 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0";
const lineTextareaClassName =
  "min-h-[120px] rounded-none border-0 border-b border-border/60 bg-transparent px-0 py-3 shadow-none resize-none focus-visible:border-primary focus-visible:ring-0";
const fieldLabelClassName =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";
const summaryValueClassName = "text-sm text-foreground";

function normalizePermissionModules(permissionKeys: string[]) {
  const grouped = new Map<string, string[]>();

  permissionKeys.forEach((permissionKey) => {
    const parsed = splitPermissionKey(permissionKey);
    if (!parsed) return;
    const actions = grouped.get(parsed.moduleKey) ?? [];
    actions.push(parsed.action);
    grouped.set(parsed.moduleKey, actions);
  });

  return Array.from(grouped.entries())
    .map(([moduleKey, actions]) => ({
      moduleKey,
      moduleLabel: RBAC_MODULE_LABELS[moduleKey] ?? moduleKey,
      actions: Array.from(new Set(actions)).sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.moduleLabel.localeCompare(right.moduleLabel));
}

function BooleanBadge({
  value,
  trueLabel = "Ativo",
  falseLabel = "Inativo",
}: {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <Badge
      className={cn(
        "rounded-full px-2 text-[10px]",
        value
          ? "border-transparent bg-emerald-500/10 text-emerald-700"
          : "border-transparent bg-slate-500/10 text-slate-700",
      )}
    >
      {value ? trueLabel : falseLabel}
    </Badge>
  );
}

function SectionField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className={fieldLabelClassName}>{label}</div>
      {children}
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function OverviewMain({
  record,
  canReadInstitution,
  canReadUsers,
  canReadRoles,
  canReadAudit,
  onOpenInstitution,
  onOpenUsers,
  onOpenRoles,
  onOpenAudit,
}: Omit<AdminOverviewLayoutContext, keyof DetailShellAuditContext>) {
  const items = React.useMemo<ModuleMetricItem[]>(
    () => [
      {
        key: "users",
        label: "Usuarios",
        value: record.usersTotal,
        description: `${record.activeUsersTotal} ativos`,
        tone: "info",
        onClick: canReadUsers ? onOpenUsers : undefined,
      },
      {
        key: "roles",
        label: "Perfis",
        value: record.rolesTotal,
        description: "Estrutura de acesso",
        tone: "warning",
        onClick: canReadRoles ? onOpenRoles : undefined,
      },
      {
        key: "permissions",
        label: "Permissoes",
        value: record.permissionsTotal,
        description: "Chaves registradas",
        tone: "default",
      },
      {
        key: "inactive",
        label: "Inativos",
        value: record.inactiveUsersTotal,
        description: "Usuarios fora de operacao",
        tone: record.inactiveUsersTotal ? "danger" : "success",
      },
      {
        key: "audit",
        label: "Auditoria",
        value: canReadAudit ? "Ativa" : "Restrita",
        description: "Rastreabilidade do modulo",
        tone: canReadAudit ? "success" : "default",
        onClick: canReadAudit ? onOpenAudit : undefined,
      },
    ],
    [
      canReadAudit,
      canReadRoles,
      canReadUsers,
      onOpenAudit,
      onOpenRoles,
      onOpenUsers,
      record.activeUsersTotal,
      record.inactiveUsersTotal,
      record.permissionsTotal,
      record.rolesTotal,
      record.usersTotal,
    ],
  );

  return (
    <div className="space-y-6">
      <ModuleMetricsStrip items={items} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.38fr)]">
        <ModuleSurface className="p-4">
          <ModuleSectionHeader
            title="Resumo da administracao"
            description="Panorama da instituicao e pontos de acesso rapido."
            actionSlot={
              canReadInstitution ? (
                <Button variant="outline" size="sm" onClick={onOpenInstitution}>
                  Abrir instituicao
                </Button>
              ) : null
            }
          />

          <div className="grid gap-4 pt-4 md:grid-cols-2">
            <SectionField label="Instituicao">
              <div className={summaryValueClassName}>{record.name}</div>
            </SectionField>
            <SectionField label="Status">
              <div className={summaryValueClassName}>{record.status ?? "-"}</div>
            </SectionField>
            <SectionField label="Slug">
              <div className="font-mono text-sm text-foreground">{record.slug ?? "-"}</div>
            </SectionField>
            <SectionField label="CNPJ">
              <div className={summaryValueClassName}>{record.cnpj ?? "-"}</div>
            </SectionField>
            <SectionField label="Ano de inicio">
              <div className={summaryValueClassName}>{record.startYear ?? "-"}</div>
            </SectionField>
            <SectionField label="Atualizado">
              <div className={summaryValueClassName}>{formatDateTimePtBR(record.updatedAt)}</div>
            </SectionField>
          </div>
        </ModuleSurface>

        <ModuleSurface className="p-4">
          <ModuleSectionHeader
            title="Navegacao"
            description="Acesse rapidamente as areas administrativas."
          />
          <div className="grid gap-2 pt-4">
            <Button variant="ghost" className="justify-between rounded-none px-0" onClick={onOpenInstitution} disabled={!canReadInstitution}>
              Instituicao
              <span className="text-xs text-muted-foreground">Detalhe</span>
            </Button>
            <Button variant="ghost" className="justify-between rounded-none px-0" onClick={onOpenUsers} disabled={!canReadUsers}>
              Usuarios
              <span className="text-xs text-muted-foreground">{record.usersTotal}</span>
            </Button>
            <Button variant="ghost" className="justify-between rounded-none px-0" onClick={onOpenRoles} disabled={!canReadRoles}>
              Perfis
              <span className="text-xs text-muted-foreground">{record.rolesTotal}</span>
            </Button>
            <Button variant="ghost" className="justify-between rounded-none px-0" onClick={onOpenAudit} disabled={!canReadAudit}>
              Auditoria
              <span className="text-xs text-muted-foreground">Logs</span>
            </Button>
          </div>
        </ModuleSurface>
      </div>

      <ModuleSurface className="p-4">
        <ModuleSectionHeader
          title="Descricao"
          description="Apresentacao institucional usada como referencia administrativa."
        />
        <div className="pt-4">
          {record.description ? (
            <RichTextReadonly value={record.description} bodyClassName="max-h-none" />
          ) : (
            <ModuleEmptyState
              title={null}
              description="Nenhuma descricao institucional cadastrada."
              compact
              className="border border-dashed border-border/50"
            />
          )}
        </div>
      </ModuleSurface>
    </div>
  );
}

function OverviewSide({
  record,
  canReadUsers,
  canReadRoles,
  canReadAudit,
}: Pick<AdminOverviewLayoutContext, "record" | "canReadUsers" | "canReadRoles" | "canReadAudit">) {
  return (
    <DetailSideTabs
      tabs={[
        {
          value: "context",
          label: "Contexto",
          content: (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Usuarios ativos</span>
                  <span className="text-foreground">{record.activeUsersTotal}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Usuarios inativos</span>
                  <span className="text-foreground">{record.inactiveUsersTotal}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Perfis</span>
                  <span className="text-foreground">{record.rolesTotal}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Permissoes</span>
                  <span className="text-foreground">{record.permissionsTotal}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Acesso a usuarios</span>
                  <span className="text-foreground">{canReadUsers ? "Sim" : "Nao"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Acesso a perfis</span>
                  <span className="text-foreground">{canReadRoles ? "Sim" : "Nao"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Acesso a auditoria</span>
                  <span className="text-foreground">{canReadAudit ? "Sim" : "Nao"}</span>
                </div>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}

function TenantForm({
  draft,
  canEdit,
  onDraftChange,
  onCommitField,
}: {
  draft: AdminTenantFormDraft;
  canEdit: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<AdminTenantFormDraft>>;
  onCommitField?: <K extends keyof AdminTenantFormDraft>(
    field: K,
    nextValue?: AdminTenantFormDraft[K],
  ) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionField label="Instituicao">
        <Input
          value={draft.name}
          onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, name: event.target.value }))
          }
          className={lineInputClassName}
          readOnly={!canEdit}
          onBlur={() => onCommitField?.("name")}
        />
      </SectionField>

      <SectionField label="Slug">
        <Input
          value={draft.slug}
          onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, slug: event.target.value }))
          }
          className={lineInputClassName}
          readOnly={!canEdit}
          onBlur={() => onCommitField?.("slug")}
        />
      </SectionField>

      <SectionField label="CNPJ">
        <Input
          value={draft.cnpj}
          onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, cnpj: event.target.value }))
          }
          className={lineInputClassName}
          readOnly={!canEdit}
          onBlur={() => onCommitField?.("cnpj")}
        />
      </SectionField>

      <SectionField label="Ano de inicio">
        <Input
          type="number"
          value={draft.startYear}
          onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, startYear: event.target.value }))
          }
          className={lineInputClassName}
          readOnly={!canEdit}
          onBlur={() => onCommitField?.("startYear")}
        />
      </SectionField>

      <div className="xl:col-span-2 space-y-2">
        <div className={fieldLabelClassName}>Descricao</div>
        <div className="rounded-lg border border-border/60 bg-background/50 p-3">
          <RichText
            value={draft.description}
            onChange={(value) =>
              onDraftChange((previous) => ({ ...previous, description: value }))
            }
            disabled={!canEdit}
            onBlur={() => onCommitField?.("description")}
          />
        </div>
      </div>
    </div>
  );
}

function TenantSide({
  record,
  canAudit,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
}: {
  record: AdminTenantRecord;
  canAudit: boolean;
  detailAudit?: DetailShellAuditContext["detailAudit"];
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;

  return (
    <DetailSideTabs
      tabs={[
        {
          value: "activity",
          label: "Atividade",
          badge: canAudit && auditCount ? auditCount : undefined,
          content: canAudit ? (
            <DetailAuditFeed
              mode="edit"
              auditState={detailAudit}
              auditVisibleCount={auditVisibleCount}
              onAuditVisibleCountChange={onAuditVisibleCountChange}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Sem permissao para auditoria.</div>
          ),
        },
        {
          value: "context",
          label: "Contexto",
          content: (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="font-mono text-foreground">{record.slug || "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-foreground">{record.status ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Atualizado</span>
                  <span className="text-foreground">{formatDateTimePtBR(record.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Criado</span>
                  <span className="text-foreground">{formatDateTimePtBR(record.createdAt)}</span>
                </div>
              </div>
            </div>
          ),
        },
      ]}
      defaultValue={canAudit ? "activity" : "context"}
    />
  );
}

function UserForm({
  draft,
  roleOptions,
  canEdit,
  onDraftChange,
  isCreate = false,
  onCommitField,
  onCommitDraft,
}: {
  draft: AdminUserFormDraft;
  roleOptions: AdminUserRoleOption[];
  canEdit: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<AdminUserFormDraft>>;
  isCreate?: boolean;
  onCommitField?: <K extends keyof AdminUserFormDraft>(
    field: K,
    nextValue?: AdminUserFormDraft[K],
  ) => void;
  onCommitDraft?: (nextDraft: AdminUserFormDraft) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <SectionField label="Nome">
        <Input
          value={draft.name}
          onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, name: event.target.value }))
          }
          className={lineInputClassName}
          readOnly={!canEdit}
          onBlur={() => onCommitField?.("name")}
        />
      </SectionField>

      <SectionField label="Email">
        <Input
          type="email"
          value={draft.email}
          onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, email: event.target.value }))
          }
          className={lineInputClassName}
          readOnly={!canEdit}
          onBlur={() => onCommitField?.("email")}
        />
      </SectionField>

      <SectionField label="Senha">
        <Input
          type="password"
          value={draft.password}
          onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, password: event.target.value }))
          }
          className={lineInputClassName}
          readOnly={!canEdit}
          placeholder={isCreate ? "Obrigatoria no cadastro" : "Preencha apenas para alterar"}
          onBlur={() => onCommitField?.("password")}
        />
      </SectionField>

      <SectionField label="Status">
        <div className="flex h-10 items-center">
          <label className="flex items-center gap-3 text-sm text-foreground">
            <Switch
              checked={draft.isActive}
              onCheckedChange={(next) => {
                onDraftChange((previous) => ({ ...previous, isActive: next }));
                onCommitField?.("isActive", next);
              }}
              disabled={!canEdit}
            />
            <span>{draft.isActive ? "Ativo" : "Inativo"}</span>
          </label>
        </div>
      </SectionField>

      <div className="xl:col-span-2 space-y-2">
        <div className={fieldLabelClassName}>Perfis</div>
        <CompactMultiSelect
          options={roleOptions.map((role) => ({
            value: role.id,
            label: role.name,
            description: role.description,
          }))}
          selectedValues={draft.roleIds}
          disabled={!canEdit}
          label="Perfis"
          placeholder="Selecionar perfis"
          emptyLabel="Nenhum perfil vinculado."
          onChange={(roleIds) => {
            const nextDraft = { ...draft, roleIds };
            onDraftChange(() => nextDraft);
            onCommitDraft?.(nextDraft);
          }}
        />
      </div>
    </div>
  );
}

function UserSide({
  user,
  canEdit,
  isCreate,
  canAudit,
  resettingMfa,
  onResetMfa,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
}: {
  user: AdminUserRecord;
  canEdit: boolean;
  isCreate?: boolean;
  canAudit: boolean;
  resettingMfa?: boolean;
  onResetMfa?: () => void;
  detailAudit?: DetailShellAuditContext["detailAudit"];
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;
  const avatarSrc = user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : "";
  const initials = getInitials(user.name?.trim() || user.email);

  return (
    <DetailSideTabs
      tabs={[
        {
          value: "activity",
          label: "Atividade",
          badge: canAudit && auditCount ? auditCount : undefined,
          content: canAudit ? (
            <DetailAuditFeed
              mode="edit"
              auditState={detailAudit}
              auditVisibleCount={auditVisibleCount}
              onAuditVisibleCountChange={onAuditVisibleCountChange}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Sem permissao para auditoria.</div>
          ),
        },
        {
          value: "context",
          label: "Contexto",
          content: (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                <Avatar className="size-12 border border-border/60">
                  {avatarSrc ? <AvatarImage src={avatarSrc} alt={user.name?.trim() || user.email} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {user.name?.trim() || user.email}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <BooleanBadge value={user.isActive} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">MFA</span>
                  <span className="text-foreground">{user.mfaTotpEnabled ? "Ativo" : "Inativo"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Telefone</span>
                  <span className="text-foreground">{user.phone ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Criado</span>
                  <span className="text-foreground">{formatDateTimePtBR(user.createdAt)}</span>
                </div>
              </div>
              <div className="space-y-2 border-t border-border/50 pt-4">
                <div className={fieldLabelClassName}>Bio</div>
                <div className="text-sm text-muted-foreground">{user.bio?.trim() || "Sem bio cadastrada."}</div>
              </div>
            </div>
          ),
        },
        {
          value: "mfa",
          label: "MFA",
          content: (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-foreground">{user.mfaTotpEnabled ? "Ativo" : "Inativo"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Usuario</span>
                  <span className="truncate text-foreground">{user.email}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground">
                {isCreate
                  ? "O MFA fica disponivel depois que o usuario for criado."
                  : user.mfaTotpEnabled
                    ? "O usuario ja configurou o MFA. Voce pode resetar a configuracao atual para exigir um novo setup."
                    : "O usuario ainda nao configurou MFA. A ativacao e feita no proprio perfil do usuario."}
              </div>

              {!isCreate && canEdit ? (
                <Button
                  type="button"
                  variant={user.mfaTotpEnabled ? "outline" : "ghost"}
                  size="sm"
                  onClick={onResetMfa}
                  disabled={resettingMfa || !user.mfaTotpEnabled}
                >
                  {resettingMfa ? "Resetando..." : "Resetar MFA"}
                </Button>
              ) : null}
            </div>
          ),
        },
      ]}
      defaultValue={canAudit ? "activity" : "context"}
    />
  );
}

function PermissionMatrix({
  permissionOptions,
  selectedPermissionKeys,
  readOnly,
  onChange,
}: {
  permissionOptions: AdminRolePermissionOption[];
  selectedPermissionKeys: string[];
  readOnly: boolean;
  onChange: (next: string[]) => void;
}) {
  const modules = React.useMemo(() => {
    const grouped = new Map<
      string,
      {
        moduleLabel: string;
        actions: Array<{
          key: string;
          action: string;
          description: string | null | undefined;
        }>;
      }
    >();

    permissionOptions.forEach((permission) => {
      const parsed = splitPermissionKey(permission.key);
      const moduleKey = parsed?.moduleKey ?? "outros";
      const action = parsed?.action ?? permission.key;
      const current = grouped.get(moduleKey) ?? {
        moduleLabel: RBAC_MODULE_LABELS[moduleKey] ?? moduleKey,
        actions: [],
      };
      current.actions.push({
        key: permission.key,
        action,
        description: permission.description,
      });
      grouped.set(moduleKey, current);
    });

    return Array.from(grouped.entries())
      .map(([moduleKey, group]) => ({
        moduleKey,
        moduleLabel: group.moduleLabel,
        actions: group.actions.sort((left, right) => {
          const leftIndex = RBAC_ACTION_ORDER.indexOf(left.action as never);
          const rightIndex = RBAC_ACTION_ORDER.indexOf(right.action as never);
          return (leftIndex >= 0 ? leftIndex : 99) - (rightIndex >= 0 ? rightIndex : 99);
        }),
      }))
      .sort((left, right) => left.moduleLabel.localeCompare(right.moduleLabel));
  }, [permissionOptions]);

  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-background/50 p-3">
      {modules.map((module) => (
        <div
          key={module.moduleKey}
          className="space-y-3 border-b border-border/40 pb-4 last:border-b-0 last:pb-0"
        >
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">{module.moduleLabel}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{module.moduleKey}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {module.actions.map((permission) => {
              const checked = selectedPermissionKeys.includes(permission.key);
              return (
                <label
                  key={permission.key}
                  className="flex items-start gap-3 rounded-none border border-border/50 px-3 py-2"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) => {
                      if (readOnly) return;
                      onChange(
                        next
                          ? [...selectedPermissionKeys, permission.key]
                          : selectedPermissionKeys.filter((entry) => entry !== permission.key),
                      );
                    }}
                    disabled={readOnly}
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">
                      {RBAC_ACTION_LABELS[permission.action as keyof typeof RBAC_ACTION_LABELS] ??
                        permission.action}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {permission.description?.trim() || permission.key}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleForm({
  draft,
  permissionOptions,
  canEdit,
  onDraftChange,
  onCommitField,
  onCommitDraft,
}: {
  draft: AdminRoleFormDraft;
  permissionOptions: AdminRolePermissionOption[];
  canEdit: boolean;
  onDraftChange: React.Dispatch<React.SetStateAction<AdminRoleFormDraft>>;
  onCommitField?: <K extends keyof AdminRoleFormDraft>(
    field: K,
    nextValue?: AdminRoleFormDraft[K],
  ) => void;
  onCommitDraft?: (nextDraft: AdminRoleFormDraft) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionField label="Perfil">
          <Input
            value={draft.name}
            onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, name: event.target.value }))
          }
          className={lineInputClassName}
          readOnly={!canEdit}
          onBlur={() => onCommitField?.("name")}
        />
        </SectionField>

        <SectionField label="Descricao">
          <Textarea
            value={draft.description}
            onChange={(event) =>
            onDraftChange((previous) => ({ ...previous, description: event.target.value }))
          }
          className={lineTextareaClassName}
          readOnly={!canEdit}
          rows={3}
          onBlur={() => onCommitField?.("description")}
        />
        </SectionField>
      </div>

      <div className="space-y-2">
        <div className={fieldLabelClassName}>Permissoes</div>
        <PermissionMatrix
          permissionOptions={permissionOptions}
          selectedPermissionKeys={draft.permissionKeys}
          readOnly={!canEdit}
          onChange={(permissionKeys) => {
            const nextDraft = { ...draft, permissionKeys };
            onDraftChange(() => nextDraft);
            onCommitDraft?.(nextDraft);
          }}
        />
      </div>
    </div>
  );
}

function RoleSide({
  role,
  permissionKeys,
  canAudit,
  detailAudit,
  auditVisibleCount,
  onAuditVisibleCountChange,
}: {
  role: AdminRoleRecord;
  permissionKeys: string[];
  canAudit: boolean;
  detailAudit?: DetailShellAuditContext["detailAudit"];
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const auditCount = buildGroupedAuditFeed(detailAudit?.logs ?? []).length;
  const modules = normalizePermissionModules(permissionKeys);

  return (
    <DetailSideTabs
      tabs={[
        {
          value: "activity",
          label: "Atividade",
          badge: canAudit && auditCount ? auditCount : undefined,
          content: canAudit ? (
            <DetailAuditFeed
              mode="edit"
              auditState={detailAudit}
              auditVisibleCount={auditVisibleCount}
              onAuditVisibleCountChange={onAuditVisibleCountChange}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Sem permissao para auditoria.</div>
          ),
        },
        {
          value: "context",
          label: "Contexto",
          content: (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Permissoes</span>
                  <span className="text-foreground">{permissionKeys.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Modulos</span>
                  <span className="text-foreground">{modules.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Atualizado</span>
                  <span className="text-foreground">{formatDateTimePtBR(role.updatedAt)}</span>
                </div>
              </div>
              <div className="space-y-3 border-t border-border/50 pt-4">
                {modules.length ? (
                  modules.map((module) => (
                    <div key={module.moduleKey} className="space-y-1">
                      <div className="text-sm font-medium text-foreground">{module.moduleLabel}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {module.actions.map((action) => (
                          <Badge
                            key={`${module.moduleKey}:${action}`}
                            variant="outline"
                            className="rounded-full px-2 text-[10px]"
                          >
                            {RBAC_ACTION_LABELS[action as keyof typeof RBAC_ACTION_LABELS] ?? action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Nenhum modulo ativo.</div>
                )}
              </div>
            </div>
          ),
        },
      ]}
      defaultValue={canAudit ? "activity" : "context"}
    />
  );
}

function rolePermissionColumns(): ColumnDef<AdminPermissionRecord, unknown>[] {
  return [
    {
      accessorKey: "moduleLabel",
      header: "Modulo",
      cell: ({ row }) => row.original.moduleLabel,
    },
    {
      accessorKey: "action",
      header: "Acao",
      cell: ({ row }) =>
        RBAC_ACTION_LABELS[row.original.action as keyof typeof RBAC_ACTION_LABELS] ??
        row.original.action,
    },
    {
      accessorKey: "key",
      header: "Chave",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.key}</span>,
    },
    {
      accessorKey: "description",
      header: "Descricao",
      cell: ({ row }) => row.original.description?.trim() || "-",
    },
  ];
}

function userRoleColumns(): ColumnDef<AdminUserRoleOption, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: "Perfil",
      cell: ({ row }) => row.original.name,
    },
    {
      accessorKey: "description",
      header: "Descricao",
      cell: ({ row }) => row.original.description?.trim() || "-",
    },
  ];
}

export type AdminOverviewLayoutContext = DetailShellAuditContext & {
  record: AdminSettingsOverviewRecord;
  canReadInstitution: boolean;
  canReadUsers: boolean;
  canReadRoles: boolean;
  canReadAudit: boolean;
  onOpenInstitution: () => void;
  onOpenUsers: () => void;
  onOpenRoles: () => void;
  onOpenAudit: () => void;
};

export type AdminTenantLayoutContext = DetailShellAuditContext & {
  record: AdminTenantRecord;
  draft: AdminTenantFormDraft;
  canEdit: boolean;
  canAudit: boolean;
  logoUploading?: boolean;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  onDraftChange: React.Dispatch<React.SetStateAction<AdminTenantFormDraft>>;
  onCommitField?: <K extends keyof AdminTenantFormDraft>(
    field: K,
    nextValue?: AdminTenantFormDraft[K],
  ) => void;
  onLogoFileChange: (file: File | null) => Promise<void> | void;
};

export type AdminUserDetailLayoutContext = DetailShellAuditContext & {
  user: AdminUserRecord;
  draft: AdminUserFormDraft;
  roleOptions: AdminUserRoleOption[];
  canEdit: boolean;
  canAudit: boolean;
  isCreate?: boolean;
  avatarUploading?: boolean;
  resettingMfa?: boolean;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  onDraftChange: React.Dispatch<React.SetStateAction<AdminUserFormDraft>>;
  onResetMfa?: () => void;
  onAvatarFileSelect?: (file: File) => Promise<void> | void;
  onCommitField?: <K extends keyof AdminUserFormDraft>(
    field: K,
    nextValue?: AdminUserFormDraft[K],
  ) => void;
  onCommitDraft?: (nextDraft: AdminUserFormDraft) => void;
};

export type AdminRoleDetailLayoutContext = DetailShellAuditContext & {
  role: AdminRoleRecord;
  draft: AdminRoleFormDraft;
  permissionOptions: AdminRolePermissionOption[];
  selectedPermissionRecords: AdminPermissionRecord[];
  canEdit: boolean;
  canAudit: boolean;
  isCreate?: boolean;
  auditVisibleCount: number;
  onAuditVisibleCountChange: React.Dispatch<React.SetStateAction<number>>;
  onDraftChange: React.Dispatch<React.SetStateAction<AdminRoleFormDraft>>;
  onCommitField?: <K extends keyof AdminRoleFormDraft>(
    field: K,
    nextValue?: AdminRoleFormDraft[K],
  ) => void;
  onCommitDraft?: (nextDraft: AdminRoleFormDraft) => void;
};

export const adminOverviewLayout: DetailLayoutConfig<AdminOverviewLayoutContext> = {
  header: {
    title: ({ record }) => record.name,
    slot: ({ record }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium text-foreground">{record.status ?? "-"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Usuarios</div>
            <div className="font-medium text-foreground">{record.usersTotal}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Perfis</div>
            <div className="font-medium text-foreground">{record.rolesTotal}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Permissoes</div>
            <div className="font-medium text-foreground">{record.permissionsTotal}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: (context) => <OverviewMain {...context} />,
  side: (context) => <OverviewSide {...context} />,
};

export const adminTenantDetailLayout: DetailLayoutConfig<AdminTenantLayoutContext> = {
  editing: AUTO_EDITING,
  header: {
    title: ({ record }) => record.name,
    leadingSlot: ({ draft, canEdit, logoUploading, onLogoFileChange }) => (
      <DetailIdentityMediaField
        variant="header"
        name={draft.name || "Instituicao"}
        value={draft.logoFile ?? draft.logoUrl ?? null}
        shape="rounded"
        readOnly={!canEdit}
        busy={logoUploading}
        onFileSelect={onLogoFileChange ? (file) => onLogoFileChange(file) : undefined}
      />
    ),
    slot: ({ record }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium text-foreground">{record.status ?? "-"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Slug</div>
            <div className="font-mono text-foreground">{record.slug ?? "-"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Atualizado</div>
            <div className="font-medium text-foreground">{formatDateOnlyPtBR(record.updatedAt)}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({ draft, canEdit, onDraftChange, onCommitField }) => (
    <TenantForm
      draft={draft}
      canEdit={canEdit}
      onDraftChange={onDraftChange}
      onCommitField={onCommitField}
    />
  ),
  side: ({
    record,
    canAudit,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
  }) => (
    <TenantSide
      record={record}
      canAudit={canAudit}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
    />
  ),
  auditSources: {
    primaryEntity: {
      key: "tenant",
      entity: "Tenant",
      model: "audit.logs",
      label: "Instituicao",
      fieldLabels: {
        name: "Instituicao",
        slug: "Slug",
        logoUrl: "Logo",
        cnpj: "CNPJ",
        startYear: "Ano de inicio",
        description: "Descricao",
        status: "Status",
      },
      resolveEntityId: ({ record }) => record.id,
      valueFormatters: {
        logoUrl: (value) => (value ? "Logo definida" : "Sem logo"),
      },
    },
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};

export const adminUserDetailLayout: DetailLayoutConfig<AdminUserDetailLayoutContext> = {
  editing: AUTO_EDITING,
  header: {
    title: ({ user }) => user.name?.trim() || user.email,
    leadingSlot: ({ draft, canEdit, avatarUploading, onAvatarFileSelect }) => (
      <DetailIdentityMediaField
        variant="header"
        name={draft.name || draft.email || "Usuario"}
        value={draft.avatarUrl}
        readOnly={!canEdit}
        busy={avatarUploading}
        onFileSelect={onAvatarFileSelect}
      />
    ),
    slot: ({ user }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Status</div>
            <BooleanBadge value={user.isActive} />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Perfis</div>
            <div className="font-medium text-foreground">{user.roleNames.length}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">MFA</div>
            <div className="font-medium text-foreground">{user.mfaTotpEnabled ? "Ativo" : "Inativo"}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Criado</div>
            <div className="font-medium text-foreground">{formatDateOnlyPtBR(user.createdAt)}</div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({
    draft,
    roleOptions,
    canEdit,
    onDraftChange,
    isCreate,
    onCommitField,
    onCommitDraft,
  }) => (
    <UserForm
      draft={draft}
      roleOptions={roleOptions}
      canEdit={canEdit}
      onDraftChange={onDraftChange}
      isCreate={isCreate}
      onCommitField={onCommitField}
      onCommitDraft={onCommitDraft}
    />
  ),
  side: ({
    user,
    canEdit,
    isCreate,
    canAudit,
    resettingMfa,
    onResetMfa,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
  }) => (
    <UserSide
      user={user}
      canEdit={canEdit}
      isCreate={isCreate}
      canAudit={canAudit}
      resettingMfa={resettingMfa}
      onResetMfa={onResetMfa}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
    />
  ),
  tabTemplates: [
    {
      key: "roles",
      label: "Perfis",
      badge: ({ user }) => user.roles.length,
      relations: [
        {
          key: "assigned-roles",
          label: "Perfis vinculados",
          rows: ({ user }) => user.roles,
          columns: userRoleColumns(),
          getRowId: (row) => row.id,
          emptyLabel: "Nenhum perfil vinculado.",
        },
      ],
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "user",
      entity: "User",
      model: "audit.logs",
      label: "Usuario",
      fieldLabels: {
        name: "Nome",
        email: "Email",
        phone: "Telefone",
        bio: "Bio",
        avatarUrl: "Foto",
        isActive: "Status",
        mfaTotpEnabled: "MFA",
      },
      resolveEntityId: ({ user }) => user.id,
      valueFormatters: {
        isActive: (value) => (value ? "Ativo" : "Inativo"),
        mfaTotpEnabled: (value) => (value ? "Ativo" : "Inativo"),
        avatarUrl: (value) => (value ? "Foto definida" : "Sem foto"),
      },
    },
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};

export const adminRoleDetailLayout: DetailLayoutConfig<AdminRoleDetailLayoutContext> = {
  editing: AUTO_EDITING,
  header: {
    title: ({ role }) => role.name,
    slot: ({ selectedPermissionRecords }) => (
      <div className="border-y border-border/60 bg-transparent px-0 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Permissoes</div>
            <div className="font-medium text-foreground">{selectedPermissionRecords.length}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground">Modulos</div>
            <div className="font-medium text-foreground">
              {normalizePermissionModules(selectedPermissionRecords.map((entry) => entry.key)).length}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  main: ({
    draft,
    permissionOptions,
    canEdit,
    onDraftChange,
    onCommitField,
    onCommitDraft,
  }) => (
    <RoleForm
      draft={draft}
      permissionOptions={permissionOptions}
      canEdit={canEdit}
      onDraftChange={onDraftChange}
      onCommitField={onCommitField}
      onCommitDraft={onCommitDraft}
    />
  ),
  side: ({
    role,
    draft,
    canAudit,
    detailAudit,
    auditVisibleCount,
    onAuditVisibleCountChange,
  }) => (
    <RoleSide
      role={role}
      permissionKeys={draft.permissionKeys}
      canAudit={canAudit}
      detailAudit={detailAudit}
      auditVisibleCount={auditVisibleCount}
      onAuditVisibleCountChange={onAuditVisibleCountChange}
    />
  ),
  tabTemplates: [
    {
      key: "permissions",
      label: "Permissoes",
      badge: ({ selectedPermissionRecords }) => selectedPermissionRecords.length,
      relations: [
        {
          key: "role-permissions",
          label: "Permissoes atribuidas",
          rows: ({ selectedPermissionRecords }) => selectedPermissionRecords,
          columns: rolePermissionColumns(),
          getRowId: (row) => row.id,
          emptyLabel: "Nenhuma permissao vinculada.",
        },
      ],
    },
  ],
  auditSources: {
    primaryEntity: {
      key: "role",
      entity: "Role",
      model: "audit.logs",
      label: "Perfil",
      fieldLabels: {
        name: "Perfil",
        description: "Descricao",
      },
      resolveEntityId: ({ role }) => role.id,
    },
    sort: [{ field: "createdAt", direction: "desc" }],
    pagination: { limit: 120 },
  },
};

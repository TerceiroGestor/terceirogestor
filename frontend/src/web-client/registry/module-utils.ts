"use client";

import type {
  DetailEditingConfig,
  GraphBuilderConfig,
  ModuleFeatureFlagMap,
  ModuleActionDefinition,
  ModulePermissionKey,
  ModulePermissionMap,
  PermissionRequirement,
  RecordModuleDefinition,
  ViewConfig,
} from "@/web-client/registry/types";

const ACTION_PERMISSION_FALLBACK: Partial<Record<string, ModulePermissionKey>> = {
  view: "canRead",
  create: "canCreate",
  quickCreate: "canCreate",
  edit: "canEdit",
  delete: "canDelete",
  share: "canShare",
  audit: "canAudit",
  export: "canExport",
  refresh: "canRead",
};

function matchesRequirementObject(
  requirement: Extract<PermissionRequirement, { allOf?: string[]; anyOf?: string[] }>,
  grantedPermissions: string[],
) {
  const granted = new Set(grantedPermissions);
  const matchesAllOf =
    !requirement.allOf || requirement.allOf.every((permission) => granted.has(permission));
  const matchesAnyOf =
    !requirement.anyOf || requirement.anyOf.some((permission) => granted.has(permission));

  return matchesAllOf && matchesAnyOf;
}

export function hasPermissionRequirement(
  requirement: PermissionRequirement | undefined,
  grantedPermissions: string[],
  fallback = false,
) {
  if (!requirement) return fallback;
  if (typeof requirement === "string") {
    return grantedPermissions.includes(requirement);
  }
  if (Array.isArray(requirement)) {
    return requirement.every((permission) => grantedPermissions.includes(permission));
  }
  return matchesRequirementObject(requirement, grantedPermissions);
}

export function getModulePermissionRequirement(
  permissionMap: ModulePermissionMap | undefined,
  permissionKey: ModulePermissionKey,
) {
  return permissionMap?.[permissionKey];
}

export function hasModulePermission<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  permissionKey: ModulePermissionKey,
  grantedPermissions: string[],
  fallback = false,
) {
  return hasPermissionRequirement(
    getModulePermissionRequirement(moduleDefinition.permissions, permissionKey),
    grantedPermissions,
    fallback,
  );
}

export function getModuleAction<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  actionKey: string,
): ModuleActionDefinition | undefined {
  return moduleDefinition.actions?.[actionKey];
}

export function isModuleFeatureEnabled(
  featureFlags: ModuleFeatureFlagMap | undefined,
  featureKey: string | undefined,
  fallback = true,
) {
  if (!featureKey) return fallback;
  if (!featureFlags) return fallback;
  if (!(featureKey in featureFlags)) return fallback;
  return Boolean(featureFlags[featureKey]);
}

export function isModuleViewEnabled(
  moduleDefinition: RecordModuleDefinition<any, any>,
  view: ViewConfig,
) {
  return isModuleFeatureEnabled(
    moduleDefinition.featureFlags,
    view.featureFlag ?? view.viewType,
    true,
  );
}

export function getModuleActionLabel<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  actionKey: string,
  fallback = "",
) {
  return getModuleAction(moduleDefinition, actionKey)?.label ?? fallback;
}

export function getModuleActionRequirement<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  actionKey: string,
) {
  const action = getModuleAction(moduleDefinition, actionKey);
  if (!action) return undefined;
  if (action.permission) return action.permission;

  const mappedPermissionKey =
    action.permissionKey ?? ACTION_PERMISSION_FALLBACK[actionKey];

  if (!mappedPermissionKey) return undefined;
  return moduleDefinition.permissions?.[mappedPermissionKey];
}

export function canUseModuleAction<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  actionKey: string,
  grantedPermissions: string[],
  fallback = false,
) {
  return hasPermissionRequirement(
    getModuleActionRequirement(moduleDefinition, actionKey),
    grantedPermissions,
    fallback,
  );
}

export function getModuleSearchPlaceholder<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fallback = "Pesquisar",
) {
  return (
    moduleDefinition.searchConfig.searchPlaceholder ??
    moduleDefinition.domainAdapter?.list?.searchPlaceholder ??
    fallback
  );
}

export function getModuleEntitySingular<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fallback = "Registro",
) {
  return moduleDefinition.domainAdapter?.entity.singular ?? fallback;
}

export function getModuleEntityPlural<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fallback = "Registros",
) {
  return moduleDefinition.domainAdapter?.entity.plural ?? fallback;
}

export function getModuleListTitle<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fallback = "Registros",
) {
  return getModuleEntityPlural(moduleDefinition, fallback);
}

export function getModuleCreateActionLabel<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fallback = "Novo",
) {
  return (
    getModuleAction(moduleDefinition, "create")?.label ??
    moduleDefinition.domainAdapter?.list?.createActionLabel ??
    fallback
  );
}

export function getModuleCreateTitle<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fallback = "Novo registro",
) {
  return (
    moduleDefinition.domainAdapter?.detail?.createTitle ??
    getModuleActionLabel(moduleDefinition, "create", fallback)
  );
}

export function getModuleTotalLabel<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fallback = "Total",
) {
  return moduleDefinition.domainAdapter?.list?.totalLabel ?? fallback;
}

export function getModuleDetailTitleFallback<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fallback = "Detalhe",
) {
  return (
    moduleDefinition.domainAdapter?.detail?.fallbackTitle ??
    moduleDefinition.domainAdapter?.entity.singular ??
    fallback
  );
}

export function getModuleFieldAdapter<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fieldName: string,
) {
  return moduleDefinition.domainAdapter?.fields?.[fieldName];
}

export function getModuleFieldLabel<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fieldName: string,
  fallback: string,
) {
  return getModuleFieldAdapter(moduleDefinition, fieldName)?.label ?? fallback;
}

export function getModuleFieldEmptyValueLabel<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  fieldName: string,
  fallback = "—",
) {
  return (
    getModuleFieldAdapter(moduleDefinition, fieldName)?.emptyValueLabel ??
    fallback
  );
}

export function getModuleDetailShellText<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
) {
  return moduleDefinition.domainAdapter?.detail?.shellLabels;
}

export function getModuleDetailEditingConfig<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
): DetailEditingConfig | undefined {
  return moduleDefinition.detailLayout?.editing;
}

export function getModuleGraphBuilderConfig<
  TState extends Record<string, unknown>,
  TContext extends Record<string, unknown>,
>(
  moduleDefinition: RecordModuleDefinition<any, any>,
  viewId = "graph",
): GraphBuilderConfig | undefined {
  const graphView = moduleDefinition.views.find(
    (view) => view.id === viewId && view.viewType === "graph",
  );

  return graphView?.viewType === "graph" ? graphView.params?.builder : undefined;
}

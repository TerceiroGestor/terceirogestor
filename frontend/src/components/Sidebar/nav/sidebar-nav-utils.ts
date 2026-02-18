import { withTenantPath } from "@/lib/tenant-path";
import type { ModuleNavItem } from "@/modules/types";

export function canAccessNavItem(
  permissions: string[],
  item: { permissions?: string[]; permissionsAny?: string[] },
) {
  if (item.permissionsAny && item.permissionsAny.length) {
    return item.permissionsAny.some((permission) => permissions.includes(permission));
  }
  if (!item.permissions || item.permissions.length === 0) return true;
  return item.permissions.every((permission) => permissions.includes(permission));
}

export function isActiveHref(options: {
  pathname: string;
  tenantSlug: string | null;
  itemHref: string;
  exact?: boolean;
}) {
  const resolvedHref = withTenantPath(options.itemHref, options.tenantSlug);
  if (options.exact) return options.pathname === resolvedHref;
  return (
    options.pathname === resolvedHref ||
    options.pathname.startsWith(`${resolvedHref}/`)
  );
}

export function isActiveNavItem(options: {
  pathname: string;
  tenantSlug: string | null;
  item: ModuleNavItem;
  visibleChildren?: ModuleNavItem[];
}) {
  if (options.item.disabled) return false;
  if (
    isActiveHref({
      pathname: options.pathname,
      tenantSlug: options.tenantSlug,
      itemHref: options.item.href,
      exact: options.item.exact,
    })
  ) {
    return true;
  }
  return (
    options.visibleChildren?.some((child) =>
      child.disabled
        ? false
        : isActiveHref({
            pathname: options.pathname,
            tenantSlug: options.tenantSlug,
            itemHref: child.href,
            exact: child.exact,
          }),
    ) ?? false
  );
}

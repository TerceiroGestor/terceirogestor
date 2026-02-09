const TENANT_STORAGE_KEY = "terceirogestor:tenantSlug";

export function getTenantSlugFromPath(pathname?: string | null) {
  if (!pathname) return null;
  const match = pathname.match(/^\/t\/([^/]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

export function readStoredTenantSlug() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TENANT_STORAGE_KEY);
}

export function storeTenantSlug(slug: string) {
  if (typeof window === "undefined") return;
  if (!slug) return;
  window.sessionStorage.setItem(TENANT_STORAGE_KEY, slug);
}

export function getTenantSlug() {
  if (typeof window === "undefined") return null;
  return (
    getTenantSlugFromPath(window.location.pathname) || readStoredTenantSlug()
  );
}

export function withTenantPath(path: string, slug?: string | null) {
  if (!slug) return path;
  if (path.startsWith("/t/")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/t/${slug}`;
  }
  return `/t/${slug}${normalized}`;
}

export function resolveTenantPath(path: string) {
  return withTenantPath(path, getTenantSlug());
}

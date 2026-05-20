import { slugify } from '../../registration.utils';

const RESERVED_TENANT_SLUGS = new Set([
  '',
  '_next',
  'api',
  'auth',
  'dashboard',
  'people',
  'settings',
  'admin',
  'login',
  'register',
  't',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

export const normalizeTenantSlug = (slug: string) => {
  const value = slugify(slug);
  if (RESERVED_TENANT_SLUGS.has(value)) {
    return `tenant-${value || 'app'}`;
  }
  return value;
};
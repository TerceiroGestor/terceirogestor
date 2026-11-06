import { join } from 'path';

// Mirrors the destination folders in files.controller.ts (kept separate
// from the upload side on purpose: this list only drives how downloads are
// resolved and signed, not how files get written).
export const UPLOAD_ROOT = join(process.cwd(), 'uploads');

export const UPLOAD_CATEGORY_DIRS: Record<string, string> = {
  avatars: join(UPLOAD_ROOT, 'avatars'),
  health: join(UPLOAD_ROOT, 'health'),
  tenants: join(UPLOAD_ROOT, 'tenants'),
  actions: join(UPLOAD_ROOT, 'actions'),
  people: join(UPLOAD_ROOT, 'people'),
  pantry: join(UPLOAD_ROOT, 'pantry'),
  deposit: join(UPLOAD_ROOT, 'deposit'),
  programs: join(UPLOAD_ROOT, 'programs'),
  projects: join(UPLOAD_ROOT, 'projects'),
  'action-attachments': join(UPLOAD_ROOT, 'action-attachments'),
  tasks: join(UPLOAD_ROOT, 'tasks'),
};

// Tenant logos are shown on the public login/branding page before the user
// is authenticated (GET /tenants/slug/:slug has no guard), so this category
// stays servable without a signed URL. Every other category is sensitive
// or at least tenant-private and requires one.
export const PUBLIC_UPLOAD_CATEGORIES = new Set(['tenants']);

export const SAFE_UPLOAD_SEGMENT = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9]+)?$/;

export const UPLOAD_PATH_PATTERN = /^\/uploads\/([^/?]+)\/([^/?]+)$/;

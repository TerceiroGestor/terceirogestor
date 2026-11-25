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
  'people-groups': join(UPLOAD_ROOT, 'people-groups'),
  'referral-attachments': join(UPLOAD_ROOT, 'referral-attachments'),
};

// Tenant logos are shown on the public login/branding page before the user
// is authenticated (GET /tenants/slug/:slug has no guard), so this category
// stays servable without a signed URL. Every other category is sensitive
// or at least tenant-private and requires one.
export const PUBLIC_UPLOAD_CATEGORIES = new Set(['tenants']);

// Downloads from these categories get a PersonSensitiveAccessLog row
// (item 2 of docs/auditoria-riscos.md) - the signed URL carries the
// personId the file belongs to precisely so the download endpoint can
// log it without a DB lookup.
export const SENSITIVE_UPLOAD_CATEGORIES = new Set(['health']);

export const SAFE_UPLOAD_SEGMENT = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9]+)?$/;

// /uploads/<category>/<tenantId>/<filename> - tenantId keeps each
// tenant's files physically separate on disk (and, later, under a
// distinct R2 key prefix), instead of every tenant sharing one flat
// per-category folder distinguished only by a random filename.
export const UPLOAD_PATH_PATTERN =
  /^\/uploads\/([^/?]+)\/([^/?]+)\/([^/?]+)$/;

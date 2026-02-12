export function parseDateInput(
  value?: string | null,
  options?: { endOfDay?: boolean },
) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.includes('T')) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const suffix = options?.endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
  const parsed = new Date(`${trimmed}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}


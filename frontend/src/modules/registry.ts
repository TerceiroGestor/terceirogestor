import type { ModuleManifest, NavGroup } from "@/modules/types";
import { coreManifest } from "@/modules/core/manifest";
import { peopleManifest } from "@/modules/people/manifest";
import { pantryManifest } from "@/modules/pantry/manifest";

export const moduleManifests: ModuleManifest[] = [
  coreManifest,
  peopleManifest,
  pantryManifest,
];

export function buildNavGroupsFromManifests(manifests: ModuleManifest[]): NavGroup[] {
  const map = new Map<string, NavGroup>();

  for (const manifest of manifests) {
    const label = manifest.groupLabel;
    const group = map.get(label) ?? { label, items: [] };
    group.items.push(...manifest.navItems);
    map.set(label, group);
  }

  return Array.from(map.values());
}

export const navGroups: NavGroup[] = buildNavGroupsFromManifests(moduleManifests);


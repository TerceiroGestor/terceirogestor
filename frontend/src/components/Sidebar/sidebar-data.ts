import { buildNavGroupsFromManifests, moduleManifests } from "@/modules/registry";

export const navGroups = buildNavGroupsFromManifests(moduleManifests);
export type { NavGroup, ModuleNavItem as NavItem } from "@/modules/types";

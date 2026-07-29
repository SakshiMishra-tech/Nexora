export const CAMPUS_MODULES = [
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Buy and sell campus items",
    path: "/marketplace",
  },
  {
    id: "lost-found",
    label: "Lost & Found",
    description: "Report and find lost items",
    path: "/lost-found",
  },
  {
    id: "roommates",
    label: "Roommates",
    description: "Find compatible roommates",
    path: "/roommates",
  },
  {
    id: "campus-connect",
    label: "Campus Connect",
    description: "Connect with students",
    path: "/dating",
  },
  {
    id: "notes",
    label: "Notes",
    description: "Share and access study notes",
    path: "/notes",
  },
  {
    id: "projects",
    label: "Projects",
    description: "Build projects with classmates",
    path: "/projects",
  },
  {
    id: "rides",
    label: "Rides",
    description: "Campus ride sharing and cab pooling",
    path: "/rides",
  },
  {
    id: "tuition",
    label: "Tuition",
    description: "Peer learning — seniors teach juniors",
    path: "/tuition",
  },
  {
    id: "events",
    label: "Events",
    description: "Campus events, join and find partners",
    path: "/events",
  },
] as const;

export type CampusModuleId = (typeof CAMPUS_MODULES)[number]["id"];

export const ALL_CAMPUS_MODULE_IDS = CAMPUS_MODULES.map((module) => module.id);

export function getModuleByPath(path: string) {
  return CAMPUS_MODULES.find((module) => module.path === path);
}

export function hasEnabledModule(
  enabledModules: readonly string[] | null | undefined,
  moduleId: CampusModuleId,
) {
  return Boolean(enabledModules?.includes(moduleId));
}

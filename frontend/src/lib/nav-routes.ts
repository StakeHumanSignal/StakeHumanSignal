export interface NavRoute {
  label: string;
  href: string;
}

export const NAV_ROUTES: NavRoute[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Submission", href: "/submit" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Agent Feed", href: "/agent-feed" },
  { label: "Town Square", href: "/town-square" },
  { label: "Validate", href: "/validate" },
];

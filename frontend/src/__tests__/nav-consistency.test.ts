import { describe, it, expect } from "vitest";
import { NAV_ROUTES } from "../lib/nav-routes";

describe("NAV_ROUTES consistency", () => {
  it("every route has a non-empty label", () => {
    for (const route of NAV_ROUTES) {
      expect(route.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("every route has a valid href starting with /", () => {
    for (const route of NAV_ROUTES) {
      expect(route.href).toMatch(/^\//);
    }
  });

  it("has no duplicate hrefs", () => {
    const hrefs = NAV_ROUTES.map((r) => r.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("has no duplicate labels", () => {
    const labels = NAV_ROUTES.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("covers all expected pages", () => {
    const hrefs = NAV_ROUTES.map((r) => r.href);
    expect(hrefs).toContain("/marketplace");
    expect(hrefs).toContain("/submit");
    expect(hrefs).toContain("/leaderboard");
    expect(hrefs).toContain("/agent-feed");
    expect(hrefs).toContain("/town-square");
    expect(hrefs).toContain("/validate");
  });
});

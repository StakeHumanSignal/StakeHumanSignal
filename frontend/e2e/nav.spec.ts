import { test, expect } from "@playwright/test";

const PAGES = [
  { href: "/", name: "Landing" },
  { href: "/marketplace", name: "Marketplace" },
  { href: "/submit", name: "Submission" },
  { href: "/leaderboard", name: "Leaderboard" },
  { href: "/agent-feed", name: "Agent Feed" },
  { href: "/town-square", name: "Town Square" },
  { href: "/validate", name: "Validate" },
];

for (const page of PAGES) {
  test(`${page.name} (${page.href}) loads without errors`, async ({ page: p }) => {
    const errors: string[] = [];
    p.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const response = await p.goto(page.href);
    expect(response?.status()).not.toBe(404);

    // TopBar should be visible (the fixed nav element)
    const topBar = p.locator("nav.fixed");
    await expect(topBar).toBeVisible();

    // SideNav should be present in DOM (hidden on mobile, visible on md+)
    const sideNav = p.locator("aside.fixed");
    await expect(sideNav).toBeAttached();

    // No console errors
    expect(errors).toEqual([]);
  });
}

test("SideNav active state matches current route", async ({ page }) => {
  await page.goto("/marketplace");

  // The active nav item should have the primary text color class
  const activeLink = page.locator("aside.fixed nav a.text-primary");
  await expect(activeLink).toBeVisible();
  const href = await activeLink.getAttribute("href");
  expect(href).toBe("/marketplace");
});

import { test, expect } from "@playwright/test";

test.describe("Blog List Page - Logged Out", () => {
  test("should display blog page title and header", async ({ page }) => {
    await page.goto("/blog");

    // Check page title
    await expect(page).toHaveTitle(/Blog - Talor Anderson/);

    // Check main heading is visible
    await expect(page.locator("h1")).toContainText("Talor Anderson");
    await expect(page.locator("h1")).toContainText("Blog");
  });

  test("should display blog description", async ({ page }) => {
    await page.goto("/blog");

    // Check description is present
    await expect(
      page.getByText(
        "Thoughts on AI, fullstack development, and engineering culture."
      )
    ).toBeVisible();
  });

  test("should not show admin navigation when logged out", async ({ page }) => {
    await page.goto("/blog");

    // Verify admin links are NOT visible
    await expect(page.getByRole("link", { name: "Drafts" })).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "New Post" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sign Out" })
    ).not.toBeVisible();

    // Verify welcome message is NOT visible
    await expect(page.getByText(/Welcome,/)).not.toBeVisible();
  });

  test("should display published blog posts or no posts message", async ({
    page,
  }) => {
    await page.goto("/blog");

    // Check if there are blog posts or "no posts" message
    const noPosts = page.getByText("No published posts yet.");
    const blogArticles = page.locator("article");

    // Either we have posts or we have the "no posts" message
    const hasNoPosts = await noPosts.isVisible().catch(() => false);
    const hasPosts = await blogArticles
      .count()
      .then((count) => count > 0)
      .catch(() => false);

    expect(hasNoPosts || hasPosts).toBeTruthy();
  });

  test("should have clickable blog post links if posts exist", async ({
    page,
  }) => {
    await page.goto("/blog");

    const blogArticles = page.locator("article");
    const articleCount = await blogArticles.count();

    if (articleCount > 0) {
      // Check that each article has a title link
      for (let i = 0; i < articleCount; i++) {
        const article = blogArticles.nth(i);
        const titleLink = article.locator("h2 a");
        await expect(titleLink).toBeVisible();

        // Verify link has href starting with /blog/
        const href = await titleLink.getAttribute("href");
        expect(href).toMatch(/^\/blog\/.+/);
      }
    }
  });

  test("should display published dates for blog posts if posts exist", async ({
    page,
  }) => {
    await page.goto("/blog");

    const blogArticles = page.locator("article");
    const articleCount = await blogArticles.count();

    if (articleCount > 0) {
      // Check that each article has a time element with a date
      for (let i = 0; i < articleCount; i++) {
        const article = blogArticles.nth(i);
        const timeElement = article.locator("time");
        await expect(timeElement).toBeVisible();

        // Verify time element has text content (the date)
        const dateText = await timeElement.textContent();
        expect(dateText).toBeTruthy();
        expect(dateText?.trim()).not.toBe("");
      }
    }
  });
});

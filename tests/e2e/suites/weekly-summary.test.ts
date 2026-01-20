import { Page } from "puppeteer";
import { createPage, closeBrowser, delay } from "../setup/browser";
import {
  generateUniqueUsername,
  TEST_PASSWORD,
} from "../setup/test-data";
import {
  createTestUser,
  cleanupTestUser,
  seedWeightEntries,
} from "../setup/database";
import { loginUser } from "../helpers/auth.helpers";
import { setPendingWeight, clearPendingWeight } from "../setup/mock-ocr";
import { SELECTORS } from "../helpers/selectors";
import { navigateTo } from "../helpers/navigation.helpers";

describe("Weekly Summary", () => {
  let page: Page;
  const createdUsers: string[] = [];

  beforeAll(async () => {
    page = await createPage();
  });

  afterAll(async () => {
    for (const username of createdUsers) {
      cleanupTestUser(username);
    }
    await closeBrowser();
  });

  afterEach(async () => {
    await clearPendingWeight(page);
  });

  describe("Week 1 Complete Trigger", () => {
    it("should show weekly summary modal after 7 days since first entry", async () => {
      const username = generateUniqueUsername("weekly7");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD, {
        displayName: "WeeklyBae",
      });

      // Seed entries starting 8 days ago - when user logs today, 7+ days have passed
      // Use INCREASING weights to avoid triggering celebration modal (which takes priority)
      await seedWeightEntries(userId, [
        { weight: 163.0, unit: "lb", daysAgo: 8 }, // First entry (start of week 1)
        { weight: 163.5, unit: "lb", daysAgo: 6 },
        { weight: 164.0, unit: "lb", daysAgo: 4 },
        { weight: 164.5, unit: "lb", daysAgo: 2 },
      ]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log weight today (same or higher) - this completes week 1 without triggering celebration
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 165.0, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        // Check for weekly summary modal
        const weeklySummaryModal = await page.$(SELECTORS.modals.weeklySummary);
        expect(weeklySummaryModal).not.toBeNull();

        // Check that it shows "Week 1 Complete!"
        const pageContent = await page.content();
        expect(
          pageContent.includes("Week 1 Complete") ||
            pageContent.includes("Week 1")
        ).toBe(true);

        // Should show entries count
        expect(
          pageContent.includes("Entries This Week") ||
            pageContent.includes("Entry")
        ).toBe(true);
      }
    });

    it("should include personalized quote with display name", async () => {
      const username = generateUniqueUsername("weeklyname");
      const displayName = "QuoteBae";
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD, {
        displayName,
      });

      // Seed entries starting 8 days ago - use increasing weights to avoid celebration
      await seedWeightEntries(userId, [
        { weight: 168.0, unit: "lb", daysAgo: 8 },
        { weight: 169.0, unit: "lb", daysAgo: 5 },
        { weight: 170.0, unit: "lb", daysAgo: 2 },
      ]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log today with same/higher weight to avoid celebration
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 170.5, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        // Check for display name in the quote
        const pageContent = await page.content();
        expect(pageContent.includes(displayName)).toBe(true);
      }
    });

    it("should show start and end weights when multiple entries exist", async () => {
      const username = generateUniqueUsername("weeklyweights");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD);

      // Seed entries with known weights - use increasing weights to avoid celebration
      const startWeight = 173.0;
      await seedWeightEntries(userId, [
        { weight: startWeight, unit: "lb", daysAgo: 8 },
        { weight: 173.5, unit: "lb", daysAgo: 6 },
        { weight: 174.0, unit: "lb", daysAgo: 4 },
        { weight: 174.5, unit: "lb", daysAgo: 2 },
      ]);

      await loginUser(page, username, TEST_PASSWORD);

      const endWeight = 175.0;
      await navigateTo(page, "/upload");
      await setPendingWeight(page, endWeight, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // Should show start and end weights (comparing first and last entries in the week)
        expect(
          pageContent.includes("Start") && pageContent.includes("End")
        ).toBe(true);
      }
    });
  });

  describe("No Weekly Summary Before 7 Days", () => {
    it("should NOT show weekly summary before 7 days have passed", async () => {
      const username = generateUniqueUsername("weekly6");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD);

      // Seed entries starting only 5 days ago - not enough for week 1
      // Use increasing weights to avoid celebration
      await seedWeightEntries(userId, [
        { weight: 163.5, unit: "lb", daysAgo: 5 },
        { weight: 164.0, unit: "lb", daysAgo: 3 },
        { weight: 164.5, unit: "lb", daysAgo: 1 },
      ]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log today with higher weight
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 165.0, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        // Weekly summary modal should NOT appear (only 6 days since first entry)
        const weeklySummaryModal = await page.$(SELECTORS.modals.weeklySummary);
        expect(weeklySummaryModal).toBeNull();
      }
    });
  });

  describe("Week 2 Complete", () => {
    it("should show Week 2 Complete after 14 days since first entry", async () => {
      const username = generateUniqueUsername("weekly14");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD, {
        displayName: "TwoWeekBae",
      });

      // Seed entries starting 15 days ago - use increasing weights to avoid celebration
      await seedWeightEntries(userId, [
        { weight: 167.0, unit: "lb", daysAgo: 15 }, // Week 1 start
        { weight: 167.5, unit: "lb", daysAgo: 12 },
        { weight: 168.0, unit: "lb", daysAgo: 9 },  // Week 2 start
        { weight: 168.5, unit: "lb", daysAgo: 6 },
        { weight: 169.0, unit: "lb", daysAgo: 3 },
      ]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log today with same/higher weight - this completes week 2
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 169.5, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // Should show Week 2
        expect(
          pageContent.includes("Week 2 Complete") ||
            pageContent.includes("Week 2")
        ).toBe(true);
      }
    });
  });

  describe("Weekly Summary Close", () => {
    it("should close modal when clicking Keep It Up button", async () => {
      const username = generateUniqueUsername("weeklyclose");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD);

      // Seed entries starting 8 days ago - use increasing weights to avoid celebration
      await seedWeightEntries(userId, [
        { weight: 163.5, unit: "lb", daysAgo: 8 },
        { weight: 164.0, unit: "lb", daysAgo: 5 },
        { weight: 164.5, unit: "lb", daysAgo: 2 },
      ]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log today with higher weight to complete week 1 without celebration
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 165.0, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        // Modal should be visible
        let weeklySummaryModal = await page.$(SELECTORS.modals.weeklySummary);
        expect(weeklySummaryModal).not.toBeNull();

        // Click close button
        const closeButton = await page.$(SELECTORS.modals.weeklySummaryClose);
        if (closeButton) {
          await closeButton.click();
          await delay(500);

          // Modal should be closed
          weeklySummaryModal = await page.$(SELECTORS.modals.weeklySummary);
          expect(weeklySummaryModal).toBeNull();
        }
      }
    });
  });

  describe("Single Entry Week", () => {
    it("should show summary even with just one entry in the week", async () => {
      const username = generateUniqueUsername("weeklysingle");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD, {
        displayName: "SingleBae",
      });

      // Seed just one entry 8 days ago
      await seedWeightEntries(userId, [
        { weight: 169.0, unit: "lb", daysAgo: 8 },
      ]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log today with same/higher weight - this completes week 1 with entries in it
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 170.0, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        // Should still show weekly summary
        const weeklySummaryModal = await page.$(SELECTORS.modals.weeklySummary);
        expect(weeklySummaryModal).not.toBeNull();

        const pageContent = await page.content();
        // Should include display name
        expect(pageContent.includes("SingleBae")).toBe(true);
      }
    });
  });
});

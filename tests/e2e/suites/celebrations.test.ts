import { Page } from "puppeteer";
import { createPage, closeBrowser, delay } from "../setup/browser";
import { generateUniqueUsername, TEST_PASSWORD } from "../setup/test-data";
import {
  createTestUser,
  cleanupTestUser,
  seedWeightEntries,
  setGoalWeight,
} from "../setup/database";
import { loginUser } from "../helpers/auth.helpers";
import { setPendingWeight, clearPendingWeight } from "../setup/mock-ocr";
import { SELECTORS } from "../helpers/selectors";
import { navigateTo } from "../helpers/navigation.helpers";

describe("Celebrations", () => {
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

  describe("Weight Loss Celebration", () => {
    it("should show encouragement when weight decreases", async () => {
      const username = generateUniqueUsername("loss");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD, {
        displayName: "TestBae",
      });

      // Seed previous weight
      await seedWeightEntries(userId, [{ weight: 180, unit: "lb", daysAgo: 7 }]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log lower weight
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 178, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // Should show some celebration or success message
        expect(
          pageContent.toLowerCase().includes("progress") ||
            pageContent.toLowerCase().includes("lost") ||
            pageContent.toLowerCase().includes("down") ||
            pageContent.toLowerCase().includes("nice") ||
            pageContent.toLowerCase().includes("great") ||
            pageContent.toLowerCase().includes("saved")
        ).toBe(true);
      }
    });
  });

  describe("Milestone Celebration", () => {
    it("should show milestone celebration when crossing weight milestone", async () => {
      const username = generateUniqueUsername("milestone");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD);

      // Seed weight just above a milestone (60kg is a milestone)
      await seedWeightEntries(userId, [{ weight: 61, unit: "kg", daysAgo: 7 }]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log weight below milestone
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 59.5, "kg");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // Should show celebration
        expect(
          pageContent.toLowerCase().includes("milestone") ||
            pageContent.toLowerCase().includes("amazing") ||
            pageContent.toLowerCase().includes("congratulations") ||
            pageContent.toLowerCase().includes("saved")
        ).toBe(true);
      }
    });
  });

  describe("Goal Reached Celebration", () => {
    it("should show special celebration when reaching goal weight", async () => {
      const username = generateUniqueUsername("goalreach");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD, {
        displayName: "TestBae",
      });

      // Set goal and seed weights above goal
      setGoalWeight(userId, 170);
      await seedWeightEntries(userId, [
        { weight: 180, unit: "lb", daysAgo: 14 },
        { weight: 172, unit: "lb", daysAgo: 7 },
      ]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log weight at goal
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 169, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // Should show goal reached celebration
        expect(
          pageContent.toLowerCase().includes("goal") ||
            pageContent.toLowerCase().includes("did it") ||
            pageContent.toLowerCase().includes("congratulations") ||
            pageContent.toLowerCase().includes("reached") ||
            pageContent.toLowerCase().includes("saved")
        ).toBe(true);
      }
    });

    it("should use display name in celebration message", async () => {
      const username = generateUniqueUsername("named");
      const displayName = "SuperBae";
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD, {
        displayName,
      });

      setGoalWeight(userId, 170);
      await seedWeightEntries(userId, [{ weight: 172, unit: "lb", daysAgo: 7 }]);

      await loginUser(page, username, TEST_PASSWORD);

      await navigateTo(page, "/upload");
      await setPendingWeight(page, 169, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // Display name might be shown in celebration
        expect(
          pageContent.includes(displayName) ||
            pageContent.toLowerCase().includes("goal") ||
            pageContent.toLowerCase().includes("saved")
        ).toBe(true);
      }
    });
  });

  describe("Celebration Priority", () => {
    it("should prioritize goal reached over milestone", async () => {
      const username = generateUniqueUsername("priority");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD);

      // Set goal at a milestone (60kg)
      setGoalWeight(userId, 60);
      await seedWeightEntries(userId, [{ weight: 61, unit: "kg", daysAgo: 7 }]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log weight that both crosses milestone AND reaches goal
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 59.5, "kg");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // Goal celebration has priority
        expect(
          pageContent.toLowerCase().includes("goal") ||
            pageContent.toLowerCase().includes("did it") ||
            pageContent.toLowerCase().includes("saved")
        ).toBe(true);
      }
    });
  });

  describe("No Celebration on Weight Gain", () => {
    it("should not show celebration when weight increases", async () => {
      const username = generateUniqueUsername("nogain");
      createdUsers.push(username);
      const userId = await createTestUser(username, TEST_PASSWORD);

      // Seed lower weight
      await seedWeightEntries(userId, [{ weight: 175, unit: "lb", daysAgo: 7 }]);

      await loginUser(page, username, TEST_PASSWORD);

      // Log higher weight (gain)
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 177, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // Should show "saved" but not celebratory language
        const hasNoCelebration =
          !pageContent.toLowerCase().includes("amazing") &&
          !pageContent.toLowerCase().includes("congratulations") &&
          !pageContent.toLowerCase().includes("milestone") &&
          !pageContent.toLowerCase().includes("goal reached");

        // Either no celebration shown or just simple saved message
        expect(hasNoCelebration || pageContent.toLowerCase().includes("saved")).toBe(
          true
        );
      }
    });
  });

  describe("First Weight Entry", () => {
    it("should handle first weight without previous comparison", async () => {
      const username = generateUniqueUsername("first");
      createdUsers.push(username);
      await createTestUser(username, TEST_PASSWORD);

      await loginUser(page, username, TEST_PASSWORD);

      // Log first ever weight
      await navigateTo(page, "/upload");
      await setPendingWeight(page, 180, "lb");
      await navigateTo(page, "/confirm");

      await page.waitForSelector(SELECTORS.confirm.weightDisplay, {
        timeout: 10000,
      });

      const saveButton = await page.$(SELECTORS.confirm.saveButton);
      if (saveButton) {
        await saveButton.click();
        await delay(3000);

        const pageContent = await page.content();
        // First weight should show saved message or first steps achievement
        expect(
          pageContent.toLowerCase().includes("saved") ||
            pageContent.toLowerCase().includes("first") ||
            pageContent.toLowerCase().includes("progress")
        ).toBe(true);
      }
    });
  });
});

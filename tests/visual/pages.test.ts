import { toMatchImageSnapshot } from "jest-image-snapshot";
import {
  setupBrowser,
  teardownBrowser,
  takeScreenshot,
  login,
  BASE_URL,
  page,
} from "./setup";

expect.extend({ toMatchImageSnapshot });

describe("Scale-Bae Visual Tests", () => {
  beforeAll(async () => {
    await setupBrowser();
  });

  afterAll(async () => {
    await teardownBrowser();
  });

  describe("Login Page", () => {
    it("renders login page correctly", async () => {
      await page!.goto(`${BASE_URL}/login`);
      await page!.waitForSelector('input[id="username"]');

      const screenshot = await page!.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: "login-page-desktop",
        failureThreshold: 0.01,
        failureThresholdType: "percent",
      });
    });

    it("renders login page on mobile", async () => {
      await page!.setViewport({ width: 375, height: 812 });
      await page!.goto(`${BASE_URL}/login`);
      await page!.waitForSelector('input[id="username"]');

      const screenshot = await page!.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: "login-page-mobile",
        failureThreshold: 0.01,
        failureThresholdType: "percent",
      });

      // Reset viewport
      await page!.setViewport({ width: 1280, height: 720 });
    });
  });

  describe("Protected Pages (requires login)", () => {
    beforeAll(async () => {
      // Register a test user first
      await page!.goto(`${BASE_URL}/login`);
      await page!.waitForSelector('input[id="username"]');

      // Click "Create one" to switch to register mode
      await page!.click('button:has-text("Create one")');

      await page!.type('input[id="username"]', "testuser");
      await page!.type('input[id="password"]', "testpass123");
      await page!.click('button[type="submit"]');

      await page!.waitForNavigation({ waitUntil: "networkidle0" });
    });

    it("renders upload page correctly", async () => {
      await page!.goto(`${BASE_URL}/upload`);
      await page!.waitForSelector('[data-testid="dropzone"]');

      const screenshot = await page!.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: "upload-page-desktop",
        failureThreshold: 0.01,
        failureThresholdType: "percent",
      });
    });

    it("renders progress page correctly", async () => {
      await page!.goto(`${BASE_URL}/progress`);
      await page!.waitForSelector("h1");

      const screenshot = await page!.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: "progress-page-desktop",
        failureThreshold: 0.01,
        failureThresholdType: "percent",
      });
    });
  });
});

import { Page } from "puppeteer";
import {
  createPage,
  closeBrowser,
  BASE_URL,
  createIncognitoContext,
  delay,
} from "../setup/browser";
import { generateUniqueUsername, TEST_PASSWORD } from "../setup/test-data";
import { createTestUser, cleanupTestUser } from "../setup/database";
import {
  registerUser,
  loginUser,
  isLoggedIn,
  getCurrentPath,
  getAuthError,
} from "../helpers/auth.helpers";
import { SELECTORS } from "../helpers/selectors";
import { navigateTo, waitForPath } from "../helpers/navigation.helpers";

describe("Authentication", () => {
  let page: Page;
  const createdUsers: string[] = [];

  beforeAll(async () => {
    page = await createPage();
  });

  afterAll(async () => {
    // Cleanup all created users
    for (const username of createdUsers) {
      cleanupTestUser(username);
    }
    await closeBrowser();
  });

  describe("Registration", () => {
    it("should register a new user successfully", async () => {
      const username = generateUniqueUsername("reg");
      createdUsers.push(username);

      await registerUser(page, username, TEST_PASSWORD);

      expect(await isLoggedIn(page)).toBe(true);
      expect(await getCurrentPath(page)).toBe("/upload");
    });

    it("should show error for duplicate username", async () => {
      const username = generateUniqueUsername("dup");
      createdUsers.push(username);

      // Create user first via database
      await createTestUser(username, TEST_PASSWORD);

      // Try to register with same username
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
      await page.waitForSelector(SELECTORS.auth.usernameInput);

      // Switch to register mode
      const registerToggle = await page.$(SELECTORS.auth.registerToggle);
      if (registerToggle) {
        await registerToggle.click();
        await delay(300);
      }

      await page.type(SELECTORS.auth.usernameInput, username);
      await page.type(SELECTORS.auth.passwordInput, TEST_PASSWORD);
      await page.click(SELECTORS.auth.submitButton);

      // Wait for error message
      await delay(1000);
      const error = await getAuthError(page);
      expect(error).toBeTruthy();
      expect(error?.toLowerCase()).toContain("taken");
    });

    it("should enforce minimum username length (3 chars)", async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
      await page.waitForSelector(SELECTORS.auth.usernameInput);

      const registerToggle = await page.$(SELECTORS.auth.registerToggle);
      if (registerToggle) {
        await registerToggle.click();
        await delay(300);
      }

      await page.type(SELECTORS.auth.usernameInput, "ab");
      await page.type(SELECTORS.auth.passwordInput, TEST_PASSWORD);
      await page.click(SELECTORS.auth.submitButton);

      // Should show validation error or stay on page
      await delay(500);
      const currentPath = await getCurrentPath(page);
      expect(currentPath).toBe("/login");
    });

    it("should enforce minimum password length (6 chars)", async () => {
      const username = generateUniqueUsername("pwdtest");

      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
      await page.waitForSelector(SELECTORS.auth.usernameInput);

      const registerToggle = await page.$(SELECTORS.auth.registerToggle);
      if (registerToggle) {
        await registerToggle.click();
        await delay(300);
      }

      await page.type(SELECTORS.auth.usernameInput, username);
      await page.type(SELECTORS.auth.passwordInput, "12345");
      await page.click(SELECTORS.auth.submitButton);

      // Should show validation error or stay on page
      await delay(500);
      const currentPath = await getCurrentPath(page);
      expect(currentPath).toBe("/login");
    });
  });

  describe("Login", () => {
    let existingUsername: string;

    beforeAll(async () => {
      existingUsername = generateUniqueUsername("existing");
      createdUsers.push(existingUsername);
      await createTestUser(existingUsername, TEST_PASSWORD);
    });

    it("should login existing user successfully", async () => {
      await loginUser(page, existingUsername, TEST_PASSWORD);

      expect(await isLoggedIn(page)).toBe(true);
      expect(await getCurrentPath(page)).toBe("/upload");
    });

    it("should show error for invalid credentials (wrong username)", async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
      await page.waitForSelector(SELECTORS.auth.usernameInput);

      await page.type(SELECTORS.auth.usernameInput, "nonexistent_user_xyz");
      await page.type(SELECTORS.auth.passwordInput, TEST_PASSWORD);
      await page.click(SELECTORS.auth.submitButton);

      await delay(1000);
      const error = await getAuthError(page);
      expect(error).toBeTruthy();
      expect(error?.toLowerCase()).toMatch(/invalid|incorrect|not found/);
    });

    it("should show error for wrong password", async () => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
      await page.waitForSelector(SELECTORS.auth.usernameInput);

      await page.type(SELECTORS.auth.usernameInput, existingUsername);
      await page.type(SELECTORS.auth.passwordInput, "wrongpassword123");
      await page.click(SELECTORS.auth.submitButton);

      await delay(1000);
      const error = await getAuthError(page);
      expect(error).toBeTruthy();
      expect(error?.toLowerCase()).toMatch(/invalid|incorrect|wrong/);
    });
  });

  describe("Session Persistence", () => {
    let sessionUsername: string;

    beforeAll(async () => {
      sessionUsername = generateUniqueUsername("session");
      createdUsers.push(sessionUsername);
      await createTestUser(sessionUsername, TEST_PASSWORD);
    });

    it("should maintain session across page reloads", async () => {
      await loginUser(page, sessionUsername, TEST_PASSWORD);
      expect(await isLoggedIn(page)).toBe(true);

      // Reload the page
      await page.reload({ waitUntil: "networkidle0" });

      // Should still be logged in
      expect(await isLoggedIn(page)).toBe(true);
    });

    it("should redirect protected routes to login when not authenticated", async () => {
      const { context, page: freshPage } = await createIncognitoContext();

      try {
        await freshPage.goto(`${BASE_URL}/upload`, { waitUntil: "networkidle0" });

        // Should be redirected to login
        await waitForPath(freshPage, "/login", 5000);
        expect(await getCurrentPath(freshPage)).toBe("/login");
      } finally {
        await context.close();
      }
    });

    it("should redirect /progress to login when not authenticated", async () => {
      const { context, page: freshPage } = await createIncognitoContext();

      try {
        await freshPage.goto(`${BASE_URL}/progress`, { waitUntil: "networkidle0" });

        await waitForPath(freshPage, "/login", 5000);
        expect(await getCurrentPath(freshPage)).toBe("/login");
      } finally {
        await context.close();
      }
    });

    it("should redirect /confirm to login when not authenticated", async () => {
      const { context, page: freshPage } = await createIncognitoContext();

      try {
        await freshPage.goto(`${BASE_URL}/confirm`, { waitUntil: "networkidle0" });

        await waitForPath(freshPage, "/login", 5000);
        expect(await getCurrentPath(freshPage)).toBe("/login");
      } finally {
        await context.close();
      }
    });
  });

  describe("Logout", () => {
    let logoutUsername: string;

    beforeAll(async () => {
      logoutUsername = generateUniqueUsername("logout");
      createdUsers.push(logoutUsername);
      await createTestUser(logoutUsername, TEST_PASSWORD);
    });

    it("should logout user and redirect to login", async () => {
      await loginUser(page, logoutUsername, TEST_PASSWORD);
      expect(await isLoggedIn(page)).toBe(true);

      // Navigate to a page with header
      await navigateTo(page, "/progress");

      // Click user menu and logout
      const userMenuButton = await page.$(SELECTORS.header.userMenuButton);
      if (userMenuButton) {
        await userMenuButton.click();
        await delay(300);

        const logoutButton = await page.waitForSelector(
          SELECTORS.header.logoutButton,
          { timeout: 5000 }
        );
        if (logoutButton) {
          await logoutButton.click();
          await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {});
        }
      }

      // Wait for redirect to login
      await waitForPath(page, "/login", 5000);
      expect(await getCurrentPath(page)).toBe("/login");
    });
  });
});

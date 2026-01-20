import { Page } from "puppeteer";
import { BASE_URL, delay } from "../setup/browser";
import { SELECTORS } from "./selectors";

export async function registerUser(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
  await page.waitForSelector(SELECTORS.auth.usernameInput);

  // Check if we're on register mode, if not switch to it
  const registerButton = await page.$(SELECTORS.auth.registerToggle);
  if (registerButton) {
    await registerButton.click();
    await delay(300);
  }

  // Clear any existing input
  await page.$eval(SELECTORS.auth.usernameInput, (el) => ((el as HTMLInputElement).value = ""));
  await page.$eval(SELECTORS.auth.passwordInput, (el) => ((el as HTMLInputElement).value = ""));

  await page.type(SELECTORS.auth.usernameInput, username);
  await page.type(SELECTORS.auth.passwordInput, password);
  await page.click(SELECTORS.auth.submitButton);

  // Wait for navigation to complete
  await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {
    // May already have navigated
  });
}

export async function loginUser(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
  await page.waitForSelector(SELECTORS.auth.usernameInput);

  // The page starts in login mode by default, so we just need to fill in the form
  // Clear any existing input
  await page.$eval(SELECTORS.auth.usernameInput, (el) => ((el as HTMLInputElement).value = ""));
  await page.$eval(SELECTORS.auth.passwordInput, (el) => ((el as HTMLInputElement).value = ""));

  await page.type(SELECTORS.auth.usernameInput, username);
  await page.type(SELECTORS.auth.passwordInput, password);
  await page.click(SELECTORS.auth.submitButton);

  // Wait for navigation to complete
  await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {
    // May already have navigated
  });
}

export async function logout(page: Page): Promise<void> {
  // Click user menu in header
  const userMenuButton = await page.$(SELECTORS.header.userMenuButton);
  if (userMenuButton) {
    await userMenuButton.click();
    await delay(300);

    const logoutButton = await page.waitForSelector(SELECTORS.header.logoutButton);
    await logoutButton?.click();

    await page.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {
      // May already have navigated
    });
  }
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  // If we're on a protected route, we're logged in
  return (
    url.includes("/upload") ||
    url.includes("/confirm") ||
    url.includes("/progress") ||
    url.includes("/admin")
  );
}

export async function getCurrentPath(page: Page): Promise<string> {
  const url = new URL(page.url());
  return url.pathname;
}

export async function expectRedirectToLogin(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.location.pathname === "/login",
    { timeout: 5000 }
  );
}

export async function expectRedirectToUpload(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.location.pathname === "/upload",
    { timeout: 5000 }
  );
}

export async function getAuthError(page: Page): Promise<string | null> {
  try {
    await page.waitForSelector(SELECTORS.auth.errorMessage, { timeout: 3000 });
    return await page.$eval(SELECTORS.auth.errorMessage, (el) => el.textContent);
  } catch {
    return null;
  }
}

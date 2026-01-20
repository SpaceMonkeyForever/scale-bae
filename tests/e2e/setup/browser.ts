import puppeteer, { Browser, Page, BrowserContext } from "puppeteer";

export const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let browser: Browser | null = null;

export async function launchBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== "false",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function createPage(
  viewport = { width: 1280, height: 720 }
): Promise<Page> {
  const b = await launchBrowser();
  const page = await b.newPage();
  await page.setViewport(viewport);
  return page;
}

export async function createIncognitoContext(): Promise<{
  context: BrowserContext;
  page: Page;
}> {
  const b = await launchBrowser();
  const context = await b.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  return { context, page };
}

export const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForNetworkIdle({ idleTime: 500 });
}

export async function takeScreenshot(
  page: Page,
  name: string
): Promise<Buffer> {
  const screenshot = await page.screenshot({
    path: `tests/e2e/screenshots/${name}.png`,
    fullPage: true,
  });
  return screenshot as Buffer;
}

// Helper function for delays (replaces deprecated page.waitForTimeout)
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

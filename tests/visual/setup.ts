import puppeteer, { Browser, Page } from "puppeteer";

let browser: Browser | null = null;
let page: Page | null = null;

export const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

export async function setupBrowser() {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  return { browser, page };
}

export async function teardownBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
}

export async function takeScreenshot(name: string) {
  if (!page) throw new Error("Browser not initialized");
  await page.screenshot({
    path: `tests/visual/screenshots/${name}.png`,
    fullPage: true,
  });
}

export async function login(username: string, password: string) {
  if (!page) throw new Error("Browser not initialized");

  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[id="username"]');

  await page.type('input[id="username"]', username);
  await page.type('input[id="password"]', password);
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: "networkidle0" });
}

export { browser, page };

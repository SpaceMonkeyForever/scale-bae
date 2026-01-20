import { Page } from "puppeteer";
import { BASE_URL } from "../setup/browser";

export async function navigateTo(page: Page, path: string): Promise<void> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  await page.goto(url, { waitUntil: "networkidle0" });
}

export async function waitForNavigation(page: Page): Promise<void> {
  await page.waitForNavigation({ waitUntil: "networkidle0" });
}

export async function waitForUrl(
  page: Page,
  urlPart: string,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (url) => window.location.href.includes(url),
    { timeout },
    urlPart
  );
}

export async function waitForPath(
  page: Page,
  path: string,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (p) => window.location.pathname === p,
    { timeout },
    path
  );
}

export async function getCurrentPath(page: Page): Promise<string> {
  return page.evaluate(() => window.location.pathname);
}

export async function getCurrentUrl(page: Page): Promise<string> {
  return page.url();
}

export async function reload(page: Page): Promise<void> {
  await page.reload({ waitUntil: "networkidle0" });
}

export async function goBack(page: Page): Promise<void> {
  await page.goBack({ waitUntil: "networkidle0" });
}

export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await page.waitForSelector(selector, { timeout });
}

export async function waitForElementToDisappear(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (sel) => !document.querySelector(sel),
    { timeout },
    selector
  );
}

export async function clickAndWaitForNavigation(
  page: Page,
  selector: string
): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.click(selector),
  ]);
}

export async function waitForText(
  page: Page,
  text: string,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (t) => document.body.textContent?.includes(t),
    { timeout },
    text
  );
}

export async function waitForTextToDisappear(
  page: Page,
  text: string,
  timeout = 10000
): Promise<void> {
  await page.waitForFunction(
    (t) => !document.body.textContent?.includes(t),
    { timeout },
    text
  );
}

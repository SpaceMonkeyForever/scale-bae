/**
 * Take screenshots of the app pages for review
 * Usage: npx tsx scripts/screenshot.ts
 */

import puppeteer from "puppeteer";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.join(process.cwd(), "tests/visual/screenshots");

async function main() {
  console.log("Taking screenshots of scale-bae...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Desktop screenshots
  await page.setViewport({ width: 1280, height: 800 });

  // Login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "login-desktop.png"),
    fullPage: true,
  });
  console.log("Captured: login-desktop.png");

  // Mobile screenshot
  await page.setViewport({ width: 375, height: 812 });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "login-mobile.png"),
    fullPage: true,
  });
  console.log("Captured: login-mobile.png");

  await browser.close();
  console.log("Done! Screenshots saved to tests/visual/screenshots/");
}

main().catch(console.error);

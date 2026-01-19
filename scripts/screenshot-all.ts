/**
 * Take screenshots of all app pages (including authenticated ones)
 * Usage: npx tsx scripts/screenshot-all.ts
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
  await page.setViewport({ width: 1280, height: 800 });

  // Login page
  console.log("1. Login page...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "01-login.png"),
    fullPage: true,
  });

  // Register a test user
  console.log("2. Registering test user...");

  // Click "Create one" to switch to register mode
  await page.click('button[type="button"]');
  await page.waitForSelector('button[type="submit"]');

  // Fill in the form
  await page.type('input[id="username"]', "testuser" + Date.now());
  await page.type('input[id="password"]', "testpass123");

  // Take screenshot of register form
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "02-register.png"),
    fullPage: true,
  });

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to upload page
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  // Upload page
  console.log("3. Upload page...");
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "03-upload.png"),
    fullPage: true,
  });

  // Progress page (empty state)
  console.log("4. Progress page (empty)...");
  await page.goto(`${BASE_URL}/progress`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "04-progress-empty.png"),
    fullPage: true,
  });

  // Mobile views
  console.log("5. Mobile views...");
  await page.setViewport({ width: 375, height: 812 });

  await page.goto(`${BASE_URL}/upload`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "05-upload-mobile.png"),
    fullPage: true,
  });

  await page.goto(`${BASE_URL}/progress`, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, "06-progress-mobile.png"),
    fullPage: true,
  });

  await browser.close();
  console.log("\nDone! Screenshots saved to tests/visual/screenshots/");
}

main().catch(console.error);

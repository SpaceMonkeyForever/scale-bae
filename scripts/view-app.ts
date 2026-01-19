/**
 * Script to open the app in a Puppeteer browser for visual iteration.
 * Usage: npx tsx scripts/view-app.ts [page]
 *
 * Examples:
 *   npx tsx scripts/view-app.ts          # Opens login page
 *   npx tsx scripts/view-app.ts login    # Opens login page
 *   npx tsx scripts/view-app.ts upload   # Opens upload page
 *   npx tsx scripts/view-app.ts progress # Opens progress page
 */

import puppeteer from "puppeteer";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function main() {
  const pageName = process.argv[2] || "login";

  console.log(`Opening ${pageName} page in browser...`);
  console.log(`Make sure the dev server is running: npm run dev`);

  const browser = await puppeteer.launch({
    headless: false, // Open visible browser
    args: ["--start-maximized"],
    defaultViewport: null, // Use full window size
  });

  const page = await browser.newPage();

  const routes: Record<string, string> = {
    login: "/login",
    upload: "/upload",
    confirm: "/confirm",
    progress: "/progress",
  };

  const route = routes[pageName] || "/login";
  await page.goto(`${BASE_URL}${route}`);

  console.log(`Browser opened at ${BASE_URL}${route}`);
  console.log("Press Ctrl+C to close the browser and exit.");

  // Keep the script running
  await new Promise(() => {});
}

main().catch(console.error);

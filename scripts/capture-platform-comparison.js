#!/usr/bin/env node
/**
 * Capture Nava as single full-size images.
 *
 * 1. Start dev server: npm run dev (in another terminal)
 * 2. Run: npm run capture:comparison
 * 3. For landing only: npm run capture:comparison -- --landing
 * 4. For dashboard only: npm run capture:comparison -- --dashboard
 *
 * Output:
 *   assets/nava-landing-desktop.png, nava-landing-mobile.png
 *   assets/nava-desktop.png, nava-mobile.png (dashboard)
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'assets');
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const LANDING_ONLY = process.argv.includes('--landing');
const DASHBOARD_ONLY = process.argv.includes('--dashboard');

async function capture(context, path, viewport, mobile, filename) {
  const page = await context.newPage({
    viewport,
    isMobile: mobile,
    deviceScaleFactor: mobile ? 2 : 1,
  });
  await page.goto(APP_URL + path, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(ASSETS, filename), fullPage: mobile });
  await page.close();
}

async function main() {
  mkdirSync(ASSETS, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    if (!DASHBOARD_ONLY) {
      await capture(context, '/', { width: 1280, height: 840 }, false, 'nava-landing-desktop.png');
      await capture(context, '/', { width: 375, height: 812 }, true, 'nava-landing-mobile.png');
      console.log('  assets/nava-landing-desktop.png');
      console.log('  assets/nava-landing-mobile.png');
    }
    if (!LANDING_ONLY) {
      await capture(context, '/dashboard', { width: 1280, height: 840 }, false, 'nava-desktop.png');
      await capture(context, '/dashboard', { width: 375, height: 812 }, true, 'nava-mobile.png');
      console.log('  assets/nava-desktop.png');
      console.log('  assets/nava-mobile.png');
    }
    console.log('Done.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

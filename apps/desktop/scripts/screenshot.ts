/**
 * Visual snapshot tool for Claude Code.
 * Usage: npx tsx scripts/screenshot.ts [url] [output]
 *
 * Defaults: http://localhost:3001 → /tmp/screenshot.png
 * Waits for the canvas to appear and 2s for animations to settle.
 */
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3001";
const out = process.argv[3] ?? "/tmp/screenshot.png";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

// Bypass loading screen
await page.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
await page.goto(url, { waitUntil: "load" });

// Wait for canvas
const canvas = page.locator("canvas").first();
if (await canvas.isVisible({ timeout: 10_000 }).catch(() => false)) {
	await page.waitForTimeout(2000); // let animations settle
}

await page.screenshot({ path: out, fullPage: false });
await browser.close();

console.log(`Screenshot saved → ${out}`);

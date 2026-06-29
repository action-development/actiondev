import { chromium } from "playwright";

const url = "http://localhost:3001";
const out = process.argv[2] ?? "/tmp/index.png";
const hover = process.argv.includes("--hover");
const fullPage = process.argv.includes("--full");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
  await page.goto(url, { waitUntil: "load", timeout: 90_000 });
  await page.waitForTimeout(15_000);

  const target = process.argv.find((a) => a.startsWith("--target="))?.split("=")[1] ?? "projects-index";
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
      window.scrollBy(0, window.innerHeight * 0.8);
    }
  }, target);
  await page.waitForTimeout(3500);

  if (hover) {
    const row = page.locator('[data-row]').nth(2);
    await row.hover();
    await page.waitForTimeout(900);
  }

  await page.screenshot({ path: out, fullPage });
  await browser.close();
  console.log("ok →", out);
}
main();

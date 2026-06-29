import { chromium } from "playwright";
const url = "http://localhost:3001";
async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem("action-loaded", "1"));
  await page.goto(url, { waitUntil: "load", timeout: 90_000 });
  await page.waitForTimeout(12_000);
  await page.evaluate(() => {
    const el = document.querySelector("[data-end-coda]");
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/coda.png" });
  await browser.close();
  console.log("ok");
}
main();

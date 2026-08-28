import { chromium, devices } from "playwright";
const b = await chromium.launch();
for (const [name, opts] of [
  ["mobile", devices["iPhone 13"]],
  ["desktop", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }],
]) {
  const c = await b.newContext(opts);
  const p = await c.newPage();
  await p.goto("http://localhost:3002", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `/private/tmp/claude-501/-Users-pablocabaleirosouto-actiondev/820f309d-d8a3-4408-b96e-2336f26a19bf/scratchpad/pablo7-${name}.png` });
  await c.close();
}
await b.close();
console.log("ok");

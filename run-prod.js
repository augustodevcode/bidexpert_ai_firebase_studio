
const { chromium } = require("playwright");
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on("console", msg => console.log("[Browser Console]", msg.text()));
    page.on("pageerror", err => console.log("[Browser Error]", err.message));
    
    await page.goto("http://demo.localhost:9016/auth/login", { waitUntil: "domcontentloaded" });
    await page.fill("input[name=email]", "admin@bidexpert.com.br");
    await page.fill("input[name=password]", "Admin@123");
    await page.click("button[type=submit]");
    await page.waitForTimeout(3000);
    
    await page.goto("http://demo.localhost:9016/admin", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    console.log("On Admin page!");
    const content = await page.innerHTML("body");
    if (content.includes("Application error")) {
        console.log("Application error found!");
    } else {
        console.log("No application error found. Successfully loaded.");
    }
    await browser.close();
})();


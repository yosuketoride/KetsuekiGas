const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set viewport to the ultra-wide dimensions (1242 * 2)
    await page.setViewport({
        width: 2484,
        height: 2688,
        deviceScaleFactor: 1,
    });

    console.log("Loading double-wide layout for Screens 1 & 2...");
    await page.goto('http://localhost:5180/promo.html?s=1_2', { waitUntil: 'networkidle0' });

    console.log("Slicing Screen 1 (Left Half)...");
    await page.screenshot({
        path: '/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/final_promo_1.png',
        clip: { x: 0, y: 0, width: 1242, height: 2688 }
    });

    console.log("Slicing Screen 2 (Right Half)...");
    await page.screenshot({
        path: '/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/final_promo_2.png',
        clip: { x: 1242, y: 0, width: 1242, height: 2688 }
    });

    // Reset viewport for Screen 3
    await page.setViewport({ width: 1242, height: 2688, deviceScaleFactor: 1 });
    console.log("Capturing Screen 3...");
    await page.goto('http://localhost:5180/promo.html?s=3', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: '/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/final_promo_3.png' });

    await browser.close();
    console.log("Done!");
})();

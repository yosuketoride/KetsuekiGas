const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set viewport to the iPad Pro ultra-wide dimensions (2048 * 2)
    await page.setViewport({
        width: 4096,
        height: 2732,
        deviceScaleFactor: 1,
    });

    console.log("Loading double-wide iPad layout for Screens 1 & 2...");
    await page.goto('http://localhost:5180/promo_ipad.html?s=1_2', { waitUntil: 'networkidle0' });

    console.log("Slicing iPad Screen 1 (Left Half)...");
    await page.screenshot({
        path: '/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/final_promo_ipad_1.png',
        clip: { x: 0, y: 0, width: 2048, height: 2732 }
    });

    console.log("Slicing iPad Screen 2 (Right Half)...");
    await page.screenshot({
        path: '/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/final_promo_ipad_2.png',
        clip: { x: 2048, y: 0, width: 2048, height: 2732 }
    });

    // Reset viewport for iPad Screen 3
    await page.setViewport({ width: 2048, height: 2732, deviceScaleFactor: 1 });
    console.log("Capturing iPad Screen 3...");
    await page.goto('http://localhost:5180/promo_ipad.html?s=3', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: '/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/final_promo_ipad_3.png' });

    await browser.close();
    console.log("Done!");
})();

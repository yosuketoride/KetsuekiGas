const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width: 2484, height: 2688, deviceScaleFactor: 1 });

  const img1 = fs.readFileSync('/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/final_promo_1.png').toString('base64');
  const img2 = fs.readFileSync('/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/final_promo_2.png').toString('base64');

  const html = `
    <body style="margin:0; padding:0; display:flex;">
      <div style="width: 1242px; height: 2688px; background-image: url('data:image/png;base64,${img1}'); background-size: cover;"></div>
      <div style="width: 1242px; height: 2688px; background-image: url('data:image/png;base64,${img2}'); background-size: cover; border-left: 2px solid red;"></div>
    </body>
  `;
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: '/Users/yosuke/.gemini/antigravity/brain/a4cd8d5b-c6da-41a0-ad25-f69d95fc13b9/side_by_side_check.png' });
  await browser.close();
  console.log("Check complete.");
})();

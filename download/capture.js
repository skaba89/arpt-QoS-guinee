const { chromium } = require('playwright');
const path = require('path');

async function captureDashboards() {
  const browser = await chromium.launch();
  
  const dashboards = [
    { html: 'dashboard_dg.html', output: 'dashboard_dg.png' },
    { html: 'dashboard_qos.html', output: 'dashboard_qos.png' },
    { html: 'dashboard_sig.html', output: 'dashboard_sig.png' },
    { html: 'dashboard_public.html', output: 'dashboard_public.png' },
    { html: 'dashboard_scoring.html', output: 'dashboard_scoring.png' },
  ];
  
  for (const db of dashboards) {
    console.log(`Capturing ${db.output}...`);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    
    const htmlPath = path.join(__dirname, 'html', db.html);
    const outputPath = path.join(__dirname, db.output);
    
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait a bit for fonts to load
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: outputPath,
      fullPage: false,
      type: 'png',
    });
    
    console.log(`  ✓ Saved: ${outputPath}`);
    await context.close();
  }
  
  await browser.close();
  console.log('\nAll dashboards captured!');
}

captureDashboards().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

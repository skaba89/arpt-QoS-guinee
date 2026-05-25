const { chromium } = require('playwright');
const { spawn } = require('child_process');

async function main() {
  // Start Next.js server
  const server = spawn('npx', ['next', 'dev', '-p', '3001'], {
    cwd: '/home/z/my-project',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=384' },
    stdio: 'pipe'
  });
  
  // Wait for server to be ready
  await new Promise(resolve => {
    server.stdout.on('data', (data) => {
      const str = data.toString();
      console.log('STDOUT:', str.substring(0, 100));
      if (str.includes('Ready')) {
        console.log('Server ready!');
        resolve();
      }
    });
    server.stderr.on('data', (data) => {
      const str = data.toString();
      console.log('STDERR:', str.substring(0, 100));
      if (str.includes('Ready')) {
        console.log('Server ready (stderr)!');
        resolve();
      }
    });
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Take screenshot
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/home/z/my-project/download/onit-preview-full.png', fullPage: false });
    console.log('Screenshot saved successfully!');
  } catch(e) {
    console.error('Screenshot error:', e.message);
  }
  
  await browser.close();
  server.kill();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

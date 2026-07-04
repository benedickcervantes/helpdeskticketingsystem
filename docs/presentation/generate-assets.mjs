/**
 * Generates live site screenshots + PNG slides for Canva upload.
 * Run: node generate-assets.mjs
 *
 * Optional env (for logged-in screenshots):
 *   DEMO_EMAIL=you@company.com
 *   DEMO_PASSWORD=YourPassword123
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const PNG_DIR = path.join(__dirname, 'png-slides-en');
const HTML_EN = path.join(__dirname, 'FCDC-Helpdesk-Slides-EN.html');
const ASSETS_DIR = path.join(__dirname, 'assets');
const LOGO_DEST = path.join(ASSETS_DIR, 'fcdc-logo.png');
const LIVE_URL = 'https://helpdeskticketingsystem.vercel.app';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const VIEWPORT = { width: 1440, height: 900 };

async function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function processLogo() {
  ensureDir(ASSETS_DIR);
  const candidates = [
    path.join(__dirname, '..', '..', 'public', 'FCDC LOGO.png'),
    path.join(__dirname, '..', '..', 'public', 'fcdc-logo.png'),
  ];
  const input = candidates.find((p) => fs.existsSync(p));
  if (!input) {
    console.warn('  ⚠ Logo source not found');
    return;
  }

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Remove white/near-white background so logo shows on dark slides
    if (r > 230 && g > 230 && b > 230) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 10 })
    .png()
    .toFile(LOGO_DEST);

  console.log('  ✓ FCDC logo processed (transparent background)');
}

async function shot(page, fileName, options = {}) {
  const outPath = path.join(SCREENSHOTS_DIR, fileName);
  await page.screenshot({ path: outPath, type: 'png', ...options });
  console.log(`  ✓ ${fileName}`);
}

async function capturePublicScreenshots(page) {
  console.log('\n📸 Capturing public pages...');

  await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);
  await shot(page, '01-homepage.png');

  await page.goto(`${LIVE_URL}/auth`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await shot(page, '02-auth-login.png');

  const loginForm = page.locator('form').first();
  if (await loginForm.count()) {
    await shot(page, '02-auth-login-form.png', {
      clip: await loginForm.boundingBox(),
    });
  }

  await page.goto(`${LIVE_URL}/auth?register=true`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await shot(page, '03-auth-register.png');

  const regForm = page.locator('form').first();
  if (await regForm.count()) {
    await shot(page, '03-auth-register-form.png', {
      clip: await regForm.boundingBox(),
    });
  }
}

async function tryLogin(page, email, password) {
  await page.goto(`${LIVE_URL}/auth`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(4000);
  return page.url().includes('/user') || page.url().includes('/admin');
}

async function tryRegister(page) {
  const stamp = Date.now();
  const email = `fcdc.training.${stamp}@demo.local`;
  const password = 'Training123!';

  await page.goto(`${LIVE_URL}/auth?register=true`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  await page.fill('input[name="name"]', 'Training Demo User');
  await page.selectOption('select[name="department"]', { index: 1 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  await page.waitForTimeout(5000);
  const ok = page.url().includes('/user');
  if (ok) console.log(`  ✓ Registered demo user: ${email}`);
  return ok;
}

async function captureAuthenticatedScreenshots(page) {
  console.log('\n🔐 Capturing logged-in user screens...');

  const demoEmail = process.env.DEMO_EMAIL?.trim();
  const demoPassword = process.env.DEMO_PASSWORD?.trim();

  let loggedIn = false;
  if (demoEmail && demoPassword) {
    loggedIn = await tryLogin(page, demoEmail, demoPassword);
    if (loggedIn) console.log(`  ✓ Logged in as ${demoEmail}`);
    else console.warn('  ⚠ Demo login failed, trying registration...');
  }

  if (!loggedIn) {
    loggedIn = await tryRegister(page);
  }

  if (!loggedIn) {
    console.warn('  ⚠ Could not access user dashboard — skipping authenticated screenshots');
    console.warn('    Set DEMO_EMAIL and DEMO_PASSWORD env vars for better screenshots.');
    return;
  }

  const pages = [
    { file: '04-user-dashboard.png', url: `${LIVE_URL}/user`, wait: 4000 },
    { file: '05-create-ticket.png', url: `${LIVE_URL}/user?tab=create`, wait: 4000 },
    { file: '06-my-tickets.png', url: `${LIVE_URL}/user?tab=tickets`, wait: 4000 },
  ];

  for (const item of pages) {
    await page.goto(item.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(item.wait);
    // Wait for loading skeletons to disappear
    await page.waitForFunction(
      () => !document.querySelector('[class*="Skeleton"]') && !document.body.innerText.includes('Initializing'),
      { timeout: 15000 },
    ).catch(() => {});

    await page.waitForTimeout(1500);
    await shot(page, item.file);
  }

  // Clipped main content area (below header)
  await page.goto(`${LIVE_URL}/user?tab=create`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  const main = page.locator('main, [class*="max-w-7xl"]').first();
  if (await main.count()) {
    const box = await main.boundingBox();
    if (box) {
      await shot(page, '05-create-ticket-focus.png', { clip: box });
    }
  }
}

async function exportSlidePNGs(browser) {
  if (!fs.existsSync(HTML_EN)) {
    console.warn('\n⚠ English HTML not found, skipping slide PNG export.');
    return;
  }

  console.log(`\n🖼️  Exporting slide PNGs (${SLIDE_W}×${SLIDE_H})...`);
  const page = await browser.newPage();
  await page.setViewportSize({ width: SLIDE_W, height: SLIDE_H });

  const fileUrl = pathToFileURL(HTML_EN).href;
  await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);

  const slideCount = await page.locator('.slide').count();
  console.log(`  Found ${slideCount} slides`);

  for (let i = 0; i < slideCount; i++) {
    const num = String(i + 1).padStart(2, '0');
    const outPath = path.join(PNG_DIR, `slide-${num}.png`);

    await page.evaluate(({ index, w, h }) => {
      const hint = document.querySelector('.print-hint');
      if (hint) hint.style.display = 'none';

      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.background = '#0f1419';
      document.body.style.overflow = 'hidden';
      document.body.style.width = `${w}px`;
      document.body.style.height = `${h}px`;

      const container = document.getElementById('slides-container');
      if (container) {
        container.style.padding = '0';
        container.style.gap = '0';
        container.style.display = 'block';
      }

      document.querySelectorAll('.slide-scale-wrap').forEach((wrap) => {
        wrap.style.width = `${w}px`;
        wrap.style.height = `${h}px`;
        wrap.style.overflow = 'hidden';
        wrap.style.boxShadow = 'none';
        wrap.style.borderRadius = '0';
      });

      document.querySelectorAll('.slide').forEach((slide, idx) => {
        const visible = idx === index;
        slide.style.display = visible ? 'flex' : 'none';
        slide.style.margin = '0';
        slide.style.transform = 'none';
        slide.style.position = visible ? 'relative' : 'absolute';
        slide.style.top = '0';
        slide.style.left = '0';
        slide.style.width = `${w}px`;
        slide.style.height = `${h}px`;

        const wrap = slide.closest('.slide-scale-wrap');
        if (wrap) wrap.style.display = visible ? 'block' : 'none';
      });
    }, { index: i, w: SLIDE_W, h: SLIDE_H });

    await page.waitForTimeout(200);
    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H },
    });
    console.log(`  ✓ slide-${num}.png`);
  }

  await page.close();
}

async function main() {
  ensureDir(SCREENSHOTS_DIR);
  ensureDir(PNG_DIR);
  await processLogo();

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setViewportSize(VIEWPORT);

    await capturePublicScreenshots(page);
    await captureAuthenticatedScreenshots(page);
    await page.close();

    await exportSlidePNGs(browser);

    console.log('\n✅ Done!');
    console.log(`   Screenshots: ${SCREENSHOTS_DIR}`);
    console.log(`   Slide PNGs:  ${PNG_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

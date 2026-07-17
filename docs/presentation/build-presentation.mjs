/**
 * Full presentation build:
 * 1. Capture live screenshots
 * 2. Prepare logo (keep original colors on white tile)
 * 3. Embed all images as base64 into standalone HTML
 * 4. Export PNG slides for Canva
 *
 * Run: npm run build
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
const ASSETS_DIR = path.join(__dirname, 'assets');
const LOGO_DEST = path.join(ASSETS_DIR, 'fpdc-logo.png');
const LIVE_URL = 'https://helpdeskticketingsystem.vercel.app';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const VIEWPORT = { width: 1920, height: 1080 };

const HTML_SOURCES = [
  { src: 'FPDC-Helpdesk-Slides-EN.html', out: 'FPDC-Helpdesk-Slides-EN-standalone.html' },
  { src: 'FPDC-Helpdesk-Slides.html', out: 'FPDC-Helpdesk-Slides-standalone.html' },
];

const SCREENSHOT_FILES = [
  '02-auth-login-card.png',
  '02-auth-login-form.png',
  '02-auth-login.png',
  '03-auth-register.png',
  '03-auth-register-form.png',
  '04-user-dashboard.png',
  '05-create-ticket.png',
  '06-my-tickets.png',
  '01-homepage.png',
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function toDataUri(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function prepareLogo() {
  ensureDir(ASSETS_DIR);
  const candidates = [
    path.join(__dirname, '..', '..', 'public', 'FPDC LOGO.png'),
    path.join(__dirname, '..', '..', 'public', 'fpdc-logo.png'),
  ];
  const input = candidates.find((p) => fs.existsSync(p));
  if (!input) {
    console.warn('  ⚠ Logo source not found');
    return;
  }

  // Resize for crisp display, keep original white background + colors
  await sharp(input)
    .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(LOGO_DEST);

  console.log('  ✓ Logo prepared (original colors, white tile)');
}

async function shot(page, fileName, options = {}) {
  const outPath = path.join(SCREENSHOTS_DIR, fileName);
  await page.screenshot({ path: outPath, type: 'png', ...options });
  console.log(`  ✓ ${fileName}`);
}

async function captureAuthCard(page, fileName) {
  const card = page.locator('.max-w-md .rounded-2xl').first();
  await card.waitFor({ state: 'visible', timeout: 15000 });
  const box = await card.boundingBox();
  if (!box) return;
  const pad = 56;
  await shot(page, fileName, {
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    },
  });
}

async function capturePublicScreenshots(page) {
  console.log('\n📸 Capturing public pages...');
  await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);
  await shot(page, '01-homepage.png');

  await page.goto(`${LIVE_URL}/auth`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await shot(page, '02-auth-login.png');
  await captureAuthCard(page, '02-auth-login-card.png');
  const loginForm = page.locator('form').first();
  if (await loginForm.count()) {
    const box = await loginForm.boundingBox();
    if (box) await shot(page, '02-auth-login-form.png', { clip: box });
  }

  await page.goto(`${LIVE_URL}/auth?register=true`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await shot(page, '03-auth-register.png');
  const regForm = page.locator('form').first();
  if (await regForm.count()) {
    const box = await regForm.boundingBox();
    if (box) await shot(page, '03-auth-register-form.png', { clip: box });
  }
}

async function tryLogin(page, email, password) {
  await page.goto(`${LIVE_URL}/auth`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(5000);
  return page.url().includes('/user') || page.url().includes('/admin');
}

async function tryRegister(page) {
  const email = `fpdc.training.${Date.now()}@demo.local`;
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
  if (ok) console.log(`  ✓ Registered: ${email}`);
  return ok;
}

async function captureAuthenticatedScreenshots(page) {
  console.log('\n🔐 Capturing user dashboard screens...');
  const demoEmail = process.env.DEMO_EMAIL?.trim();
  const demoPassword = process.env.DEMO_PASSWORD?.trim();

  let loggedIn = demoEmail && demoPassword ? await tryLogin(page, demoEmail, demoPassword) : false;
  if (!loggedIn) loggedIn = await tryRegister(page);
  if (!loggedIn) {
    console.warn('  ⚠ Skipping dashboard screenshots (login failed)');
    return;
  }

  const routes = [
    { file: '04-user-dashboard.png', url: `${LIVE_URL}/user` },
    { file: '05-create-ticket.png', url: `${LIVE_URL}/user?tab=create` },
    { file: '06-my-tickets.png', url: `${LIVE_URL}/user?tab=tickets` },
  ];

  for (const route of routes) {
    await page.goto(route.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.waitForFunction(
      () => !document.body.innerText.includes('Initializing'),
      { timeout: 15000 },
    ).catch(() => {});
    await page.waitForTimeout(1000);
    await shot(page, route.file);
  }
}

function embedAssetsInHtml(htmlPath, outPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  const logoUri = toDataUri(LOGO_DEST);
  if (logoUri) {
    html = html.replace(/src="assets\/fpdc-logo\.png"/g, `src="${logoUri}"`);
  }

  for (const file of SCREENSHOT_FILES) {
    const uri = toDataUri(path.join(SCREENSHOTS_DIR, file));
    if (uri) {
      html = html.replace(new RegExp(`src="screenshots/${file.replace('.', '\\.')}"`, 'g'), `src="${uri}"`);
      html = html.replace(
        new RegExp(`onerror="this\\.src='screenshots/${file.replace('.', '\\.')}'"`, 'g'),
        '',
      );
    }
  }

  // Remove broken onerror fallbacks
  html = html.replace(/onerror="this\.src='screenshots\/[^']+'"/g, '');
  html = html.replace(/onerror="this\.style\.display='none'"/g, '');

  const presentJs = path.join(__dirname, 'presentation-mode.js');
  if (fs.existsSync(presentJs)) {
    const js = fs.readFileSync(presentJs, 'utf8');
    html = html.replace(
      '<script src="presentation-mode.js"></script>',
      `<script>\n${js}\n</script>`,
    );
  }

  fs.writeFileSync(outPath, html, 'utf8');
  const sizeMb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`  ✓ ${path.basename(outPath)} (${sizeMb} MB, all images embedded)`);
  return outPath;
}

async function exportSlidePNGs(_browser, htmlPath, context) {
  console.log(`\n🖼️  Exporting PNG slides from ${path.basename(htmlPath)}...`);
  const page = await context.newPage();

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(3000);

  const slideCount = await page.locator('.slide').count();
  console.log(`  Found ${slideCount} slides`);

  for (let i = 0; i < slideCount; i++) {
    const num = String(i + 1).padStart(2, '0');
    await page.evaluate(({ index, w, h }) => {
      document.querySelector('.print-hint')?.remove();
      document.getElementById('present-start')?.remove();
      document.getElementById('present-hud')?.remove();
      document.getElementById('present-progress')?.remove();
      document.body.style.cssText = `margin:0;padding:0;background:#0f1419;overflow:hidden;width:${w}px;height:${h}px`;
      const container = document.getElementById('slides-container');
      if (container) container.style.cssText = 'padding:0;gap:0;display:block';
      document.querySelectorAll('.slide-scale-wrap').forEach((wrap) => {
        wrap.style.cssText = `width:${w}px;height:${h}px;overflow:hidden;box-shadow:none;border-radius:0`;
      });
      document.querySelectorAll('.slide').forEach((slide, idx) => {
        const show = idx === index;
        slide.style.cssText = `display:${show ? 'flex' : 'none'};margin:0;transform:none;width:${w}px;height:${h}px;position:relative`;
        const wrap = slide.closest('.slide-scale-wrap');
        if (wrap) wrap.style.display = show ? 'block' : 'none';
      });
    }, { index: i, w: SLIDE_W, h: SLIDE_H });

    await page.waitForTimeout(300);
    const pngPath = path.join(PNG_DIR, `slide-${num}.png`);
    const buffer = await page.screenshot({
      type: 'png',
      scale: 'device',
      clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H },
    });
    await sharp(buffer)
      .resize(SLIDE_W, SLIDE_H, { kernel: sharp.kernel.lanczos3 })
      .png()
      .toFile(pngPath);
    console.log(`  ✓ slide-${num}.png`);
  }
  await page.close();
}

async function main() {
  const skipCapture = process.argv.includes('--skip-capture');
  ensureDir(SCREENSHOTS_DIR);
  ensureDir(PNG_DIR);
  await prepareLogo();

  const browser = await chromium.launch({ headless: true });
  try {
    if (!skipCapture) {
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      await capturePublicScreenshots(page);
      await captureAuthenticatedScreenshots(page);
      await page.close();
      await context.close();
    } else {
      console.log('\n⏭ Skipping screenshot capture (--skip-capture)');
    }

    console.log('\n📦 Embedding assets into standalone HTML...');
    const standalonePaths = HTML_SOURCES.map(({ src, out }) =>
      embedAssetsInHtml(path.join(__dirname, src), path.join(__dirname, out)),
    );

    const exportContext = await browser.newContext({
      viewport: { width: SLIDE_W, height: SLIDE_H },
      deviceScaleFactor: 2,
    });
    await exportSlidePNGs(browser, standalonePaths[0], exportContext);
    await exportContext.close();
  } finally {
    await browser.close();
  }

  console.log('\n✅ Build complete!');
  console.log('   Open: FPDC-Helpdesk-Slides-EN-standalone.html');
  console.log('   Canva: png-slides-en/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

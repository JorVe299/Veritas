// Takes the nine README screenshots from the mock panel. One frame for all of them.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

// Any Chromium build serves; set BROWSER to override the usual Windows locations
const CANDIDATES = [
    process.env.BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
const EDGE = CANDIDATES.find(p => fs.existsSync(p));
const BASE = 'http://127.0.0.1:3101';
const OUT = path.join(__dirname, '..');

const only = process.argv[2] || null;

// The portal pages are short; a 900px frame would be mostly empty ground
const HEIGHT = { 'veritas-id-characters': 720 };

async function settle(page, ms = 900) {
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(ms);
}

// Nothing hovered, nothing focused: the pointer parks in a dead corner
async function park(page) {
    await page.mouse.move(1439, 899);
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.waitForTimeout(250);
}

async function click(page, label, { role = 'button', exact = false } = {}) {
    const target = page.getByRole(role, { name: label, exact }).first();
    await target.waitFor({ state: 'visible', timeout: 10000 });
    await target.click();
    await settle(page, 700);
}

const SHOTS = {
    async home(page) {
        await page.goto(BASE, { waitUntil: 'networkidle' });
        await settle(page);
    },

    async 'citizen-identity'(page) {
        await page.goto(BASE, { waitUntil: 'networkidle' });
        await settle(page);
        await page.getByRole('button', { name: /AISHA BENNETT/i }).first().click();
        await settle(page);
        await click(page, /^identity$/i, { role: 'tab' });
    },

    async 'citizen-money'(page) {
        await SHOTS['citizen-identity'](page);
        await click(page, /^money$/i, { role: 'tab' });
    },

    async 'citizen-assets'(page) {
        await SHOTS['citizen-identity'](page);
        await click(page, /^assets$/i, { role: 'tab' });
    },

    async 'server-bans'(page) {
        await page.goto(BASE, { waitUntil: 'networkidle' });
        await settle(page);
        await click(page, /^Server$/i);
        await click(page, /^bans$/i, { role: 'tab' });
    },

    async 'server-organisations'(page) {
        await page.goto(BASE, { waitUntil: 'networkidle' });
        await settle(page);
        await click(page, /^Server$/i);
        await click(page, /^organisations$/i, { role: 'tab' });
    },

    async permissions(page) {
        await page.goto(BASE, { waitUntil: 'networkidle' });
        await settle(page);
        await click(page, /^Permissions$/i);
        // The dialog opens on the role list; the rights grid is below it
        await page.mouse.move(720, 500);
        await page.mouse.wheel(0, 900);
        await settle(page, 600);
    },

    async 'veritas-id-characters'(page) {
        await page.goto(`${BASE}/id`, { waitUntil: 'networkidle' });
        await settle(page, 1200);
    },

    async 'veritas-id-character'(page) {
        await page.goto(`${BASE}/id`, { waitUntil: 'networkidle' });
        await settle(page, 1200);
        await page.getByRole('button', { name: /AISHA BENNETT/i }).first().click();
        await settle(page, 1000);
    },
};

(async () => {
    const browser = await chromium.launch({ executablePath: EDGE, headless: true });
    const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
        colorScheme: 'dark',
    });

    const problems = [];
    page.on('pageerror', e => problems.push(String(e)));

    for (const [name, steps] of Object.entries(SHOTS)) {
        if (only && only !== name) continue;
        await page.setViewportSize({ width: 1440, height: HEIGHT[name] || 900 });
        try {
            await steps(page);
            await park(page);
            const file = path.join(OUT, `${name}.jpg`);
            await page.screenshot({ path: file, type: 'jpeg', quality: 86 });
            const visible = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 120));
            console.log(`OK   ${name}.jpg  | ${visible}`);
        } catch (e) {
            console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`);
        }
    }

    if (problems.length) console.log('PAGE ERRORS:', [...new Set(problems)].slice(0, 5));
    await browser.close();
})();

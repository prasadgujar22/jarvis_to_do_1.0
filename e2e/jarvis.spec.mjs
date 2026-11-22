import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const artifacts = fileURLToPath(new URL('../test-artifacts/', import.meta.url));
const composer = page => page.getByRole('textbox', { name: 'New task' });
const done = (page, title) => page.getByRole('checkbox', { name: 'Done: ' + title, exact: true });
const action = (page, verb, title) => page.getByRole('button', { name: verb + ' "' + title + '"', exact: true });
const filter = (page, name) => page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: new RegExp('^' + name + '\\b') });
const theme = page => page.getByRole('switch', { name: 'Dark theme' });
const titles = page => page.locator('[data-task-row] p[id^="task-title-"]:visible');

async function add(page, title) {
  await composer(page).fill(title);
  await page.getByRole('button', { name: /^Add( task)?$/ }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

async function screenshot(page, info, name) {
  await page.screenshot({ path: path.join(artifacts, info.project.name + '-' + name + '.png'), animations: 'disabled', fullPage: true });
}

async function verifyTheme(page, scheme) {
  await expect(theme(page)).toHaveAttribute('aria-checked', String(scheme === 'dark'));
  await expect(page.locator('html')).toHaveCSS('color-scheme', scheme);
  return page.locator('html').evaluate(root => getComputedStyle(root).backgroundColor);
}

async function reorder(page) {
  const order = await titles(page).allTextContents();
  const from = action(page, 'Reorder', order[0]);
  const to = page.locator('[data-task-row]').filter({ hasText: order.at(-1) });
  await from.scrollIntoViewIfNeeded();
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  const x = start.x + start.width / 2;
  const y = start.y + start.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 12, { steps: 3 });
  await page.mouse.move(x, end.y + end.height / 2 + 10, { steps: 16 });
  await page.mouse.up();
  const expected = [...order.slice(1), order[0]];
  await expect(titles(page)).toHaveText(expected);
  return expected;
}

test.beforeEach(async ({ page }, info) => {
  const consoleErrors = [];
  page.on('pageerror', error => consoleErrors.push('pageerror ' + error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push('console.error ' + msg.text() + ' ' + (msg.location().url || ''));
  });
  // Keep observing through the test, even when an assertion fails.
  info.consoleErrors = consoleErrors;
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: /Jarvis/ })).toBeVisible();
});

test.afterEach(async ({}, info) => {
  await info.attach('browser-errors', { body: JSON.stringify(info.consoleErrors), contentType: 'application/json' });
  expect(info.consoleErrors).toEqual([]);
});

test('01 Add task', async ({ page }) => {
  await add(page, 'QA plan');
  await expect(titles(page)).toHaveText(['QA plan']);
  await expect(composer(page)).toHaveValue('');
});

test('02 Edit task', async ({ page }) => {
  await add(page, 'QA draft');
  await action(page, 'Edit', 'QA draft').click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('QA revised draft');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(titles(page)).toHaveText(['QA revised draft']);
  await page.reload();
  await expect(titles(page)).toHaveText(['QA revised draft']);
});

test('03 Complete and uncomplete', async ({ page }) => {
  await add(page, 'QA toggle');
  await done(page, 'QA toggle').click();
  await expect(done(page, 'QA toggle')).toBeChecked();
  await done(page, 'QA toggle').click();
  await expect(done(page, 'QA toggle')).not.toBeChecked();
});

test('04 Delete task', async ({ page }) => {
  await add(page, 'QA remove');
  await action(page, 'Delete', 'QA remove').click();
  await expect(page.getByText('QA remove', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'A clean slate' })).toBeVisible();
  await page.reload();
  await expect(titles(page)).toHaveCount(0);
});

test('05 Status filters and timing', async ({ page }, info) => {
  const all = ['QA Charlie', 'QA Bravo', 'QA Alpha'];
  for (const title of [...all].reverse()) await add(page, title);
  await done(page, 'QA Bravo').click();
  await expect(titles(page)).toHaveText(all);
  await screenshot(page, info, 'desktop-all-tasks');
  const samples = { Active: [], Done: [], All: [] };
  const expected = { Active: [all[0], all[2]], Done: [all[1]], All: all };
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const [name, subset] of Object.entries(expected)) {
      const button = filter(page, name);
      await button.evaluate(element => {
        element.addEventListener('click', () => { window.qaFilterStart = performance.now(); }, { capture: true, once: true });
      });
      await button.click();
      const measurement = await page.waitForFunction(({ subset, name }) => {
        const rows = [...document.querySelectorAll('[data-task-row] p[id^="task-title-"]')].filter(row => row.getClientRects().length);
        const filterButton = [...document.querySelectorAll('[aria-label="Filter by status"] button')].find(el => el.textContent.trim().startsWith(name));
        if (filterButton?.getAttribute('aria-pressed') === 'true' && JSON.stringify(rows.map(row => row.textContent)) === JSON.stringify(subset)) {
          return performance.now() - window.qaFilterStart;
        }
        return false;
      }, { subset, name });
      samples[name].push(Number((await measurement.jsonValue()).toFixed(1)));
      if (cycle === 0 && name !== 'All') await screenshot(page, info, 'desktop-filter-' + name.toLowerCase());
    }
  }
  await info.attach('filter-timings-ms', { body: JSON.stringify(samples), contentType: 'application/json' });
  expect(Math.max(...Object.values(samples).flat())).toBeLessThan(500);
});

test('06 Pointer drag-and-drop reorder', async ({ page }, info) => {
  for (const title of ['QA Alpha', 'QA Bravo', 'QA Charlie']) await add(page, title);
  await expect(titles(page)).toHaveText(['QA Charlie', 'QA Bravo', 'QA Alpha']);
  await reorder(page);
  await screenshot(page, info, 'desktop-reordered');
});

test('07 Switch themes', async ({ page }, info) => {
  await add(page, 'QA theme preview');
  const light = await verifyTheme(page, 'light');
  await screenshot(page, info, 'desktop-light');
  await theme(page).click();
  const dark = await verifyTheme(page, 'dark');
  expect(dark).not.toBe(light);
  await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
  await screenshot(page, info, 'desktop-dark');
  await theme(page).click();
  expect(await verifyTheme(page, 'light')).toBe(light);
});

test('08 Restores tasks, completion, order and theme on reload', async ({ page }) => {
  for (const title of ['QA Alpha', 'QA Bravo', 'QA Charlie']) await add(page, title);
  await done(page, 'QA Bravo').click();
  await theme(page).click();
  const dark = await verifyTheme(page, 'dark');
  await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));
  const expectedOrder = await reorder(page);
  await page.reload();
  await expect(titles(page)).toHaveText(expectedOrder);
  await expect(done(page, 'QA Bravo')).toBeChecked();
  await expect(done(page, 'QA Alpha')).not.toBeChecked();
  expect(await verifyTheme(page, 'dark')).toBe(dark);
});

test('09 Fresh and filtered empty states', async ({ page }, info) => {
  await expect(page.getByRole('heading', { name: 'A clean slate' })).toBeVisible();
  await expect(titles(page)).toHaveCount(0);
  await screenshot(page, info, 'desktop-empty');
  await add(page, 'QA first');
  await filter(page, 'Done').click();
  await expect(page.getByRole('heading', { name: 'Nothing completed yet' })).toBeVisible();
  await expect(titles(page)).toHaveCount(0);
  await screenshot(page, info, 'desktop-filter-empty');
  await filter(page, 'All').click();
  await done(page, 'QA first').click();
  await filter(page, 'Active').click();
  await expect(page.getByRole('heading', { name: 'All caught up' })).toBeVisible();
  await expect(titles(page)).toHaveCount(0);
});

test('10 Keyboard shortcuts and tab reachability', async ({ page }) => {
  await page.keyboard.press('n');
  await expect(composer(page)).toBeFocused();
  await page.keyboard.type('QA keyboard');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add task', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(titles(page)).toHaveText(['QA keyboard']);
  await page.keyboard.press('Escape');
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.keyboard.press('Escape');
  await page.keyboard.press('3');
  await expect(filter(page, 'Done')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('1');
  await expect(filter(page, 'All')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();

  const controls = [
    theme(page), composer(page), page.getByRole('searchbox'), ...['All', 'Active', 'Done'].map(name => filter(page, name)),
    done(page, 'QA keyboard'), ...['Reorder', 'Edit', 'Delete'].map(verb => action(page, verb, 'QA keyboard')),
  ];
  const remaining = new Set(controls);
  for (let index = 0; index < 40 && remaining.size; index++) {
    await page.keyboard.press('Tab');
    for (const control of remaining) {
      if (await control.evaluate(element => element === document.activeElement)) remaining.delete(control);
    }
  }
  expect([...remaining].map(String)).toEqual([]);
  for (let index = 0; index < 40; index++) {
    if (await done(page, 'QA keyboard').evaluate(element => element === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(done(page, 'QA keyboard')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(done(page, 'QA keyboard')).toBeChecked();
});

test.describe('touch viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('11 Mobile add, complete, filter, delete, theme and layout', async ({ page }, info) => {
    await composer(page).fill('QA mobile');
    await page.getByRole('button', { name: 'Add', exact: true }).tap();
    await expect(titles(page)).toHaveText(['QA mobile']);
    await done(page, 'QA mobile').tap();
    await expect(done(page, 'QA mobile')).toBeChecked();
    await filter(page, 'Active').tap();
    await expect(titles(page)).toHaveCount(0);
    await filter(page, 'Done').tap();
    await expect(titles(page)).toHaveText(['QA mobile']);
    await theme(page).tap();
    await verifyTheme(page, 'dark');
    await page.waitForFunction(() => !document.documentElement.matches(':active-view-transition'));

    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(layout).toEqual({ width: 390, scroll: 390 });
    for (const control of [composer(page), theme(page), filter(page, 'Done'), done(page, 'QA mobile'), action(page, 'Delete', 'QA mobile')]) {
      const rect = await control.boundingBox();
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(390);
    }
    await page.screenshot({ path: path.join(artifacts, info.project.name + '-mobile-390x844.png'), animations: 'disabled' });
    await action(page, 'Delete', 'QA mobile').tap();
    await expect(titles(page)).toHaveCount(0);
  });
});

test('12 Basic accessibility', async ({ page }, info) => {
  await expect(page).toHaveTitle(/Jarvis To-Do/);
  await expect(page.getByRole('main')).toBeVisible();
  await add(page, 'QA accessible');

  async function checkNames() {
    for (const control of await page.locator('button:visible, input:visible, a[href]:visible').all()) {
      await expect(control).toHaveAccessibleName(/\S/);
    }
  }

  await checkNames();
  for (const name of ['All', 'Active', 'Done']) await expect(filter(page, name)).toHaveAccessibleName(new RegExp(name));
  await action(page, 'Edit', 'QA accessible').click();
  await checkNames();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();

  const control = theme(page);
  const outline = () => control.evaluate(element => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth, shadow: style.boxShadow };
  });
  await page.mouse.click(1, 1);
  const before = await outline();
  for (let index = 0; index < 40; index++) {
    if (await control.evaluate(element => element === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(control).toBeFocused();
  await expect.poll(outline).not.toEqual(before);
  await screenshot(page, info, 'desktop-keyboard-focus');
  await info.attach('focus-style', { body: JSON.stringify(await outline()), contentType: 'application/json' });
});

test('13 Enabled Add task label contrast', async ({ page }, info) => {
  await composer(page).fill('QA contrast');
  await page.mouse.move(1, 1);
  const label = page.getByRole('button', { name: 'Add task', exact: true }).getByText('Add task', { exact: true });
  await expect(label).toHaveCSS('color', 'rgb(255, 255, 255)');
  await screenshot(page, info, 'desktop-add-contrast');
  // Read the composited gradient underneath the label with glyphs temporarily hidden for capture.
  const pixels = await label.screenshot({
    style: '#composer-input ~ button > span { color: transparent !important; }',
    animations: 'disabled',
  });
  const ratios = await page.evaluate(async encoded => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + encoded;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    return [0.25, 0.5, 0.75].map(fraction => {
      const x = Math.floor(canvas.width * fraction);
      const y = Math.floor(canvas.height / 2);
      const rgb = [...ctx.getImageData(x, y, 1, 1).data].slice(0, 3);
      const linear = rgb.map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      return { rgb, ratio: Number((1.05 / (luminance + 0.05)).toFixed(2)) };
    });
  }, pixels.toString('base64'));
  await info.attach('contrast-samples', { body: JSON.stringify(ratios), contentType: 'application/json' });
  expect(Math.min(...ratios.map(sample => sample.ratio))).toBeGreaterThanOrEqual(4.5);
});

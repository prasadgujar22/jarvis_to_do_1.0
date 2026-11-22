import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const artifacts = fileURLToPath(new URL('../test-artifacts/', import.meta.url));
const composer = page => page.getByRole('textbox', { name: 'New task' });
const done = (page, title) => page.getByRole('checkbox', { name: 'Done: ' + title, exact: true });
const action = (page, verb, title) => page.getByRole('button', { name: verb + ' "' + title + '"', exact: true });
const filter = (page, name) => page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: new RegExp('^' + name + '\\b') });
const theme = page => page.getByRole('switch', { name: 'Dark theme' });
const titles = page => page.locator('[data-task-row] p[id^="task-title-"]:not([id$="-note"]):visible');

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

const notes = page => page.getByRole('textbox', { name: 'Notes', exact: true });
const noteToggle = (page, name) => page.getByRole('button', { name: name + ' note', exact: true });
const save = page => page.getByRole('button', { name: 'Save', exact: true });

async function addWithNote(page, title, note) {
  await add(page, title);
  await action(page, 'Edit', title).click();
  await notes(page).fill(note);
  await save(page).click();
  await expect(notes(page)).toHaveCount(0);
}

test('14 Add a multiline note and show its preview', async ({ page }) => {
  const note = 'Confirm the agenda.\nSend it to the team.';
  await addWithNote(page, 'QA meeting', note);
  await expect(noteToggle(page, 'Show').getByText('Note', { exact: true })).toBeVisible();
  const preview = page.getByText(note, { exact: true });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveClass(/\bline-clamp-2\b/);
});

test('15 Edit and clear an existing note', async ({ page }) => {
  const title = 'QA schedule';
  const original = 'Meet on Monday.';
  const updated = 'Meet on Thursday.';
  await addWithNote(page, title, original);
  await action(page, 'Edit', title).click();
  await expect(notes(page)).toHaveValue(original);
  await notes(page).fill(updated);
  await save(page).click();
  await expect(page.getByText(updated, { exact: true })).toBeVisible();
  await expect(page.getByText(original, { exact: true })).toHaveCount(0);

  await action(page, 'Edit', title).click();
  await notes(page).clear();
  await save(page).click();
  await expect(titles(page)).toHaveText([title]);
  await expect(noteToggle(page, 'Show')).toHaveCount(0);
  await expect(taskRow(page, title).getByText('Note', { exact: true })).toHaveCount(0);
  await expect(page.getByText(updated, { exact: true })).toHaveCount(0);
});

test('16 Keep notes with their tasks after reload', async ({ page }) => {
  const title = 'QA packing';
  const other = 'QA errands';
  const note = 'Bring the spare charger.';
  await addWithNote(page, title, note);
  await add(page, other);
  await page.reload();
  await expect(titles(page)).toHaveText([other, title]);
  const rows = page.locator('[data-task-row]');
  await expect(rows.filter({ has: action(page, 'Edit', title) }).getByText(note, { exact: true })).toBeVisible();
  await expect(rows.filter({ has: action(page, 'Edit', other) }).getByRole('button', { name: 'Show note' })).toHaveCount(0);
  await action(page, 'Edit', title).click();
  await expect(notes(page)).toHaveValue(note);
});

test('17 Search note text case-insensitively', async ({ page }) => {
  await addWithNote(page, 'QA reservation', 'Ask for the Juniper room.');
  await addWithNote(page, 'QA supplies', 'Order more envelopes.');
  const search = page.getByRole('searchbox');
  await search.fill('jUNIPER');
  await expect(titles(page)).toHaveText(['QA reservation']);
  await search.clear();
  await expect(titles(page)).toHaveText(['QA supplies', 'QA reservation']);
});

test('18 Expand and collapse a multiline note', async ({ page }, info) => {
  const note = 'Confirm the room.\nPrint the handouts.\nBring the sign-in sheet.\nSend the recap.';
  await addWithNote(page, 'QA workshop', note);
  const preview = page.getByText(note, { exact: true });
  await expect(noteToggle(page, 'Show')).toHaveAttribute('aria-expanded', 'false');
  await expect(preview).toBeVisible();
  await expect(preview).toHaveCSS('-webkit-line-clamp', '2');
  const collapsedHeight = (await preview.boundingBox()).height;

  await noteToggle(page, 'Show').click();
  await expect(noteToggle(page, 'Hide')).toHaveAttribute('aria-expanded', 'true');
  await expect(preview).toHaveCSS('white-space', 'pre-wrap');
  expect(await preview.textContent()).toBe(note);
  await expect.poll(async () => (await preview.boundingBox()).height).toBeGreaterThan(collapsedHeight);
  await screenshot(page, info, 'desktop-notes-expanded');

  await noteToggle(page, 'Hide').click();
  await expect(noteToggle(page, 'Show')).toHaveAttribute('aria-expanded', 'false');
  await expect(preview).toHaveCSS('-webkit-line-clamp', '2');
});

test.describe('touch viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('19 Mobile note expands and collapses without horizontal overflow', async ({ page }, info) => {
    const note = 'Confirm the room.\nPrint the handouts.\nBring the sign-in sheet.';
    await addWithNote(page, 'QA mobile workshop', note);
    await expect(noteToggle(page, 'Show')).toHaveAttribute('aria-expanded', 'false');
    await noteToggle(page, 'Show').tap();
    await expect(noteToggle(page, 'Hide')).toHaveAttribute('aria-expanded', 'true');
    const preview = page.getByText(note, { exact: true });
    await expect(preview).toBeVisible();
    await expect(preview).toHaveCSS('white-space', 'pre-wrap');
    expect(await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })))
      .toEqual({ width: 390, scroll: 390 });
    await screenshot(page, info, 'mobile-notes-expanded');
    await noteToggle(page, 'Hide').tap();
    await expect(noteToggle(page, 'Show')).toHaveAttribute('aria-expanded', 'false');
    await expect(preview).toHaveCSS('-webkit-line-clamp', '2');
  });
});

test('20 Undo delete restores the note', async ({ page }) => {
  const title = 'QA restore';
  const note = 'Return the library books.';
  await addWithNote(page, title, note);
  await action(page, 'Delete', title).click();
  await expect(titles(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(titles(page)).toHaveText([title]);
  await expect(page.getByText(note, { exact: true })).toBeVisible();
});

test('21 Enter adds a note newline and Ctrl+Enter saves', async ({ page }) => {
  await add(page, 'QA keyboard notes');
  await action(page, 'Edit', 'QA keyboard notes').click();
  await expect(notes(page)).toHaveAccessibleName('Notes');
  await expect(notes(page)).toHaveAttribute('placeholder', 'Add a note…');
  await notes(page).fill('First line');
  await notes(page).press('End');
  await notes(page).press('Enter');
  await expect(notes(page)).toBeFocused();
  await expect(notes(page)).toHaveValue('First line\n');
  await notes(page).pressSequentially('Second line');
  await notes(page).press('Control+Enter');
  await expect(notes(page)).toHaveCount(0);
  await expect(page.getByText('First line\nSecond line', { exact: true })).toBeVisible();
});

test('22 Link HTTPS URLs and keep other schemes as text', async ({ page }) => {
  const url = 'https://example.com/guide';
  const script = 'javascript:alert(1)';
  const ftp = 'ftp://example.com/file';
  await addWithNote(page, 'QA links', [url, script, ftp].join('\n'));
  await noteToggle(page, 'Show').click();
  const row = page.locator('[data-task-row]');
  const link = row.getByRole('link', { name: url, exact: true });
  await expect(row.getByRole('link')).toHaveCount(1);
  await expect(link).toHaveAttribute('href', url);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(row).toContainText(script);
  await expect(row).toContainText(ftp);
});

const composerForm = page => page.getByRole('form', { name: 'Add a task' });
const taskRow = (page, title) => page.locator('[data-task-row]').filter({ has: action(page, 'Edit', title) });

async function expectNotePreview(page, title, note) {
  const row = taskRow(page, title);
  await expect(row.getByRole('button', { name: 'Show note', exact: true })
    .getByText('Note', { exact: true })).toBeVisible();
  const preview = row.getByText(note, { exact: true });
  await expect(preview).toBeVisible();
  expect(await preview.textContent()).toBe(note);
}

test('23 Create a task with a multiline composer note and reset the composer', async ({ page }, info) => {
  const title = 'QA planning';
  const note = 'Review the draft.\nShare it with the team.';
  const form = composerForm(page);
  const field = notes(form);
  const toggle = noteToggle(form, 'Add');

  await composer(form).fill(title);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(field).toHaveCount(0);
  await toggle.click();
  await expect(noteToggle(form, 'Hide')).toHaveAttribute('aria-expanded', 'true');
  await expect(field).toBeVisible();
  await expect(field).toHaveAttribute('placeholder', 'Add a note…');
  await field.fill('  ' + note + '  ');
  await screenshot(page, info, 'desktop-composer-notes-open');
  await form.getByRole('button', { name: 'Add task', exact: true }).click();

  await expect(titles(page)).toHaveText([title]);
  await expectNotePreview(page, title, note);
  await expect(field).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(composer(form)).toBeFocused();
  await toggle.click();
  await expect(field).toHaveValue('');
});

test('24 Persist a composer note after reload', async ({ page }) => {
  const title = 'QA travel';
  const note = 'Pack the adapter.\nPrint the itinerary.';
  const form = composerForm(page);
  await composer(form).fill(title);
  await noteToggle(form, 'Add').click();
  await notes(form).fill(note);
  await form.getByRole('button', { name: 'Add task', exact: true }).click();
  await expectNotePreview(page, title, note);

  await page.reload();
  await expect(titles(page)).toHaveText([title]);
  await expectNotePreview(page, title, note);
});

test('25 Enter adds a composer note newline and Ctrl+Enter creates the task', async ({ page }) => {
  const title = 'QA keyboard draft';
  const form = composerForm(page);
  const field = notes(form);
  await noteToggle(form, 'Add').click();
  await field.fill('First line');
  await field.press('Control+Enter');
  await expect(composer(form)).toBeFocused();
  await expect(titles(page)).toHaveCount(0);

  await composer(form).fill(title);
  await field.press('End');
  await field.press('Enter');
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('First line\n');
  await expect(titles(page)).toHaveCount(0);
  await field.pressSequentially('Second line');
  await field.press('Control+Enter');

  await expect(titles(page)).toHaveText([title]);
  await expectNotePreview(page, title, 'First line\nSecond line');
  await expect(field).toHaveCount(0);
});

test.describe('touch viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('26 Mobile creates a task with a composer note without horizontal overflow', async ({ page }, info) => {
    const title = 'QA mobile planning';
    const note = 'Confirm the room.\nPrint the agenda.';
    const form = composerForm(page);
    const layout = () => page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    await composer(form).fill(title);
    await noteToggle(form, 'Add').tap();
    await expect(notes(form)).toBeVisible();
    await notes(form).fill(note);
    expect(await layout()).toEqual({ width: 390, scroll: 390 });
    await screenshot(page, info, 'mobile-composer-notes-open');
    await form.getByRole('button', { name: 'Add', exact: true }).tap();

    await expect(titles(page)).toHaveText([title]);
    await expectNotePreview(page, title, note);
    await expect(notes(form)).toHaveCount(0);
    expect(await layout()).toEqual({ width: 390, scroll: 390 });
  });
});

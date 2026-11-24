import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

async function assertNoHorizontalOverflow(page: Page) {
  const dims = await page.evaluate(() => {
    const main = document.querySelector('main');
    const header = document.querySelector('header');
    const mainRect = main?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      mainWidth: mainRect ? Math.ceil(mainRect.width) : 0,
      headerWidth: headerRect ? Math.ceil(headerRect.width) : 0,
    };
  });
  expect(dims.scrollWidth).toBeLessThanOrEqual(dims.innerWidth);
  expect(dims.mainWidth).toBeLessThanOrEqual(dims.innerWidth);
  expect(dims.headerWidth).toBeLessThanOrEqual(dims.innerWidth);
}

function buildCleanUaeCsv(): string {
  return [
    'period_id,supplier_name,supplier_trn,tax_period_end,excess_credit_aed,unpaid_tax_aed,months_overdue,refund_claimed,docs_complete',
    '2025-Q3,Al Futtaim Industrial LLC,100456789100003,2025-09-30,0,0,0,true,true',
  ].join('\n');
}

test.describe('VAT129Check — UAE Decree-Law 16 & 17/2025 + Decision 129/2025 E2E', () => {
  test('defaults to AR RTL Dirham Vellum, toggles EN LTR Emirates Slate, and persists across reload', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('header')).toContainText('SQLite WAL');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dirham-vellum');
    await expect(
      page.getByRole('img', {
        name: 'مخطط مقارنة الغرامات الجديدة 129/2025 والنظام القديم ومهلة 2026-12-31',
      }),
    ).toBeVisible();
    await expect(page.locator('main')).toContainText('100/100');
    await expect(page.locator('main')).toContainText('ليست تابعة');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/01-workspace-ar-dirham-vellum.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('lang-toggle').click();
    await page.getByTestId('theme-toggle').click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'emirates-slate');
    await expect(page.locator('main')).toContainText('NOT affiliated');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/02-workspace-en-emirates-slate.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'emirates-slate');

    expect(errors).toEqual([]);
  });

  test('evaluates 2026-12-31 Credit Cliff conditional & remediates Preset 3 into sealed VAT-YYYY-0001 with BOM CSV & /r/:code', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const year = new Date().getUTCFullYear();
    const expectedCode = `VAT-${year}-0001`;

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByTestId('lang-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toContainText('100/100');

    // Preset 2: Abu Dhabi 2026-12-31 Credit Cliff (Conditional)
    await page.getByTestId('preset-abudhabi-2026-credit-cliff-conditional').click();
    await expect(page.getByTestId('status-badge')).toContainText('CONDITIONAL');
    await expect(page.locator('main')).toContainText('2026-12-31 (36d)');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/03-credit-cliff-conditional-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });

    // Preset 3: Sharjah Arrears, Post-Audit VD & CWE-1236 CSV (Blocked)
    await page.getByTestId('preset-sharjah-audit-penalty-and-cliff-blocked').click();
    await expect(page.getByTestId('status-badge')).toContainText('BLOCKED');
    await expect(page.locator('main')).toContainText('+84,000 AED Saved');

    // Remediate Preset 3 -> clean scope & penalties
    await page.getByLabel('Overdue Unpaid Principal VAT (AED)').fill('0');
    await page.getByLabel('Months Overdue').fill('0');
    await page.getByLabel('Voluntary Disclosure (VD) Timing').selectOption('none');
    await page.getByLabel('Voluntary Disclosure Tax Difference (AED)').fill('0');
    await page.getByLabel('Late VAT Return Administrative Tier').selectOption('none');
    await page.getByLabel('Tax Record-Keeping Violation Tier').selectOption('none');
    await page
      .getByLabel('Failure to furnish tax records in Arabic on request (AED 5,000 vs 20,000)')
      .uncheck();

    // Remediate 5-year cliff, RCM evidence, TRN vetting, and remaining 5 controls
    await page.getByTestId('tab-controls').click();
    await page
      .getByLabel('VAT311 refund claim or tax liability offset formally filed before cutoff')
      .check();
    await page
      .getByLabel('Foreign supplier invoices, UAE Customs Bayans & contracts retained')
      .check();
    await page
      .getByLabel('Domestic supplier 15-digit TRNs verified & commercial substance vetted')
      .check();

    for (const ctrlId of [
      'VAT129-CTRL-01',
      'VAT129-CTRL-02',
      'VAT129-CTRL-03',
      'VAT129-CTRL-04',
      'VAT129-CTRL-05',
    ]) {
      await page.locator('label', { hasText: ctrlId }).locator('input[type="checkbox"]').check();
    }

    // Replace injected CSV with clean UAE supplier ledger
    await page.getByTestId('tab-csv').click();
    await page.locator('textarea[dir="ltr"]').fill(buildCleanUaeCsv());

    await expect(page.getByTestId('status-badge')).toContainText('READY');
    await expect(page.locator('main')).toContainText('100/100');

    // Vault tab: create draft -> seal -> download raw BOM CSV -> screenshot
    await page.getByTestId('tab-vault').click();
    await page.getByTestId('create-dossier-btn').click();
    await expect(page.locator('main')).toContainText(expectedCode);

    await page.getByTestId('finalize-dossier-btn').click();
    await expect(page.getByTestId('finalize-dossier-btn')).toHaveCount(0);
    await expect(page.getByTestId('open-public-report-btn')).toBeVisible();

    const dlPromise = page.waitForEvent('download');
    await page.getByTestId('download-vault-csv-btn').click();
    const dl = await dlPromise;
    expect(dl.suggestedFilename()).toContain('.csv');
    const dlPath = await dl.path();
    expect(dlPath).toBeTruthy();
    if (dlPath) {
      const bytes = fs.readFileSync(dlPath);
      expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    }

    await page.screenshot({
      path: 'test-results/qa-screenshots/04-sealed-dossier-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });

    // Public report route /r/:code & persistent view counter across reload
    await page.getByTestId('open-public-report-btn').click();
    await expect(page.locator('body')).toContainText(expectedCode);
    await expect(page.locator('body')).toContainText('Al Majaz Cargo & Clearance Co. LLC');
    await expect(page.locator('body')).toContainText('Views: 1');

    await page.reload();
    await expect(page.locator('body')).toContainText(expectedCode);
    await expect(page.locator('body')).toContainText('Views: 2');

    expect(errors).toEqual([]);
  });

  test('verifies mobile 390x844 responsiveness in AR Dirham Vellum and EN Emirates Slate with zero overflow', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(
      page.getByRole('img', {
        name: 'مخطط مقارنة الغرامات الجديدة 129/2025 والنظام القديم ومهلة 2026-12-31',
      }),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/05-mobile-ar-dirham-vellum.png',
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByTestId('lang-toggle').click();
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'emirates-slate');
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: 'test-results/qa-screenshots/06-mobile-en-emirates-slate.png',
      fullPage: true,
      animations: 'disabled',
    });

    expect(errors).toEqual([]);
  });
});

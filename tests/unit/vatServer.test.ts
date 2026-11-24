import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app.mjs';
import {
  computePayloadDigest,
  VAT129_CONTROLS,
  VAT129_TOOL_VERSION,
} from '../../src/core/index.ts';

const activeServers: Array<{ close: () => Promise<void> }> = [];
const tempDirs: string[] = [];

function makeTempDir(prefix = 'vat129check-test-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function startTestApp(options: Parameters<typeof createApp>[0] = {}) {
  const dataDir = options.dataDir ?? makeTempDir();
  const app = createApp({
    basePath: '/vat129check',
    dataDir,
    ...options,
  });
  activeServers.push(app);
  const bound = await app.listen(0, '127.0.0.1');
  return { app, baseUrl: bound.url, rootUrl: `http://${bound.host}:${bound.port}` };
}

afterEach(async () => {
  while (activeServers.length > 0) {
    const srv = activeServers.pop()!;
    await srv.close();
  }
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('VAT129Check SQLite WAL HTTP Server (v0.2.0)', () => {
  it('serves /health, /readyz, BASE_PATH HTML injection, security headers, and /api/presets', async () => {
    const { baseUrl, rootUrl } = await startTestApp();

    const healthRes = await fetch(`${baseUrl}/health`);
    expect(healthRes.status).toBe(200);
    expect(healthRes.headers.get('x-content-type-options')).toBe('nosniff');
    expect(healthRes.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    const health = (await healthRes.json()) as {
      ok: boolean;
      service: string;
      version: string;
      basePath: string;
      db: { journalMode: string };
    };
    expect(health.ok).toBe(true);
    expect(health.service).toBe('vat129check');
    expect(health.version).toBe(VAT129_TOOL_VERSION);
    expect(health.basePath).toBe('/vat129check');
    expect(health.db.journalMode).toBe('wal');

    const apiHealthRes = await fetch(`${baseUrl}/api/health`);
    expect(apiHealthRes.status).toBe(200);

    const readyRes = await fetch(`${rootUrl}/readyz`);
    expect(readyRes.status).toBe(200);
    const ready = (await readyRes.json()) as { ready: boolean; journalMode: string };
    expect(ready.ready).toBe(true);
    expect(ready.journalMode).toBe('wal');

    const apiReadyRes = await fetch(`${baseUrl}/api/readyz`);
    expect(apiReadyRes.status).toBe(200);

    const htmlRes = await fetch(`${baseUrl}/`);
    expect(htmlRes.status).toBe(200);
    const html = await htmlRes.text();
    expect(html).toContain('window.__VAT129CHECK_BASE__="/vat129check"');

    const presetsRes = await fetch(`${baseUrl}/api/presets`);
    expect(presetsRes.status).toBe(200);
    const presetsJson = (await presetsRes.json()) as {
      ok: boolean;
      legalDisclaimerEn: string;
      legalDisclaimerAr: string;
      presets: Array<{ id: string }>;
    };
    expect(presetsJson.ok).toBe(true);
    expect(presetsJson.presets).toHaveLength(3);
    expect(presetsJson.legalDisclaimerEn).toContain('NOT affiliated');
    expect(presetsJson.legalDisclaimerAr).toContain('ليست تابعة');
  });

  it('evaluates /api/penalty, /api/credit-cliff, /api/audit-csv (CWE-1236 + BOM), and /api/assess', async () => {
    const { baseUrl } = await startTestApp();

    const penaltyRes = await fetch(`${baseUrl}/api/penalty`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ presetId: 'sharjah-audit-penalty-and-cliff-blocked' }),
    });
    expect(penaltyRes.status).toBe(200);
    const penaltyJson = (await penaltyRes.json()) as {
      penalty: {
        latePayment14PctAed: number;
        vdMonthly1PctAed: number;
        vdPostAudit15PctAed: number;
        newRegimeTotalAed: number;
        legacyRegimeTotalAed: number;
        netSavingsVsLegacyAed: number;
      };
    };
    expect(penaltyJson.penalty.latePayment14PctAed).toBe(12_600);
    expect(penaltyJson.penalty.vdMonthly1PctAed).toBe(7_200);
    expect(penaltyJson.penalty.vdPostAudit15PctAed).toBe(18_000);
    expect(penaltyJson.penalty.newRegimeTotalAed).toBe(43_800);
    expect(penaltyJson.penalty.legacyRegimeTotalAed).toBe(127_800);
    expect(penaltyJson.penalty.netSavingsVsLegacyAed).toBe(84_000);

    const cliffRes = await fetch(`${baseUrl}/api/credit-cliff`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ presetId: 'abudhabi-2026-credit-cliff-conditional' }),
    });
    expect(cliffRes.status).toBe(200);
    const cliffJson = (await cliffRes.json()) as {
      creditAndChain: {
        creditStatus: string;
        effectiveCliffDate: string;
        daysRemainingToCliff: number;
        transitional2026CliffApplies: boolean;
      };
    };
    expect(cliffJson.creditAndChain.creditStatus).toBe('urgent_cliff');
    expect(cliffJson.creditAndChain.effectiveCliffDate).toBe('2026-12-31');
    expect(cliffJson.creditAndChain.daysRemainingToCliff).toBe(36);
    expect(cliffJson.creditAndChain.transitional2026CliffApplies).toBe(true);

    const emptyCsvRes = await fetch(`${baseUrl}/api/audit-csv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ csv: '   ' }),
    });
    expect(emptyCsvRes.status).toBe(400);
    expect(((await emptyCsvRes.json()) as { error: string }).error).toBe('EMPTY_CSV');

    const badCsv = [
      'period_id,supplier_name,supplier_trn,tax_period_end,excess_credit_aed,unpaid_tax_aed,months_overdue,refund_claimed,docs_complete',
      '2021-Q4,=HYPERLINK("http://bad"),1009988,2021-10-31,95000,40000,6,false,false',
    ].join('\n');
    const csvRes = await fetch(`${baseUrl}/api/audit-csv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ csv: badCsv, assessmentDate: '2026-11-25' }),
    });
    expect(csvRes.status).toBe(200);
    const csvJson = (await csvRes.json()) as {
      audit: { blockedCount: number; invalidTrnCount: number };
      exportCsv: string;
    };
    expect(csvJson.audit.blockedCount).toBe(1);
    expect(csvJson.audit.invalidTrnCount).toBe(1);
    expect(csvJson.exportCsv.startsWith('\uFEFF')).toBe(true);
    expect(csvJson.exportCsv).toContain("'=HYPERLINK");

    const assessRes = await fetch(`${baseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ presetId: 'dubai-trading-post16-compliant-ready' }),
    });
    expect(assessRes.status).toBe(200);
    const assessJson = (await assessRes.json()) as {
      assessment: { status: string; readinessScore: number };
    };
    expect(assessJson.assessment.status).toBe('ready');
    expect(assessJson.assessment.readinessScore).toBe(100);
  });

  it('supports profiles CRUD, atomic VAT-YYYY-0001 numbering, search/filter, PATCH remediation, seal + 409 locks, duplicate/delete, briefs, BOM export, summary & public report views', async () => {
    const { baseUrl } = await startTestApp();
    const expectedYear = new Date().getUTCFullYear();
    const expectedCode1 = `VAT-${expectedYear}-0001`;
    const expectedCode2 = `VAT-${expectedYear}-0002`;

    // Profiles CRUD
    const profCreate = await fetch(`${baseUrl}/api/profiles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        organizationName: 'Emirates Gulf Freight LLC',
        trnNumber: '100334455600003',
        assessmentDate: '2026-11-25',
        appliesReverseCharge: true,
      }),
    });
    expect(profCreate.status).toBe(201);
    const { profile } = (await profCreate.json()) as { profile: { id: number } };

    const profList = await fetch(`${baseUrl}/api/profiles`);
    expect(profList.status).toBe(200);
    expect(((await profList.json()) as { total: number }).total).toBe(1);

    const profPatch = await fetch(`${baseUrl}/api/profiles/${profile.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes: 'UAE TRN verified' }),
    });
    expect(profPatch.status).toBe(200);

    // Create dossier #1 from profileId + Preset #3
    const createRes = await fetch(`${baseUrl}/api/dossiers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profileId: profile.id,
        presetId: 'sharjah-audit-penalty-and-cliff-blocked',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as {
      item: { dossierCode: string; status: string; lockedAt: string | null };
    };
    expect(created.item.dossierCode).toBe(expectedCode1);
    expect(created.item.status).toBe('blocked');
    expect(created.item.lockedAt).toBeNull();

    // Draft public report returns 404 before finalize
    const prePublicRes = await fetch(`${baseUrl}/api/public/reports/${expectedCode1}`);
    expect(prePublicRes.status).toBe(404);

    // Verify CWE-1236 UTF-8 BOM export.csv BEFORE remediation clears CSV
    const preCsvRes = await fetch(`${baseUrl}/api/dossiers/${expectedCode1}/export.csv`);
    expect(preCsvRes.status).toBe(200);
    const csvBytes = new Uint8Array(await preCsvRes.arrayBuffer());
    expect(csvBytes[0]).toBe(0xef);
    expect(csvBytes[1]).toBe(0xbb);
    expect(csvBytes[2]).toBe(0xbf);
    const csvText = new TextDecoder().decode(csvBytes);
    expect(csvText).toContain("'=HYPERLINK");

    // Search & filter list endpoint
    const listFiltered = await fetch(`${baseUrl}/api/assessments?status=blocked&q=100334455600003`);
    expect(listFiltered.status).toBe(200);
    expect(((await listFiltered.json()) as { total: number }).total).toBe(1);

    // Remediate gaps cleanly via PATCH
    const patchRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        unpaidTaxLiabilityAed: 0,
        monthsOverdue: 0,
        voluntaryDisclosureTiming: 'none',
        voluntaryDisclosureTaxDiffAed: 0,
        lateReturnOffenseTier: 'none',
        recordKeepingViolationTier: 'none',
        missingArabicRecords: false,
        hasSubmittedRefundOrOffset: true,
        hasCustomsAndSupplierDocs: true,
        vettedSupplierTrnsClean: true,
        ledgersCsv: null,
        implementedControls: VAT129_CONTROLS.map((c) => c.id),
      }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as {
      item: { status: string; readinessScore: number };
    };
    expect(patched.item.status).toBe('ready');
    expect(patched.item.readinessScore).toBe(100);

    // Finalize (seal) dossier & verify canonical SHA-256 digest
    const finalizeRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/finalize`, {
      method: 'POST',
    });
    expect(finalizeRes.status).toBe(200);
    const sealed = (await finalizeRes.json()) as {
      item: {
        dossierCode: string;
        lockedAt: string;
        publicSlug: string;
        canonicalText: string;
        dossierSha256: string;
      };
    };
    expect(sealed.item.lockedAt).toBeTruthy();
    expect(sealed.item.publicSlug).toMatch(/^vat129-[0-9a-f]{12}$/);
    const expectedDigest = await computePayloadDigest(sealed.item.canonicalText);
    expect(sealed.item.dossierSha256).toBe(expectedDigest);

    // Lock enforcement (409)
    const doubleLockRes = await fetch(`${baseUrl}/api/dossiers/${expectedCode1}/lock`, {
      method: 'POST',
    });
    expect(doubleLockRes.status).toBe(409);
    expect(((await doubleLockRes.json()) as { error: string }).error).toBe('ALREADY_LOCKED');

    const lockedPatchRes = await fetch(`${baseUrl}/api/dossiers/${expectedCode1}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Tamper Attempt' }),
    });
    expect(lockedPatchRes.status).toBe(409);
    expect(((await lockedPatchRes.json()) as { error: string }).error).toBe('DOSSIER_LOCKED');

    const lockedDeleteRes = await fetch(`${baseUrl}/api/dossiers/${expectedCode1}`, {
      method: 'DELETE',
    });
    expect(lockedDeleteRes.status).toBe(409);

    // Duplicate & delete copy
    const dupRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/duplicate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '2027 Renewal Copy' }),
    });
    expect(dupRes.status).toBe(201);
    const dupJson = (await dupRes.json()) as {
      item: { dossierCode: string; lockedAt: string | null };
    };
    expect(dupJson.item.dossierCode).toBe(expectedCode2);
    expect(dupJson.item.lockedAt).toBeNull();

    const delCopyRes = await fetch(`${baseUrl}/api/assessments/${expectedCode2}`, {
      method: 'DELETE',
    });
    expect(delCopyRes.status).toBe(200);

    // Bilingual briefs & summary
    const briefEnRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/brief.md?lang=en`);
    expect(briefEnRes.status).toBe(200);
    const briefEn = await briefEnRes.text();
    expect(briefEn).toContain(expectedCode1);
    expect(briefEn).toContain(sealed.item.dossierSha256);
    expect(briefEn).toContain('NOT affiliated');

    const briefArRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/brief.md?lang=ar`);
    expect(briefArRes.status).toBe(200);
    expect(await briefArRes.text()).toContain('ملف جاهزية تعديلات ضريبة القيمة المضافة الإماراتية');

    const summaryRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/summary?lang=en`);
    expect(summaryRes.status).toBe(200);
    const summaryJson = (await summaryRes.json()) as {
      dossierCode: string;
      status: string;
      readinessScore: number;
    };
    expect(summaryJson.dossierCode).toBe(expectedCode1);
    expect(summaryJson.status).toBe('ready');
    expect(summaryJson.readinessScore).toBe(100);

    // Fallback summary CSV with raw wire UTF-8 BOM (EF BB BF)
    const fallbackCsvRes = await fetch(`${baseUrl}/api/assessments/${expectedCode1}/export.csv`);
    expect(fallbackCsvRes.status).toBe(200);
    const fallbackBytes = new Uint8Array(await fallbackCsvRes.arrayBuffer());
    expect(fallbackBytes[0]).toBe(0xef);
    expect(fallbackBytes[1]).toBe(0xbb);
    expect(fallbackBytes[2]).toBe(0xbf);
    const fallbackText = new TextDecoder().decode(fallbackBytes);
    expect(fallbackText).toContain(expectedCode1);

    // Public report + incrementing view counter
    const pub1Res = await fetch(`${baseUrl}/api/public/reports/${sealed.item.publicSlug}`);
    expect(pub1Res.status).toBe(200);
    const pub1 = (await pub1Res.json()) as { viewCount: number; report: { dossierCode: string } };
    expect(pub1.viewCount).toBe(1);
    expect(pub1.report.dossierCode).toBe(expectedCode1);

    const pub2Res = await fetch(`${baseUrl}/api/public/reports/${expectedCode1}`);
    expect(pub2Res.status).toBe(200);
    expect(((await pub2Res.json()) as { viewCount: number }).viewCount).toBe(2);

    const profDel = await fetch(`${baseUrl}/api/profiles/${profile.id}`, { method: 'DELETE' });
    expect(profDel.status).toBe(200);
  });

  it('enforces 413 payload size cap, 429 rate limits (exempting /health), 400 validation & 404 unknown endpoints', async () => {
    const { baseUrl } = await startTestApp({
      maxBodyBytes: 256,
      rateLimitMax: 4,
      rateLimitWindowMs: 60_000,
    });

    const oversized = await fetch(`${baseUrl}/api/penalty`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ padding: 'x'.repeat(500) }),
    });
    expect(oversized.status).toBe(413);
    expect(((await oversized.json()) as { error: string }).error).toBe('PAYLOAD_TOO_LARGE');

    const badDate = await fetch(`${baseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ assessmentDate: '2026-02-31' }),
    });
    expect(badDate.status).toBe(400);
    expect(((await badDate.json()) as { error: string }).error).toBe('VALIDATION_ERROR');

    const badEnum = await fetch(`${baseUrl}/api/assess`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ voluntaryDisclosureTiming: 'invalid_tier' }),
    });
    expect(badEnum.status).toBe(400);

    const unknownApi = await fetch(`${baseUrl}/api/nonexistent`);
    expect(unknownApi.status).toBe(404);
    expect(((await unknownApi.json()) as { error: string }).error).toBe('API_NOT_FOUND');

    // Rate limit already consumed 3 /api/* calls above -> next /api/* returns 429
    const limited = await fetch(`${baseUrl}/api/presets`);
    expect(limited.status).toBe(429);
    expect(((await limited.json()) as { error: string }).error).toBe('RATE_LIMITED');

    // Health routes stay exempt from rate limits
    expect((await fetch(`${baseUrl}/health`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/health`)).status).toBe(200);
  });
});

import { describe, expect, it } from 'vitest';
import {
  VAT129_CONTROLS,
  VAT129_PRESETS,
  addFiveYearsIso,
  assessVat129Readiness,
  auditVatLedgersCsv,
  computePayloadDigest,
  evaluateCreditAndSupplyChain,
  evaluatePenaltyOverhaul,
  exportVatAuditCsv,
  isValidUaeTrn,
  sanitizeCsvCell,
} from '../../src/core/index.ts';

describe('VAT129Check core (UAE Decree-Law 16 & 17/2025 + Cabinet Decision 129/2025)', () => {
  it('exposes 6 UAE VAT controls and explicit non-FTA independence disclaimers', async () => {
    expect(VAT129_CONTROLS).toHaveLength(6);
    const ready = await assessVat129Readiness(VAT129_PRESETS[0]!.input);
    expect(ready.toolName).toBe('VAT129Check');
    expect(ready.legalDisclaimerEn).toContain('NOT affiliated');
    expect(ready.legalDisclaimerAr).toContain('ليست تابعة');
  });

  it('scores Preset 1 Dubai Trading SME as ready 100/100 under post-16/2025 RCM docs rule', async () => {
    const res = await assessVat129Readiness(VAT129_PRESETS[0]!.input);
    expect(res.status).toBe('ready');
    expect(res.readinessScore).toBe(100);
    expect(res.creditAndChain.trnValidFormat).toBe(true);
    expect(res.creditAndChain.creditStatus).toBe('protected');
    expect(res.creditAndChain.selfInvoicingExempted).toBe(true);
    expect(res.creditAndChain.reverseChargeCompliant).toBe(true);
  });

  it('scores Preset 2 Abu Dhabi Industrial credit approaching Dec 31, 2026 cutoff as conditional', async () => {
    const res = await assessVat129Readiness(VAT129_PRESETS[1]!.input);
    expect(res.status).toBe('conditional');
    expect(res.creditAndChain.creditStatus).toBe('urgent_cliff');
    expect(res.creditAndChain.transitional2026CliffApplies).toBe(true);
    expect(res.creditAndChain.effectiveCliffDate).toBe('2026-12-31');
    expect(res.creditAndChain.daysRemainingToCliff).toBe(36);
    expect(res.penalty.vdMonthly1PctAed).toBe(2_400);
    expect(res.penalty.vdPostAudit15PctAed).toBe(0);
    expect(res.penalty.netSavingsVsLegacyAed).toBe(600);
  });

  it('calculates Preset 3 14% annual, 15%+1% post-audit VD, legacy savings & CWE-1236 CSV blocks', async () => {
    const res = await assessVat129Readiness(VAT129_PRESETS[2]!.input);
    expect(res.status).toBe('blocked');
    expect(res.penalty.latePayment14PctAed).toBe(12_600);
    expect(res.penalty.vdMonthly1PctAed).toBe(7_200);
    expect(res.penalty.vdPostAudit15PctAed).toBe(18_000);
    expect(res.penalty.fixedAdministrativeAed).toBe(6_000);
    expect(res.penalty.newRegimeTotalAed).toBe(43_800);
    expect(res.penalty.legacyRegimeTotalAed).toBe(127_800);
    expect(res.penalty.netSavingsVsLegacyAed).toBe(84_000);

    expect(res.csvAudit?.totalRows).toBe(3);
    expect(res.csvAudit?.blockedCount).toBe(1);
    expect(res.csvAudit?.invalidTrnCount).toBe(1);
    expect(res.csvAudit?.totalCreditAtRiskAed).toBe(95_000);
  });

  it('marks unclaimed historical VAT credit as forfeited once past Dec 31, 2026 cliff', () => {
    const afterCliff = evaluateCreditAndSupplyChain({
      ...VAT129_PRESETS[1]!.input,
      assessmentDate: '2027-01-01',
      hasSubmittedRefundOrOffset: false,
    });
    expect(afterCliff.creditAndChain.creditStatus).toBe('forfeited');
    expect(afterCliff.creditAndChain.daysRemainingToCliff).toBe(-1);
    expect(
      afterCliff.findings.some((f) => f.code === 'VAT129-FIVE-YEAR-CREDIT-FORFEITED'),
    ).toBe(true);
  });

  it('handles 5-year leap day expiry, UAE TRN pattern, zero-diff error waiver & unbounded 14% flag', () => {
    expect(addFiveYearsIso('2024-02-29')).toBe('2029-02-28');
    expect(isValidUaeTrn('100456789100003')).toBe(true);
    expect(isValidUaeTrn('200456789100003')).toBe(false);
    expect(isValidUaeTrn('100123')).toBe(false);

    const zeroDiff = evaluatePenaltyOverhaul({
      ...VAT129_PRESETS[2]!.input,
      unpaidTaxLiabilityAed: 100_000,
      monthsOverdue: 24,
      zeroTaxDifferenceErrorOnly: true,
    });
    expect(zeroDiff.penalty.vdMonthly1PctAed).toBe(0);
    expect(zeroDiff.penalty.vdPostAudit15PctAed).toBe(0);
    expect(zeroDiff.penalty.latePayment14PctAed).toBe(28_000);
    expect(zeroDiff.penalty.unboundedAnnualExposureRisk).toBe(true);
  });

  it('neutralizes CWE-1236 spreadsheet formula prefixes and emits UTF-8 BOM in CSV exports', () => {
    expect(sanitizeCsvCell('=1+1')).toBe("'=1+1");
    expect(sanitizeCsvCell('=HYPERLINK("http://bad")')).toBe('"\'=HYPERLINK(""http://bad"")"');
    const summary = auditVatLedgersCsv(VAT129_PRESETS[2]!.input.ledgersCsv!, '2026-11-25');
    const csv = exportVatAuditCsv(summary);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain("'=HYPERLINK");
  });

  it('produces reproducible canonical payload SHA-256 digests', async () => {
    const res1 = await assessVat129Readiness(VAT129_PRESETS[0]!.input);
    const res2 = await assessVat129Readiness(VAT129_PRESETS[0]!.input);
    expect(res1.dossierSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(res1.dossierSha256).toBe(res2.dossierSha256);
    expect(await computePayloadDigest(res1.canonicalDossierText)).toBe(res1.dossierSha256);
  });
});

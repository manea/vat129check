import { canonicalizeDossierPayload, computePayloadDigest } from './dossierDigest.ts';
import { evaluateCreditAndSupplyChain } from './fiveYearCreditEngine.ts';
import { evaluatePenaltyOverhaul } from './penaltyEngine.ts';
import { auditVatLedgersCsv } from './portfolioCsvAuditor.ts';
import {
  LEGAL_DISCLAIMER_AR,
  LEGAL_DISCLAIMER_EN,
  VAT129_CONTROLS,
  VAT129_TOOL_VERSION,
} from './vatCatalog.ts';
import type {
  AssessmentInput,
  AssessmentResult,
  ControlEvaluationItem,
  FindingItem,
  ReadinessStatus,
} from './types.ts';

export async function assessVat129Readiness(
  input: AssessmentInput,
): Promise<AssessmentResult> {
  const penaltyEval = evaluatePenaltyOverhaul(input);
  const creditEval = evaluateCreditAndSupplyChain(input);
  const csvAudit =
    input.ledgersCsv && input.ledgersCsv.trim()
      ? auditVatLedgersCsv(input.ledgersCsv, input.assessmentDate)
      : null;

  const findings: FindingItem[] = [...penaltyEval.findings, ...creditEval.findings];

  if (csvAudit) {
    if (csvAudit.parseErrors.length > 0) {
      findings.push({
        code: 'VAT129-CSV-PARSE-ERROR',
        severity: 'warning',
        titleEn: 'VAT Ledger CSV Parse Issue',
        titleAr: 'مشكلة في قراءة ملف CSV الضريبي',
        detailEn: csvAudit.parseErrors.join(' '),
        detailAr: csvAudit.parseErrors.join(' '),
        legalRef: 'FTA Return & Ledger Integrity',
      });
    } else if (csvAudit.blockedCount > 0) {
      findings.push({
        code: 'VAT129-CSV-LEDGER-BLOCKERS',
        severity: 'blocker',
        titleEn: `${csvAudit.blockedCount} Supplier/Period Ledger Row(s) Flagged`,
        titleAr: `رصد ${csvAudit.blockedCount} صفوف مخالفة في كشف الفترات والموردين`,
        detailEn: `Batch CSV flagged ${csvAudit.blockedCount} blocked row(s), ${csvAudit.invalidTrnCount} invalid TRN(s), and AED ${csvAudit.totalCreditAtRiskAed.toLocaleString('en-US')} in credits facing expiry.`,
        detailAr: `كشف التدقيق ${csvAudit.blockedCount} صفاً محجوباً، و${csvAudit.invalidTrnCount} رقم ضريبي غير صالح، وأرصدة بقيمة ${csvAudit.totalCreditAtRiskAed.toLocaleString('en-US')} د.إ معرضة للسقوط.`,
        legalRef: 'Federal Decree-Law 16/2025 & Cabinet Decision 129/2025',
      });
    } else if (csvAudit.conditionalCount > 0) {
      findings.push({
        code: 'VAT129-CSV-LEDGER-CONDITIONAL',
        severity: 'warning',
        titleEn: `${csvAudit.conditionalCount} Period Row(s) Approaching 5-Year Credit Cliff`,
        titleAr: `${csvAudit.conditionalCount} فترات تقترب من سقوط مهلة الـ 5 سنوات`,
        detailEn: `AED ${csvAudit.totalCreditAtRiskAed.toLocaleString('en-US')} in excess credits requires VAT311 filing prior to deadline.`,
        detailAr: `تتطلب أرصدة بقيمة ${csvAudit.totalCreditAtRiskAed.toLocaleString('en-US')} د.إ تقديم استرداد VAT311 قبل انتهاء المهلة.`,
        legalRef: 'Federal Decree-Law No. 16 of 2025 (2026-12-31 Cliff)',
      });
    }
  }

  const implementedSet = new Set(input.implementedControls);
  const controls: ControlEvaluationItem[] = VAT129_CONTROLS.map((spec) => ({
    id: spec.id,
    titleEn: spec.titleEn,
    titleAr: spec.titleAr,
    implemented: implementedSet.has(spec.id),
    weight: spec.weight,
  }));

  const controlsScore = controls.reduce(
    (sum, c) => (c.implemented ? sum + c.weight : sum),
    0,
  );

  let deduction = 0;
  if (
    penaltyEval.penalty.latePayment14PctAed > 0 ||
    penaltyEval.penalty.vdPostAudit15PctAed > 0 ||
    penaltyEval.penalty.fixedAdministrativeAed > 0
  ) {
    deduction += 15;
  } else if (penaltyEval.penalty.newRegimeTotalAed > 0) {
    deduction += 5;
  }
  if (creditEval.creditAndChain.creditStatus === 'forfeited') deduction += 25;
  else if (creditEval.creditAndChain.creditStatus === 'urgent_cliff') deduction += 10;
  if (!creditEval.creditAndChain.reverseChargeCompliant) deduction += 15;
  if (!creditEval.creditAndChain.supplyChainVettingCompliant) deduction += 15;
  if (csvAudit && csvAudit.blockedCount > 0) deduction += 15;

  const readinessScore = Math.max(0, Math.min(100, controlsScore - deduction));

  const hasBlocker = findings.some((f) => f.severity === 'blocker');
  const hasWarning = findings.some((f) => f.severity === 'warning');

  let status: ReadinessStatus;
  if (hasBlocker || readinessScore < 65) {
    status = 'blocked';
  } else if (hasWarning || readinessScore < 90) {
    status = 'conditional';
  } else {
    status = 'ready';
  }

  const canonicalDossierText = canonicalizeDossierPayload({
    toolName: 'VAT129Check',
    version: VAT129_TOOL_VERSION,
    organizationName: input.organizationName,
    trnNumber: input.trnNumber,
    assessmentDate: input.assessmentDate,
    penalty: penaltyEval.penalty,
    creditAndChain: creditEval.creditAndChain,
    status,
    readinessScore,
    implementedControls: [...input.implementedControls].sort(),
  });
  const dossierSha256 = await computePayloadDigest(canonicalDossierText);

  return {
    toolName: 'VAT129Check',
    version: VAT129_TOOL_VERSION,
    legalDisclaimerEn: LEGAL_DISCLAIMER_EN,
    legalDisclaimerAr: LEGAL_DISCLAIMER_AR,
    organizationName: input.organizationName,
    trnNumber: input.trnNumber,
    assessmentDate: input.assessmentDate,
    penalty: penaltyEval.penalty,
    creditAndChain: creditEval.creditAndChain,
    csvAudit,
    status,
    readinessScore,
    controls,
    findings,
    canonicalDossierText,
    dossierSha256,
  };
}

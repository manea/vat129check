import { UAE_TRANSITIONAL_CREDIT_CLIFF_DATE } from './vatCatalog.ts';
import type {
  AssessmentInput,
  CreditAndChainResult,
  CreditCliffStatus,
  FindingItem,
} from './types.ts';

const MS_PER_DAY = 86_400_000;
const UAE_TRN_REGEX = /^100\d{12}$/;

function parseUtcDate(iso: string): Date | null {
  const trimmed = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parts = trimmed.split('-').map(Number);
  const dt = new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function formatUtcIso(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

export function addFiveYearsIso(periodEndIso: string): string {
  const trimmed = periodEndIso.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return UAE_TRANSITIONAL_CREDIT_CLIFF_DATE;
  const targetYear = Number(match[1]) + 5;
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Handle Feb 29 -> Feb 28 on non-leap year 5 years later
  const candidate = new Date(Date.UTC(targetYear, month - 1, day));
  if (candidate.getUTCMonth() !== month - 1) {
    return `${targetYear}-02-28`;
  }
  return formatUtcIso(candidate);
}

export function diffDaysUtc(fromIso: string, toIso: string): number {
  const from = parseUtcDate(fromIso);
  const to = parseUtcDate(toIso);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function isValidUaeTrn(trn: string): boolean {
  return UAE_TRN_REGEX.test(trn.trim());
}

export function evaluateCreditAndSupplyChain(input: AssessmentInput): {
  creditAndChain: CreditAndChainResult;
  findings: FindingItem[];
} {
  const trnValidFormat = isValidUaeTrn(input.trnNumber);
  const balance = Math.max(0, Number(input.excessCreditBalanceAed) || 0);
  const standardFiveYearExpiryDate = addFiveYearsIso(input.excessCreditPeriodEndDate);

  // Under Decree-Law No. 16/2025, older 5y credit balances whose standard expiry fell before 2026-12-31 receive transitional grace until 2026-12-31
  const transitional2026CliffApplies =
    balance > 0 && standardFiveYearExpiryDate <= UAE_TRANSITIONAL_CREDIT_CLIFF_DATE;
  const effectiveCliffDate = transitional2026CliffApplies
    ? UAE_TRANSITIONAL_CREDIT_CLIFF_DATE
    : standardFiveYearExpiryDate;

  const daysRemainingToCliff =
    balance > 0 ? diffDaysUtc(input.assessmentDate, effectiveCliffDate) : 0;

  let creditStatus: CreditCliffStatus;
  if (balance === 0) {
    creditStatus = 'none';
  } else if (input.hasSubmittedRefundOrOffset) {
    creditStatus = 'protected';
  } else if (daysRemainingToCliff < 0) {
    creditStatus = 'forfeited';
  } else if (daysRemainingToCliff <= 90) {
    creditStatus = 'urgent_cliff';
  } else {
    creditStatus = 'safe';
  }

  const selfInvoicingExempted = input.appliesReverseCharge;
  const reverseChargeCompliant =
    !input.appliesReverseCharge || input.hasCustomsAndSupplierDocs;
  const supplyChainVettingCompliant = input.vettedSupplierTrnsClean;

  const findings: FindingItem[] = [];

  if (!trnValidFormat) {
    findings.push({
      code: 'VAT129-INVALID-UAE-TRN',
      severity: 'warning',
      titleEn: 'UAE TRN Must Contain 15 Digits Starting With 100',
      titleAr: 'الرقم الضريبي الإماراتي يجب أن يتكون من 15 خانة تبدأ بـ 100',
      detailEn: `Declared TRN "${input.trnNumber}" does not match the FTA 15-digit pattern (100xxxxxxxxxxxx).`,
      detailAr: `الرقم الضريبي المُدخل "${input.trnNumber}" لا يطابق الصيغة الرسمية من 15 خانة تبدأ بـ 100.`,
      legalRef: 'UAE FTA Tax Registration Number Format',
    });
  }

  if (creditStatus === 'forfeited') {
    findings.push({
      code: 'VAT129-FIVE-YEAR-CREDIT-FORFEITED',
      severity: 'blocker',
      titleEn: 'Recoverable Excess VAT Credit Expired Beyond 5-Year Limitation',
      titleAr: 'سقوط حق استرداد الرصيد الضريبي لتجاوز مهلة الخمس سنوات',
      detailEn: `Unclaimed excess VAT balance of AED ${balance.toLocaleString('en-US')} missed its cutoff date (${effectiveCliffDate}). Without an approved refund/offset filed in time, the credit lapses permanently.`,
      detailAr: `الرصيد الضريبي البالغ ${balance.toLocaleString('en-US')} د.إ تجاوز الموعد النهائي (${effectiveCliffDate}) دون طلب استرداد أو تسوية، مما يعرضه للسقوط الدائم.`,
      legalRef: 'Federal Decree-Law No. 16 of 2025 (Amended VAT Art. 74)',
    });
  } else if (creditStatus === 'urgent_cliff') {
    findings.push({
      code: 'VAT129-TRANSITIONAL-2026-CLIFF-URGENT',
      severity: daysRemainingToCliff <= 14 ? 'blocker' : 'warning',
      titleEn: `Urgent ${daysRemainingToCliff}-Day Window Remaining Before Credit Expiry (${effectiveCliffDate})`,
      titleAr: `مهلة حرجة: متبقٍ ${daysRemainingToCliff} يوماً فقط قبل سقوط الرصيد (${effectiveCliffDate})`,
      detailEn: `AED ${balance.toLocaleString('en-US')} excess recoverable credit (period ending ${input.excessCreditPeriodEndDate}) hits ${transitional2026CliffApplies ? 'the Dec 31, 2026 transitional cutoff' : 'its 5-year statutory limit'} in ${daysRemainingToCliff} day(s). Submit VAT311 refund or offset immediately.`,
      detailAr: `رصيد فائض بقيمة ${balance.toLocaleString('en-US')} د.إ (فترة منتهية في ${input.excessCreditPeriodEndDate}) ينتهي خلال ${daysRemainingToCliff} يوماً في ${effectiveCliffDate}. بادر بطلب استرداد VAT311 فوراً.`,
      legalRef: 'Federal Decree-Law No. 16/2025 & Transitional 2026-12-31 Grace',
    });
  } else if (creditStatus === 'protected') {
    findings.push({
      code: 'VAT129-CREDIT-PROTECTED',
      severity: 'info',
      titleEn: 'Excess Recoverable VAT Credit Safeguarded via Timely Refund/Offset Filing',
      titleAr: 'رصيد الاسترداد الضريبي محمي بتقديم طلب استرداد أو مقاصة في الموعد',
      detailEn: `AED ${balance.toLocaleString('en-US')} balance is marked as submitted/offset prior to ${effectiveCliffDate}. Retain EmaraTax acknowledgement receipts for 5 years.`,
      detailAr: `الرصيد البالغ ${balance.toLocaleString('en-US')} د.إ مؤمّن بتقديم طلب استرداد/مقاصة قبل ${effectiveCliffDate}؛ احفظ إيصال إمارات تاكس لـ 5 سنوات.`,
      legalRef: 'Federal Decree-Law No. 16 & 17 of 2025',
    });
  }

  if (input.appliesReverseCharge) {
    if (!input.hasCustomsAndSupplierDocs) {
      findings.push({
        code: 'VAT129-RCM-MISSING-SUPPORT-DOCS',
        severity: 'blocker',
        titleEn: 'Reverse Charge Input Recovery Lacks Supplier Invoices / Customs Bayans',
        titleAr: 'نقص مستندات الموردين والبيان الجمركي للاحتساب العكسي',
        detailEn:
          'Decree-Law 16/2025 removed RCM self-invoicing, but input VAT recovery is disallowed unless foreign supplier invoices, customs declarations, and contracts are archived.',
        detailAr:
          'رغم إلغاء الفاتورة الذاتية في 16/2025، يُشترط لخصم الضريبة الاحتفاظ بفواتير الموردين الأجانب والبيانات الجمركية والعقود.',
        legalRef: 'Federal Decree-Law No. 16 of 2025 (RCM Self-Invoice Abolition)',
      });
    } else {
      findings.push({
        code: 'VAT129-RCM-NO-SELF-INVOICE-NEEDED',
        severity: 'info',
        titleEn: 'Reverse Charge Self-Invoicing No Longer Required (Docs Verified)',
        titleAr: 'الاحتساب العكسي متوافق مع إلغاء الفاتورة الذاتية (المستندات مكتملة)',
        detailEn:
          'Supplier commercial invoices, customs documentation, and contracts satisfy post-Jan-2026 RCM evidence rules without issuing self-generated tax invoices.',
        detailAr:
          'وجود فواتير المورد والبيانات الجمركية والعقود يغني نظامياً عن إصدار الفاتورة الضريبية الذاتية منذ يناير 2026.',
        legalRef: 'Federal Decree-Law No. 16 of 2025',
      });
    }
  }

  if (!input.vettedSupplierTrnsClean) {
    findings.push({
      code: 'VAT129-SUPPLY-CHAIN-EVASION-RISK',
      severity: 'blocker',
      titleEn: 'Unvetted Supplier TRN / Chain Integrity Risk ("Should Have Known")',
      titleAr: 'مخاطرة سلسلة الموردين وفق معيار «كان ينبغي أن يعلم»',
      detailEn:
        'Amended VAT rules authorize FTA disallowance of input VAT where a transaction connects to a tax evasion chain that the taxable person should have identified.',
      detailAr:
        'تخول التعديلات للهيئة رفض استرداد ضريبة المدخلات إذا ارتبطت المعاملة بسلسلة تهرب ضريبي كان ينبغي التحقق من مورديها مسبقاً.',
      legalRef: 'Federal Decree-Law No. 16 of 2025 (Input Tax Anti-Evasion Clause)',
    });
  }

  return {
    creditAndChain: {
      trnValidFormat,
      creditStatus,
      standardFiveYearExpiryDate,
      effectiveCliffDate,
      daysRemainingToCliff,
      transitional2026CliffApplies,
      selfInvoicingExempted,
      reverseChargeCompliant,
      supplyChainVettingCompliant,
    },
    findings,
  };
}

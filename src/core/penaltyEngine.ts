import {
  DECISION_129_ANNUAL_LATE_RATE,
  DECISION_129_POST_AUDIT_VD_RATE,
  DECISION_129_VD_MONTHLY_RATE,
  LATE_RETURN_FIRST_AED,
  LATE_RETURN_REPEAT_AED,
  MISSING_ARABIC_RECORDS_LEGACY_AED,
  MISSING_ARABIC_RECORDS_NEW_AED,
  RECORD_KEEPING_FIRST_AED,
  RECORD_KEEPING_REPEAT_AED,
} from './vatCatalog.ts';
import type {
  AssessmentInput,
  FindingItem,
  PenaltyEvaluationResult,
} from './types.ts';

function roundAed(val: number): number {
  return Math.round(val * 100) / 100;
}

export function evaluatePenaltyOverhaul(input: AssessmentInput): {
  penalty: PenaltyEvaluationResult;
  findings: FindingItem[];
} {
  const unpaidTax = Math.max(0, Number(input.unpaidTaxLiabilityAed) || 0);
  const months = Math.max(0, Number(input.monthsOverdue) || 0);
  const vdDiff = Math.max(0, Number(input.voluntaryDisclosureTaxDiffAed) || 0);

  // Cabinet Decision No. 129 of 2025 (effective 2026-04-14): flat 14% p.a. (~1.1667%/month) without 300% ceiling
  const latePayment14PctAed = roundAed(
    unpaidTax * DECISION_129_ANNUAL_LATE_RATE * (months / 12),
  );

  let vdMonthly1PctAed = 0;
  let vdPostAudit15PctAed = 0;
  if (input.voluntaryDisclosureTiming !== 'none' && vdDiff > 0 && !input.zeroTaxDifferenceErrorOnly) {
    vdMonthly1PctAed = roundAed(vdDiff * DECISION_129_VD_MONTHLY_RATE * months);
    if (input.voluntaryDisclosureTiming === 'post_audit') {
      vdPostAudit15PctAed = roundAed(vdDiff * DECISION_129_POST_AUDIT_VD_RATE);
    }
  }

  let fixedAdministrativeAed = 0;
  if (input.lateReturnOffenseTier === 'first_offense') {
    fixedAdministrativeAed += LATE_RETURN_FIRST_AED;
  } else if (input.lateReturnOffenseTier === 'repeat_within_24m') {
    fixedAdministrativeAed += LATE_RETURN_REPEAT_AED;
  }

  if (input.recordKeepingViolationTier === 'first_offense') {
    fixedAdministrativeAed += RECORD_KEEPING_FIRST_AED;
  } else if (input.recordKeepingViolationTier === 'repeat') {
    fixedAdministrativeAed += RECORD_KEEPING_REPEAT_AED;
  }

  if (input.missingArabicRecords) {
    fixedAdministrativeAed += MISSING_ARABIC_RECORDS_NEW_AED;
  }

  const newRegimeTotalAed = roundAed(
    latePayment14PctAed + vdMonthly1PctAed + vdPostAudit15PctAed + fixedAdministrativeAed,
  );

  // Legacy Cabinet Decision No. 40/2017 & 49/2021 comparator: 2% + 4% monthly (up to 300%), VD 5%/50%, Arabic AED 20k
  const legacyLatePaymentAed =
    unpaidTax > 0 && months > 0
      ? roundAed(Math.min(unpaidTax * 3, unpaidTax * (0.02 + 0.04 * months)))
      : 0;

  let legacyVdAed = 0;
  if (input.voluntaryDisclosureTiming === 'pre_audit' && vdDiff > 0) {
    legacyVdAed = roundAed(vdDiff * 0.05);
  } else if (input.voluntaryDisclosureTiming === 'post_audit' && vdDiff > 0) {
    legacyVdAed = roundAed(vdDiff * 0.5);
  }

  const legacyFixedAdmin =
    (input.lateReturnOffenseTier === 'first_offense'
      ? LATE_RETURN_FIRST_AED
      : input.lateReturnOffenseTier === 'repeat_within_24m'
        ? LATE_RETURN_REPEAT_AED
        : 0) +
    (input.recordKeepingViolationTier === 'first_offense'
      ? RECORD_KEEPING_FIRST_AED
      : input.recordKeepingViolationTier === 'repeat'
        ? RECORD_KEEPING_REPEAT_AED
        : 0) +
    (input.missingArabicRecords ? MISSING_ARABIC_RECORDS_LEGACY_AED : 0);

  const legacyFixedAndVdAed = roundAed(legacyVdAed + legacyFixedAdmin);
  const legacyRegimeTotalAed = roundAed(legacyLatePaymentAed + legacyFixedAndVdAed);
  const netSavingsVsLegacyAed = roundAed(legacyRegimeTotalAed - newRegimeTotalAed);
  const unboundedAnnualExposureRisk = unpaidTax > 0 && months >= 12;

  const findings: FindingItem[] = [];

  if (unpaidTax > 0 && months > 0) {
    findings.push({
      code: 'VAT129-LATE-PAYMENT-14PCT',
      severity: months >= 6 ? 'blocker' : 'warning',
      titleEn: '14% Annual Late-Payment Accrual Active (Cabinet Decision 129/2025)',
      titleAr: 'سريان غرامة التأخر الثابتة 14% سنوياً (قرار 129/2025)',
      detailEn: `Unpaid tax of AED ${unpaidTax.toLocaleString('en-US')} over ${months} month(s) accrues AED ${latePayment14PctAed.toLocaleString('en-US')} under Decision 129/2025 (vs. AED ${legacyLatePaymentAed.toLocaleString('en-US')} legacy 2%+4%). Note: 14% p.a. accrues continuously without a 300% cap.`,
      detailAr: `الضريبة غير المسددة البالغة ${unpaidTax.toLocaleString('en-US')} د.إ لمدة ${months} شهر تُراكم ${latePayment14PctAed.toLocaleString('en-US')} د.إ بمعدل 14% سنوياً دون سقف 300% (مقارنة بـ ${legacyLatePaymentAed.toLocaleString('en-US')} د.إ بالنظام القديم).`,
      legalRef: 'UAE Cabinet Decision No. 129 of 2025 (Effective 2026-04-14)',
    });
  }

  if (input.voluntaryDisclosureTiming === 'post_audit' && vdDiff > 0) {
    findings.push({
      code: 'VAT129-POST-AUDIT-VD-15PCT',
      severity: 'blocker',
      titleEn: 'Post-Audit Notification Disclosure Incurs 15% Surcharge + 1%/Month',
      titleAr: 'الإفصاح الطوعي بعد إشعار التدقيق يفرض 15% + 1% شهرياً',
      detailEn: `Disclosing AED ${vdDiff.toLocaleString('en-US')} after FTA audit notice adds a 15% fixed charge (AED ${vdPostAudit15PctAed.toLocaleString('en-US')}) plus 1%/month (AED ${vdMonthly1PctAed.toLocaleString('en-US')}). File proactively before audit notification to pay only 1%/month.`,
      detailAr: `تقديم الإفصاح الطوعي بمبلغ ${vdDiff.toLocaleString('en-US')} د.إ بعد إشعار التدقيق يفرض 15% مقطوعة (${vdPostAudit15PctAed.toLocaleString('en-US')} د.إ) مع 1% شهرياً؛ قدّمه استباقياً قبل التدقيق.`,
      legalRef: 'Cabinet Decision No. 129 of 2025 — Voluntary Disclosure Tiers',
    });
  } else if (input.voluntaryDisclosureTiming === 'pre_audit' && vdDiff > 0) {
    findings.push({
      code: 'VAT129-PRE-AUDIT-VD-1PCT',
      severity: 'warning',
      titleEn: 'Pre-Audit Voluntary Disclosure Qualifies for Flat 1%/Month Tier',
      titleAr: 'الإفصاح الطوعي الاستباقي يخضع لمعدل 1% شهرياً دون غرامة 15%',
      detailEn: `Proactive disclosure of AED ${vdDiff.toLocaleString('en-US')} before FTA audit notice attracts 1%/month (${vdMonthly1PctAed.toLocaleString('en-US')} AED) instead of 15% post-audit surcharge.`,
      detailAr: `الإفصاح الاستباقي قبل إشعار التدقيق يقتصر على 1% شهرياً (${vdMonthly1PctAed.toLocaleString('en-US')} د.إ) مع تجنّب نسبة الـ 15% المقطوعة.`,
      legalRef: 'Cabinet Decision No. 129 of 2025',
    });
  }

  if (input.zeroTaxDifferenceErrorOnly) {
    findings.push({
      code: 'VAT129-ZERO-DIFF-SIMPLIFIED',
      severity: 'info',
      titleEn: 'Zero-Tax-Difference Error Simplification Applied',
      titleAr: 'تبسيط معالجة أخطاء الإقرار ذات الأثر الضريبي الصفري',
      detailEn:
        'Errors with zero tax difference no longer trigger formal Voluntary Disclosure surcharge penalties unless explicitly requested by the FTA.',
      detailAr:
        'الأخطاء التي لا تغير صافي الضريبة المستحقة تُصحح عبر الإقرار الاعتيادي دون غرامات الإفصاح الطوعي ما لم تطلب الهيئة غير ذلك.',
      legalRef: 'UAE VAT Amendment Practice (2026) & Decision 129/2025',
    });
  }

  if (input.missingArabicRecords) {
    findings.push({
      code: 'VAT129-ARABIC-RECORDS-5000',
      severity: 'warning',
      titleEn: 'Missing Arabic Tax Records Penalty Exposure (AED 5,000)',
      titleAr: 'عدم توفر السجلات بالعربية عند الطلب (غرامة 5,000 د.إ)',
      detailEn:
        'Decision 129/2025 lowered failure to furnish records in Arabic from AED 20,000 to AED 5,000, but maintaining bilingual summaries remains mandatory.',
      detailAr:
        'خفّض القرار 129/2025 غرامة عدم تقديم السجلات بالعربية من 20,000 إلى 5,000 د.إ؛ يُنصح بتجهيز ملخصات ثنائية اللغة مسبقاً.',
      legalRef: 'Cabinet Decision No. 129 of 2025 (Reduced from AED 20,000)',
    });
  }

  return {
    penalty: {
      latePayment14PctAed,
      vdMonthly1PctAed,
      vdPostAudit15PctAed,
      fixedAdministrativeAed,
      newRegimeTotalAed,
      legacyLatePaymentAed,
      legacyFixedAndVdAed,
      legacyRegimeTotalAed,
      netSavingsVsLegacyAed,
      unboundedAnnualExposureRisk,
    },
    findings,
  };
}

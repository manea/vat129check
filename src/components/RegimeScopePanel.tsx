import { isValidUaeTrn } from '../core/index.ts';
import type {
  AssessmentInput,
  AssessmentResult,
  OffenseRepeatTier,
  RecordViolationTier,
  VoluntaryDisclosureTiming,
} from '../core/types.ts';
import {
  LATE_TIER_LABELS,
  RECORD_TIER_LABELS,
  VD_TIMING_LABELS,
  type Locale,
  type Vat129Translations,
} from '../lib/i18n.ts';
import { Vat129PenaltyAndCliffSvg } from './Vat129PenaltyAndCliffSvg.tsx';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
  t: Vat129Translations;
  locked: boolean;
  onChange: (patch: Partial<AssessmentInput>) => void;
}

export function RegimeScopePanel({ input, result, locale, t, locked, onChange }: Props) {
  const isAr = locale === 'ar';
  const trnOk = isValidUaeTrn(input.trnNumber);

  return (
    <div className="space-y-4">
      <Vat129PenaltyAndCliffSvg result={result} locale={locale} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Entity & Penalty Inputs */}
        <div className="vat-card rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
            {t.entityProfileTitle}
          </h2>

          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.orgNameLabel}
              </span>
              <input
                type="text"
                dir="auto"
                disabled={locked}
                value={input.organizationName}
                onChange={(e) => onChange({ organizationName: e.target.value })}
                className="vat-input"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {t.trnLabel}
                </span>
                <input
                  type="text"
                  dir="ltr"
                  disabled={locked}
                  value={input.trnNumber}
                  onChange={(e) => onChange({ trnNumber: e.target.value })}
                  className="vat-input vat-mono num-tabular"
                />
                <span
                  className="block text-[11px] font-semibold"
                  style={{ color: trnOk ? 'var(--accent-teal)' : 'var(--accent-crimson)' }}
                >
                  {trnOk ? t.trnValidHint : t.trnInvalidHint}
                </span>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {t.assessmentDateLabel}
                </span>
                <input
                  type="date"
                  dir="ltr"
                  disabled={locked}
                  value={input.assessmentDate}
                  onChange={(e) => onChange({ assessmentDate: e.target.value })}
                  className="vat-input vat-mono num-tabular"
                />
              </label>
            </div>
          </div>

          <hr className="border-[var(--border-subtle)]" />

          <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
            {t.penaltyInputsTitle}
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.unpaidTaxLabel}
              </span>
              <input
                type="number"
                dir="ltr"
                min={0}
                step={1000}
                disabled={locked}
                value={input.unpaidTaxLiabilityAed}
                onChange={(e) =>
                  onChange({ unpaidTaxLiabilityAed: Math.max(0, Number(e.target.value) || 0) })
                }
                className="vat-input vat-mono num-tabular"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.monthsOverdueLabel}
              </span>
              <input
                type="number"
                dir="ltr"
                min={0}
                max={120}
                disabled={locked}
                value={input.monthsOverdue}
                onChange={(e) =>
                  onChange({ monthsOverdue: Math.max(0, Number(e.target.value) || 0) })
                }
                className="vat-input vat-mono num-tabular"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.vdTimingLabel}
              </span>
              <select
                disabled={locked}
                value={input.voluntaryDisclosureTiming}
                onChange={(e) =>
                  onChange({
                    voluntaryDisclosureTiming: e.target.value as VoluntaryDisclosureTiming,
                  })
                }
                className="vat-input"
              >
                {(['none', 'pre_audit', 'post_audit'] as const).map((val) => (
                  <option key={val} value={val}>
                    {isAr ? VD_TIMING_LABELS[val].ar : VD_TIMING_LABELS[val].en}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.vdTaxDiffLabel}
              </span>
              <input
                type="number"
                dir="ltr"
                min={0}
                step={1000}
                disabled={locked}
                value={input.voluntaryDisclosureTaxDiffAed}
                onChange={(e) =>
                  onChange({
                    voluntaryDisclosureTaxDiffAed: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="vat-input vat-mono num-tabular"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.lateReturnTierLabel}
              </span>
              <select
                disabled={locked}
                value={input.lateReturnOffenseTier}
                onChange={(e) =>
                  onChange({ lateReturnOffenseTier: e.target.value as OffenseRepeatTier })
                }
                className="vat-input"
              >
                {(['none', 'first_offense', 'repeat_within_24m'] as const).map((val) => (
                  <option key={val} value={val}>
                    {isAr ? LATE_TIER_LABELS[val].ar : LATE_TIER_LABELS[val].en}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.recordTierLabel}
              </span>
              <select
                disabled={locked}
                value={input.recordKeepingViolationTier}
                onChange={(e) =>
                  onChange({ recordKeepingViolationTier: e.target.value as RecordViolationTier })
                }
                className="vat-input"
              >
                {(['none', 'first_offense', 'repeat'] as const).map((val) => (
                  <option key={val} value={val}>
                    {isAr ? RECORD_TIER_LABELS[val].ar : RECORD_TIER_LABELS[val].en}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2.5 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                disabled={locked}
                checked={input.missingArabicRecords}
                onChange={(e) => onChange({ missingArabicRecords: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]"
              />
              <span>{t.missingArabicLabel}</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                disabled={locked}
                checked={input.zeroTaxDifferenceErrorOnly}
                onChange={(e) => onChange({ zeroTaxDifferenceErrorOnly: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]"
              />
              <span>{t.zeroDiffErrorLabel}</span>
            </label>
          </div>
        </div>

        {/* Penalty Breakdown Comparator Card */}
        <div className="vat-card rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
            {t.penaltyBreakdownTitle}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t.new14PctLabel, val: result.penalty.latePayment14PctAed },
              { label: t.vdMonthlyLabel, val: result.penalty.vdMonthly1PctAed },
              { label: t.vdPostAuditLabel, val: result.penalty.vdPostAudit15PctAed },
              { label: t.fixedAdminLabel, val: result.penalty.fixedAdministrativeAed },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
              >
                <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  {item.label}
                </div>
                <div className="vat-mono num-tabular mt-1 text-base font-extrabold text-[var(--text-primary)]">
                  <bdi dir="ltr">{item.val.toLocaleString('en-US')}</bdi>{' '}
                  <span className="text-xs font-bold">{t.aedUnit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--text-secondary)]">{t.newTotalLabel}</span>
              <span className="vat-mono num-tabular text-sm text-[var(--accent-teal)]">
                <bdi dir="ltr">{result.penalty.newRegimeTotalAed.toLocaleString('en-US')}</bdi>{' '}
                <span>{t.aedUnit}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--text-secondary)]">{t.legacyTotalLabel}</span>
              <span className="vat-mono num-tabular text-sm text-[var(--accent-crimson)]">
                <bdi dir="ltr">{result.penalty.legacyRegimeTotalAed.toLocaleString('en-US')}</bdi>{' '}
                <span>{t.aedUnit}</span>
              </span>
            </div>
            <hr className="border-[var(--border-subtle)]" />
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-[var(--text-primary)]">{t.netSavingsLabel}</span>
              <span
                className="vat-mono num-tabular text-base"
                style={{
                  color:
                    result.penalty.netSavingsVsLegacyAed >= 0
                      ? 'var(--accent-teal)'
                      : 'var(--accent-amber)',
                }}
              >
                <bdi dir="ltr">{result.penalty.netSavingsVsLegacyAed.toLocaleString('en-US')}</bdi>{' '}
                <span>{t.aedUnit}</span>
              </span>
            </div>
          </div>

          {result.penalty.unboundedAnnualExposureRisk && (
            <div
              className="rounded-xl border p-3 text-xs font-semibold"
              style={{
                borderColor: 'var(--accent-amber)',
                backgroundColor: 'var(--accent-amber-soft)',
                color: 'var(--accent-amber)',
              }}
            >
              {t.unboundedWarning}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

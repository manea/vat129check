import type { AssessmentInput, AssessmentResult, VatControlId } from '../core/types.ts';
import { CREDIT_STATUS_LABELS, type Locale, type Vat129Translations } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
  t: Vat129Translations;
  locked: boolean;
  onChange: (patch: Partial<AssessmentInput>) => void;
}

export function ControlsAndRcmPanel({ input, result, locale, t, locked, onChange }: Props) {
  const isAr = locale === 'ar';
  const { creditAndChain } = result;

  function toggleControl(controlId: VatControlId) {
    if (locked) return;
    const set = new Set(input.implementedControls);
    if (set.has(controlId)) {
      set.delete(controlId);
    } else {
      set.add(controlId);
    }
    onChange({ implementedControls: Array.from(set) });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 5-Year Credit Cliff Panel */}
        <div className="vat-card rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
            {t.cliffSectionTitle}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.excessCreditLabel}
              </span>
              <input
                type="number"
                dir="ltr"
                min={0}
                step={5000}
                disabled={locked}
                value={input.excessCreditBalanceAed}
                onChange={(e) =>
                  onChange({ excessCreditBalanceAed: Math.max(0, Number(e.target.value) || 0) })
                }
                className="vat-input vat-mono num-tabular"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                {t.creditPeriodEndLabel}
              </span>
              <input
                type="date"
                dir="ltr"
                disabled={locked}
                value={input.excessCreditPeriodEndDate}
                onChange={(e) => onChange({ excessCreditPeriodEndDate: e.target.value })}
                className="vat-input vat-mono num-tabular"
              />
            </label>
          </div>

          <label className="flex items-start gap-2.5 text-xs font-medium text-[var(--text-primary)]">
            <input
              type="checkbox"
              disabled={locked}
              checked={input.hasSubmittedRefundOrOffset}
              onChange={(e) => onChange({ hasSubmittedRefundOrOffset: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]"
            />
            <span>{t.refundSubmittedLabel}</span>
          </label>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--text-secondary)]">
                {isAr ? 'حالة الرصيد:' : 'Credit Status:'}
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {isAr
                  ? CREDIT_STATUS_LABELS[creditAndChain.creditStatus].ar
                  : CREDIT_STATUS_LABELS[creditAndChain.creditStatus].en}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--text-secondary)]">
                {isAr ? 'السقوط القياسي (5 سنوات):' : 'Standard 5-Year Expiry:'}
              </span>
              <span className="vat-mono num-tabular font-semibold" dir="ltr">
                {creditAndChain.standardFiveYearExpiryDate}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--text-secondary)]">
                {isAr ? 'الحد الانتقالي الفعلي:' : 'Effective Cliff Deadline:'}
              </span>
              <span className="vat-mono num-tabular font-bold" dir="ltr">
                {creditAndChain.effectiveCliffDate} ({creditAndChain.daysRemainingToCliff}d)
              </span>
            </div>
          </div>
        </div>

        {/* Reverse Charge & Supply Chain */}
        <div className="vat-card rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{t.rcmChainTitle}</h2>

          <div className="space-y-3">
            <label className="flex items-start gap-2.5 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                disabled={locked}
                checked={input.appliesReverseCharge}
                onChange={(e) => onChange({ appliesReverseCharge: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]"
              />
              <span>{t.appliesRcmLabel}</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                disabled={locked}
                checked={input.hasCustomsAndSupplierDocs}
                onChange={(e) => onChange({ hasCustomsAndSupplierDocs: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]"
              />
              <span>{t.customsDocsLabel}</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="checkbox"
                disabled={locked}
                checked={input.vettedSupplierTrnsClean}
                onChange={(e) => onChange({ vettedSupplierTrnsClean: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]"
              />
              <span>{t.vettedTrnsLabel}</span>
            </label>
          </div>

          <div
            className="rounded-xl border p-3.5 text-xs font-medium"
            style={{
              borderColor: creditAndChain.reverseChargeCompliant
                ? 'var(--accent-teal)'
                : 'var(--accent-crimson)',
              backgroundColor: creditAndChain.reverseChargeCompliant
                ? 'var(--accent-teal-soft)'
                : 'var(--accent-crimson-soft)',
              color: 'var(--text-primary)',
            }}
          >
            {isAr
              ? 'إعفاء 16/2025: لم تعد الفاتورة الضريبية الذاتية مطلوبة لمعاملات الاحتساب العكسي، شريطة حفظ فاتورة المورد والبيان الجمركي والعقد.'
              : 'Decree-Law 16/2025 Rule: Self-invoicing is abolished for Reverse Charge transactions when foreign invoices, UAE Customs Bayans & contracts are archived.'}
          </div>
        </div>
      </div>

      {/* 6 Controls Matrix */}
      <div className="vat-card rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
          {t.controlsMatrixTitle}
        </h2>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {result.controls.map((ctrl) => (
            <label
              key={ctrl.id}
              className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                ctrl.implemented
                  ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-soft)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
              }`}
            >
              <input
                type="checkbox"
                disabled={locked}
                checked={ctrl.implemented}
                onChange={() => toggleControl(ctrl.id)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent-primary)]"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="vat-mono text-xs font-bold text-[var(--accent-primary)]" dir="ltr">
                    {ctrl.id}
                  </span>
                  <span className="vat-mono num-tabular rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-secondary)]">
                    +{ctrl.weight} pts
                  </span>
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  {isAr ? ctrl.titleAr : ctrl.titleEn}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Regulatory Findings */}
      <div className="vat-card rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{t.findingsTitle}</h2>
        {result.findings.length === 0 ? (
          <div className="rounded-xl bg-[var(--accent-teal-soft)] px-4 py-3 text-xs font-semibold text-[var(--accent-teal)]">
            {t.noFindingsText}
          </div>
        ) : (
          <div className="space-y-2">
            {result.findings.map((finding) => {
              const badgeColor =
                finding.severity === 'blocker'
                  ? 'var(--accent-crimson)'
                  : finding.severity === 'warning'
                    ? 'var(--accent-amber)'
                    : 'var(--accent-cobalt)';
              const badgeSoft =
                finding.severity === 'blocker'
                  ? 'var(--accent-crimson-soft)'
                  : finding.severity === 'warning'
                    ? 'var(--accent-amber-soft)'
                    : 'var(--accent-cobalt-soft)';
              return (
                <div
                  key={finding.code}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5 space-y-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="vat-mono rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase"
                      style={{ backgroundColor: badgeSoft, color: badgeColor }}
                    >
                      {finding.severity}
                    </span>
                    <span className="vat-mono text-xs font-bold text-[var(--text-secondary)]" dir="ltr">
                      {finding.code}
                    </span>
                    <span className="text-xs font-extrabold text-[var(--text-primary)]">
                      {isAr ? finding.titleAr : finding.titleEn}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {isAr ? finding.detailAr : finding.detailEn}
                  </p>
                  <div className="text-[11px] font-medium text-[var(--accent-primary)]">
                    {finding.legalRef}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

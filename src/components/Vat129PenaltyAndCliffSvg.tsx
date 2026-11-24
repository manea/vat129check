import type { AssessmentResult } from '../core/types.ts';
import type { Locale } from '../lib/i18n.ts';

interface Props {
  result: AssessmentResult;
  locale: Locale;
}

export function Vat129PenaltyAndCliffSvg({ result, locale }: Props) {
  const { penalty, creditAndChain } = result;
  const isAr = locale === 'ar';

  const statusColor =
    result.status === 'ready'
      ? 'var(--accent-teal)'
      : result.status === 'conditional'
        ? 'var(--accent-amber)'
        : 'var(--accent-crimson)';

  const maxPenalty = Math.max(penalty.newRegimeTotalAed, penalty.legacyRegimeTotalAed, 1000);
  const newBarW =
    penalty.newRegimeTotalAed > 0
      ? Math.max(10, Math.round((penalty.newRegimeTotalAed / maxPenalty) * 268))
      : 4;
  const legacyBarW =
    penalty.legacyRegimeTotalAed > 0
      ? Math.max(10, Math.round((penalty.legacyRegimeTotalAed / maxPenalty) * 268))
      : 4;

  const cliffColor =
    creditAndChain.creditStatus === 'forfeited'
      ? 'var(--accent-crimson)'
      : creditAndChain.creditStatus === 'urgent_cliff'
        ? 'var(--accent-amber)'
        : 'var(--accent-teal)';

  const daysClamped = Math.max(0, Math.min(365, creditAndChain.daysRemainingToCliff));
  const cliffProgressW =
    creditAndChain.creditStatus === 'forfeited'
      ? 268
      : creditAndChain.creditStatus === 'none' || creditAndChain.creditStatus === 'protected'
        ? 268
        : Math.max(10, Math.round(((365 - daysClamped) / 365) * 268));

  const scoreBarW = Math.max(6, Math.round((result.readinessScore / 100) * 268));

  return (
    <div className="vat-card rounded-2xl p-4 space-y-2.5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--text-secondary)]">
        <span>
          {isAr ? (
            <>
              مقارنة غرامات قرار <bdi dir="ltr">129/2025</bdi> ومهلة استرداد الـ 5 سنوات (
              <bdi dir="ltr">2026-12-31</bdi>)
            </>
          ) : (
            'Decision 129/2025 14% Penalty Comparison & 5-Year Credit Cliff Telemetry'
          )}
        </span>
        <span className="vat-mono num-tabular font-bold" dir="ltr" style={{ color: statusColor }}>
          {result.status.toUpperCase()} · {result.readinessScore}/100
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2" dir="ltr">
        {/* Panel 1: Penalty Comparator */}
        <svg
          viewBox="0 0 320 206"
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={
            isAr
              ? 'مخطط مقارنة الغرامات الجديدة 129/2025 والنظام القديم ومهلة 2026-12-31'
              : 'Decision 129/2025 vs legacy VAT penalty bars and 2026-12-31 credit cliff telemetry'
          }
        >
          <rect
            x="2"
            y="2"
            width="316"
            height="202"
            rx="14"
            fill="var(--bg-elevated)"
            stroke="var(--border-subtle)"
            strokeWidth="1.2"
          />
          <text x="16" y="26" fill="var(--text-primary)" fontSize="13" fontWeight="700">
            Decision 129/2025 vs. Legacy Regime
          </text>

          <text x="16" y="50" fill="var(--text-secondary)" fontSize="11.5">
            {`Decision 129/2025 Total: AED ${penalty.newRegimeTotalAed.toLocaleString('en-US')}`}
          </text>
          <rect x="16" y="58" width="268" height="11" rx="5.5" fill="var(--border-subtle)" />
          <rect x="16" y="58" width={newBarW} height="11" rx="5.5" fill="var(--accent-teal)" />

          <text x="16" y="92" fill="var(--text-secondary)" fontSize="11.5">
            {`Legacy 2%+4% / 50% VD: AED ${penalty.legacyRegimeTotalAed.toLocaleString('en-US')}`}
          </text>
          <rect x="16" y="100" width="268" height="11" rx="5.5" fill="var(--border-subtle)" />
          <rect
            x="16"
            y="100"
            width={legacyBarW}
            height="11"
            rx="5.5"
            fill="var(--accent-crimson)"
          />

          <rect
            x="14"
            y="126"
            width="292"
            height="66"
            rx="10"
            fill="var(--bg-surface)"
            stroke={
              penalty.unboundedAnnualExposureRisk ? 'var(--accent-amber)' : 'var(--accent-teal)'
            }
            strokeWidth="1.5"
          />
          <text
            x="26"
            y="148"
            fill={penalty.netSavingsVsLegacyAed >= 0 ? 'var(--accent-teal)' : 'var(--accent-amber)'}
            fontSize="12"
            fontWeight="700"
          >
            {`Net Savings vs. Legacy: AED ${penalty.netSavingsVsLegacyAed.toLocaleString('en-US')}`}
          </text>
          <text x="26" y="168" fill="var(--text-secondary)" fontSize="10.8">
            {`14% p.a.: AED ${penalty.latePayment14PctAed.toLocaleString('en-US')} | VD: AED ${(penalty.vdMonthly1PctAed + penalty.vdPostAudit15PctAed).toLocaleString('en-US')}`}
          </text>
          <text x="26" y="184" fill="var(--text-secondary)" fontSize="10.5">
            {penalty.unboundedAnnualExposureRisk
              ? 'Alert: 14% p.a. Uncapped (> 12 months overdue)'
              : `Fixed Admin: AED ${penalty.fixedAdministrativeAed.toLocaleString('en-US')} | Post-16/2025 RCM`}
          </text>
        </svg>

        {/* Panel 2: 5-Year Credit Cliff & Readiness */}
        <svg viewBox="0 0 320 206" className="h-auto w-full overflow-visible" aria-hidden="true">
          <rect
            x="2"
            y="2"
            width="316"
            height="202"
            rx="14"
            fill="var(--bg-elevated)"
            stroke="var(--border-subtle)"
            strokeWidth="1.2"
          />
          <text x="16" y="26" fill="var(--text-primary)" fontSize="13" fontWeight="700">
            5-Year Credit Cliff &amp; Chain Compliance
          </text>

          <text x="16" y="50" fill="var(--text-secondary)" fontSize="11.5">
            {`Cliff Target: ${creditAndChain.effectiveCliffDate} (${creditAndChain.daysRemainingToCliff}d)`}
          </text>
          <rect x="16" y="58" width="268" height="11" rx="5.5" fill="var(--border-subtle)" />
          <rect x="16" y="58" width={cliffProgressW} height="11" rx="5.5" fill={cliffColor} />

          <text x="16" y="92" fill="var(--text-secondary)" fontSize="11.5">
            {`Readiness Score: ${result.readinessScore}/100`}
          </text>
          <rect x="16" y="100" width="268" height="11" rx="5.5" fill="var(--border-subtle)" />
          <rect x="16" y="100" width={scoreBarW} height="11" rx="5.5" fill={statusColor} />

          <rect
            x="14"
            y="126"
            width="292"
            height="66"
            rx="10"
            fill="var(--bg-surface)"
            stroke={cliffColor}
            strokeWidth="1.5"
          />
          <text x="26" y="148" fill={cliffColor} fontSize="11.5" fontWeight="700">
            {`Credit Status: ${creditAndChain.creditStatus.toUpperCase()}${creditAndChain.transitional2026CliffApplies ? ' (2026 CLIFF)' : ''}`}
          </text>
          <text x="26" y="168" fill="var(--text-secondary)" fontSize="10.8">
            {`TRN 100-prefix: ${creditAndChain.trnValidFormat ? 'VALID (15 digits)' : 'INVALID'} | Self-Inv: Exempt`}
          </text>
          <text x="26" y="184" fill="var(--text-secondary)" fontSize="10.5">
            {`RCM Docs: ${creditAndChain.reverseChargeCompliant ? 'OK' : 'MISSING'} | Supplier Chain: ${creditAndChain.supplyChainVettingCompliant ? 'CLEAN' : 'AT RISK'}`}
          </text>
        </svg>
      </div>
    </div>
  );
}

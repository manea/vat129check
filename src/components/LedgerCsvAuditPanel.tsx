import { Download, FileSpreadsheet, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { VAT129_PRESETS } from '../core/index.ts';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import { type Locale, type Vat129Translations } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  locale: Locale;
  t: Vat129Translations;
  locked: boolean;
  onChange: (patch: Partial<AssessmentInput>) => void;
  onDownloadCsv: () => void;
}

export function LedgerCsvAuditPanel({
  input,
  result,
  locale,
  t,
  locked,
  onChange,
  onDownloadCsv,
}: Props) {
  const isAr = locale === 'ar';
  const audit = result.csvAudit;

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || locked) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ ledgersCsv: reader.result });
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  return (
    <div className="space-y-4">
      <div className="vat-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
            <FileSpreadsheet className="h-4 w-4 text-[var(--accent-primary)]" />
            <span>{t.csvPanelTitle}</span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <label
              className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold ${
                locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{t.csvUploadLabel}</span>
              <input
                type="file"
                accept=".csv,.txt"
                disabled={locked}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              disabled={locked}
              onClick={() => onChange({ ledgersCsv: VAT129_PRESETS[2]!.input.ledgersCsv || '' })}
              className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            >
              {t.csvLoadSampleBtn}
            </button>

            <button
              type="button"
              disabled={locked}
              onClick={() => onChange({ ledgersCsv: undefined })}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.csvClearBtn}</span>
            </button>

            <button
              type="button"
              data-testid="download-safe-csv-btn"
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-bold text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t.csvDownloadSafeBtn}</span>
            </button>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            {t.csvTextareaLabel}
          </span>
          <textarea
            dir="ltr"
            rows={5}
            disabled={locked}
            value={input.ledgersCsv || ''}
            placeholder="period_id,supplier_name,supplier_trn,tax_period_end,excess_credit_aed,unpaid_tax_aed,months_overdue,refund_claimed,docs_complete"
            onChange={(e) => onChange({ ledgersCsv: e.target.value || undefined })}
            className="vat-input vat-mono text-xs leading-relaxed"
          />
        </label>

        {audit && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                {t.csvTotalRows}
              </div>
              <div className="vat-mono num-tabular mt-1 text-base font-extrabold">
                {audit.totalRows}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--accent-crimson-soft)] p-3">
              <div className="text-[11px] font-semibold text-[var(--accent-crimson)]">
                {t.csvBlockedRows}
              </div>
              <div className="vat-mono num-tabular mt-1 text-base font-extrabold text-[var(--accent-crimson)]">
                {audit.blockedCount}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--accent-amber-soft)] p-3">
              <div className="text-[11px] font-semibold text-[var(--accent-amber)]">
                {t.csvInvalidTrns}
              </div>
              <div className="vat-mono num-tabular mt-1 text-base font-extrabold text-[var(--accent-amber)]">
                {audit.invalidTrnCount}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                {t.csvAtRiskCredit}
              </div>
              <div className="vat-mono num-tabular mt-1 text-base font-extrabold" dir="ltr">
                {audit.totalCreditAtRiskAed.toLocaleString('en-US')} {t.aedUnit}
              </div>
            </div>
          </div>
        )}
      </div>

      {audit && audit.rows.length > 0 && (
        <div className="vat-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-3 py-2.5 text-start font-bold">Period</th>
                  <th className="px-3 py-2.5 text-start font-bold">Supplier</th>
                  <th className="px-3 py-2.5 text-start font-bold">TRN</th>
                  <th className="px-3 py-2.5 text-start font-bold">Effective Cliff</th>
                  <th className="px-3 py-2.5 text-start font-bold">Credit ({t.aedUnit})</th>
                  <th className="px-3 py-2.5 text-start font-bold">Status</th>
                  <th className="px-3 py-2.5 text-start font-bold">
                    {isAr ? 'الملاحظات' : 'Issues'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {audit.rows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.periodId}`}>
                    <td className="vat-mono num-tabular px-3 py-2.5 font-semibold" dir="ltr">
                      {row.periodId}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{row.supplierName}</td>
                    <td className="vat-mono num-tabular px-3 py-2.5" dir="ltr">
                      <span
                        className="rounded px-1.5 py-0.5 text-[11px] font-bold"
                        style={{
                          backgroundColor: row.trnValid
                            ? 'var(--accent-teal-soft)'
                            : 'var(--accent-crimson-soft)',
                          color: row.trnValid ? 'var(--accent-teal)' : 'var(--accent-crimson)',
                        }}
                      >
                        {row.supplierTrn}
                      </span>
                    </td>
                    <td className="vat-mono num-tabular px-3 py-2.5" dir="ltr">
                      {row.effectiveExpiryDate} ({row.daysToCliff}d)
                    </td>
                    <td className="vat-mono num-tabular px-3 py-2.5 font-bold" dir="ltr">
                      {row.excessCreditAed.toLocaleString('en-US')}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="vat-mono rounded px-2 py-0.5 text-[11px] font-extrabold uppercase"
                        style={{
                          backgroundColor:
                            row.status === 'ready'
                              ? 'var(--accent-teal-soft)'
                              : row.status === 'conditional'
                                ? 'var(--accent-amber-soft)'
                                : 'var(--accent-crimson-soft)',
                          color:
                            row.status === 'ready'
                              ? 'var(--accent-teal)'
                              : row.status === 'conditional'
                                ? 'var(--accent-amber)'
                                : 'var(--accent-crimson)',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[var(--text-secondary)]">
                      {row.issues.length > 0 ? row.issues.join(' | ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

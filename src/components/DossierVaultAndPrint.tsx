import {
  Copy,
  Download,
  ExternalLink,
  FileText,
  Lock,
  Printer,
  Save,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import type { Vat129DossierRecord, Vat129OrgProfile } from '../lib/api.ts';
import { STATUS_META, type Locale, type Vat129Translations } from '../lib/i18n.ts';

interface Props {
  input: AssessmentInput;
  result: AssessmentResult;
  activeDossier: Vat129DossierRecord | null;
  dossiers: Vat129DossierRecord[];
  profiles: Vat129OrgProfile[];
  locale: Locale;
  t: Vat129Translations;
  busy: boolean;
  onChangeNotes: (notes: string) => void;
  onCreateDossier: () => void;
  onUpdateDossier: () => void;
  onFinalizeDossier: () => void;
  onDuplicateDossier: (code: string) => void;
  onDeleteDossier: (code: string) => void;
  onSelectDossier: (item: Vat129DossierRecord) => void;
  onSaveProfile: () => void;
  onLoadProfile: (prof: Vat129OrgProfile) => void;
  onDownloadBrief: () => void;
  onDownloadCsv: () => void;
  onOpenPublicReport: (slugOrCode: string) => void;
}

export function DossierVaultAndPrint({
  input,
  result,
  activeDossier,
  dossiers,
  profiles,
  locale,
  t,
  busy,
  onChangeNotes,
  onCreateDossier,
  onUpdateDossier,
  onFinalizeDossier,
  onDuplicateDossier,
  onDeleteDossier,
  onSelectDossier,
  onSaveProfile,
  onLoadProfile,
  onDownloadBrief,
  onDownloadCsv,
  onOpenPublicReport,
}: Props) {
  const isAr = locale === 'ar';
  const locked = Boolean(activeDossier?.lockedAt);
  const statusInfo = STATUS_META[result.status];

  return (
    <div className="space-y-4">
      {/* Vault Action Bar */}
      <div className="no-print vat-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-[var(--text-primary)]">{t.vaultTitle}</h2>
          <button
            type="button"
            disabled={busy}
            onClick={onSaveProfile}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)] disabled:opacity-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{t.saveProfileBtn}</span>
          </button>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            {t.notesLabel}
          </span>
          <textarea
            rows={2}
            disabled={locked}
            value={input.notes || ''}
            onChange={(e) => onChangeNotes(e.target.value)}
            className="vat-input text-xs"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="create-dossier-btn"
            disabled={busy}
            onClick={onCreateDossier}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-bold text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{t.createDossierBtn}</span>
          </button>

          {activeDossier && !locked && (
            <>
              <button
                type="button"
                data-testid="update-dossier-btn"
                disabled={busy}
                onClick={onUpdateDossier}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] px-3.5 py-2 text-xs font-bold hover:bg-[var(--bg-elevated)] disabled:opacity-50"
              >
                <span>{t.updateDraftBtn}</span>
              </button>

              <button
                type="button"
                data-testid="finalize-dossier-btn"
                disabled={busy}
                onClick={onFinalizeDossier}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-cobalt)',
                  color: '#FFFFFF',
                }}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{t.sealDossierBtn}</span>
              </button>
            </>
          )}

          {activeDossier && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDuplicateDossier(activeDossier.dossierCode)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] px-3.5 py-2 text-xs font-bold hover:bg-[var(--bg-elevated)] disabled:opacity-50"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{t.duplicateBtn}</span>
            </button>
          )}

          {activeDossier && !locked && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDeleteDossier(activeDossier.dossierCode)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-crimson-soft)',
                color: 'var(--accent-crimson)',
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.deleteBtn}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="download-brief-btn"
            onClick={onDownloadBrief}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] px-3.5 py-2 text-xs font-bold hover:bg-[var(--bg-elevated)]"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t.downloadBriefBtn}</span>
          </button>

          <button
            type="button"
            data-testid="download-vault-csv-btn"
            onClick={onDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] px-3.5 py-2 text-xs font-bold hover:bg-[var(--bg-elevated)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t.downloadCsvBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] px-3.5 py-2 text-xs font-bold hover:bg-[var(--bg-elevated)]"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{t.printA4Btn}</span>
          </button>

          {activeDossier?.lockedAt && (
            <button
              type="button"
              data-testid="open-public-report-btn"
              onClick={() =>
                onOpenPublicReport(activeDossier.publicSlug || activeDossier.dossierCode)
              }
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold"
              style={{
                backgroundColor: 'var(--accent-teal-soft)',
                color: 'var(--accent-teal)',
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{t.openPublicBtn}</span>
            </button>
          )}
        </div>

        {profiles.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t.savedProfilesLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {profiles.map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => onLoadProfile(prof)}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-semibold hover:border-[var(--accent-primary)]"
                >
                  {prof.organizationName} (<span dir="ltr">{prof.trnNumber}</span>)
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saved Dossiers List */}
      <div className="no-print vat-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
          {t.savedDossiersHeading}
        </h3>
        {dossiers.length === 0 ? (
          <div className="rounded-xl bg-[var(--bg-elevated)] px-4 py-3 text-xs text-[var(--text-secondary)]">
            {t.noSavedDossiers}
          </div>
        ) : (
          <div className="space-y-2">
            {dossiers.map((item) => {
              const isSelected = activeDossier?.dossierCode === item.dossierCode;
              const st = STATUS_META[item.status];
              return (
                <div
                  key={item.dossierCode}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${
                    isSelected
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDossier(item)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="vat-mono text-xs font-extrabold text-[var(--accent-primary)]"
                        dir="ltr"
                      >
                        {item.dossierCode}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {item.organizationName}
                      </span>
                      <span
                        className="vat-mono rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase"
                        style={{ backgroundColor: st.softVar, color: st.colorVar }}
                      >
                        {isAr ? st.ar : st.en} · {item.readinessScore}/100
                      </span>
                      {item.lockedAt && (
                        <span className="vat-mono inline-flex items-center gap-1 rounded bg-[var(--accent-cobalt-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent-cobalt)]">
                          <Lock className="h-2.5 w-2.5" />
                          <span>{t.lockedBadge}</span>
                        </span>
                      )}
                    </div>
                  </button>

                  {item.lockedAt && (
                    <button
                      type="button"
                      onClick={() => onOpenPublicReport(item.publicSlug || item.dossierCode)}
                      className="rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-[11px] font-semibold hover:bg-[var(--bg-surface)]"
                    >
                      {t.openPublicBtn}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* A4 Printable Sheet */}
      <article className="vat-card print-only-sheet rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
              {t.printSheetTitle}
            </div>
            <h3 className="mt-1 text-lg font-extrabold text-[var(--text-primary)]">
              {input.organizationName}
            </h3>
            <div className="vat-mono num-tabular text-xs text-[var(--text-secondary)]" dir="ltr">
              TRN: {input.trnNumber} · Date: {input.assessmentDate}
              {activeDossier ? ` · ${activeDossier.dossierCode}` : ''}
            </div>
          </div>

          <div
            className="vat-mono num-tabular rounded-xl px-3.5 py-2 text-xs font-extrabold"
            dir="ltr"
            style={{ backgroundColor: statusInfo.softVar, color: statusInfo.colorVar }}
          >
            {result.status.toUpperCase()} · {result.readinessScore}/100
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
            <div className="text-[var(--text-secondary)]">{t.newTotalLabel}</div>
            <div className="vat-mono num-tabular mt-1 text-sm font-extrabold" dir="ltr">
              AED {result.penalty.newRegimeTotalAed.toLocaleString('en-US')}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
            <div className="text-[var(--text-secondary)]">{t.netSavingsLabel}</div>
            <div className="vat-mono num-tabular mt-1 text-sm font-extrabold text-[var(--accent-teal)]" dir="ltr">
              AED {result.penalty.netSavingsVsLegacyAed.toLocaleString('en-US')}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
            <div className="text-[var(--text-secondary)]">
              {isAr ? 'الحد الانتقالي للرصيد:' : 'Effective Cliff Deadline:'}
            </div>
            <div className="vat-mono num-tabular mt-1 text-sm font-extrabold" dir="ltr">
              {result.creditAndChain.effectiveCliffDate} ({result.creditAndChain.daysRemainingToCliff}d)
            </div>
          </div>
        </div>

        <div className="vat-mono break-all rounded-xl bg-[var(--bg-elevated)] p-3 text-[11px] text-[var(--text-secondary)]" dir="ltr">
          SHA-256: {activeDossier?.dossierSha256 || result.dossierSha256}
        </div>

        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {isAr ? result.legalDisclaimerAr : result.legalDisclaimerEn}
        </p>
      </article>
    </div>
  );
}

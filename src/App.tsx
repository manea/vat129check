import {
  ArrowLeft,
  Clock,
  Database,
  Globe,
  HardDrive,
  Lock,
  Moon,
  Printer,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ControlsAndRcmPanel } from './components/ControlsAndRcmPanel.tsx';
import { DossierVaultAndPrint } from './components/DossierVaultAndPrint.tsx';
import { LedgerCsvAuditPanel } from './components/LedgerCsvAuditPanel.tsx';
import { RegimeScopePanel } from './components/RegimeScopePanel.tsx';
import {
  VAT129_PRESETS,
  VAT129_TOOL_VERSION,
  assessVat129Readiness,
} from './core/index.ts';
import type { AssessmentInput, AssessmentResult } from './core/types.ts';
import {
  type ApiMode,
  type PublicVat129Report,
  type Vat129DossierRecord,
  type Vat129OrgProfile,
  createDossier,
  deleteDossier,
  detectApiMode,
  downloadAuditCsv,
  downloadBriefMarkdown,
  duplicateDossier,
  fetchPublicReport,
  finalizeDossier,
  listDossiers,
  listProfiles,
  saveOrgProfile,
  updateDossier,
} from './lib/api.ts';
import { stripBase, withBase } from './lib/basePath.ts';
import {
  STATUS_META,
  type Locale,
  type ThemeMode,
  getTranslations,
} from './lib/i18n.ts';

type WorkspaceTab = 'scope' | 'controls' | 'csv' | 'vault';

function extractPublicRouteSlug(): string | null {
  if (typeof window === 'undefined') return null;
  const stripped = stripBase(window.location.pathname);
  const match = stripped.match(/^\/r\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1] || '') : null;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'ar';
    return window.localStorage.getItem('vat129check.v1.locale') === 'en' ? 'en' : 'ar';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dirham-vellum';
    return window.localStorage.getItem('vat129check.v1.theme') === 'emirates-slate'
      ? 'emirates-slate'
      : 'dirham-vellum';
  });
  const [mode, setMode] = useState<ApiMode>('local');
  const [tab, setTab] = useState<WorkspaceTab>('scope');
  const [input, setInput] = useState<AssessmentInput>(() => ({ ...VAT129_PRESETS[0]!.input }));
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [dossiers, setDossiers] = useState<Vat129DossierRecord[]>([]);
  const [profiles, setProfiles] = useState<Vat129OrgProfile[]>([]);
  const [activeDossier, setActiveDossier] = useState<Vat129DossierRecord | null>(null);
  const [publicSlug, setPublicSlug] = useState<string | null>(() => extractPublicRouteSlug());
  const [publicData, setPublicData] = useState<PublicVat129Report | null>(null);
  const [publicLoading, setPublicLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = getTranslations(locale);
  const isAr = locale === 'ar';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem('vat129check.v1.locale', locale);
    } catch {
      // ignore storage errors
    }
  }, [locale, isAr]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('vat129check.v1.theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const onPopState = () => setPublicSlug(extractPublicRouteSlug());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const detected = await detectApiMode();
      if (cancelled) return;
      setMode(detected);
      const [loadedDossiers, loadedProfiles] = await Promise.all([
        listDossiers(detected).catch(() => []),
        listProfiles(detected).catch(() => []),
      ]);
      if (cancelled) return;
      setDossiers(loadedDossiers);
      setProfiles(loadedProfiles);

      if (publicSlug) {
        setPublicLoading(true);
        const pub = await fetchPublicReport(detected, publicSlug);
        if (!cancelled) {
          setPublicData(pub);
          setPublicLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicSlug]);

  useEffect(() => {
    let cancelled = false;
    void assessVat129Readiness(input).then((assessed) => {
      if (!cancelled) setResult(assessed);
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  function patchInput(patch: Partial<AssessmentInput>) {
    setErrorMsg(null);
    setInput((prev) => ({ ...prev, ...patch }));
  }

  function applyPreset(presetId: string) {
    const found = VAT129_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActiveDossier(null);
    setErrorMsg(null);
    setInput({ ...found.input });
  }

  async function refreshVault(currentMode: ApiMode) {
    const [nextDossiers, nextProfiles] = await Promise.all([
      listDossiers(currentMode),
      listProfiles(currentMode),
    ]);
    setDossiers(nextDossiers);
    setProfiles(nextProfiles);
  }

  async function handleCreateDossier() {
    setBusy(true);
    setErrorMsg(null);
    try {
      const created = await createDossier(mode, input);
      setActiveDossier(created);
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create dossier');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateDossier() {
    if (!activeDossier) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const updated = await updateDossier(mode, activeDossier.dossierCode, input);
      setActiveDossier(updated);
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update draft');
    } finally {
      setBusy(false);
    }
  }

  async function handleFinalizeDossier() {
    if (!activeDossier) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const updated = await updateDossier(mode, activeDossier.dossierCode, input);
      const sealed = await finalizeDossier(mode, updated.dossierCode);
      setActiveDossier(sealed);
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to seal dossier');
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicateDossier(code: string) {
    setBusy(true);
    setErrorMsg(null);
    try {
      const copy = await duplicateDossier(mode, code);
      setActiveDossier(copy);
      setInput({ ...copy.input });
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to duplicate dossier');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDossier(code: string) {
    setBusy(true);
    setErrorMsg(null);
    try {
      await deleteDossier(mode, code);
      if (activeDossier?.dossierCode === code) {
        setActiveDossier(null);
      }
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete dossier');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile() {
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveOrgProfile(mode, input);
      await refreshVault(mode);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setBusy(false);
    }
  }

  function handleOpenPublicReport(slugOrCode: string) {
    window.history.pushState({}, '', withBase(`/r/${encodeURIComponent(slugOrCode)}`));
    setPublicSlug(slugOrCode);
  }

  function handleExitPublicReport() {
    window.history.pushState({}, '', withBase('/'));
    setPublicSlug(null);
    setPublicData(null);
  }

  const locked = Boolean(activeDossier?.lockedAt);

  if (publicSlug) {
    const pubReport = publicData?.report;
    const pubStatus = pubReport ? STATUS_META[pubReport.status] : null;
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] px-4 py-6 text-[var(--text-primary)]">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleExitPublicReport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t.backToWorkspace}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t.switchLangLabel}
                title={t.switchLangLabel}
                onClick={() => setLocale((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)]"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{t.switchLangLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary-fg)] hover:bg-[var(--accent-primary-hover)]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{t.printA4Btn}</span>
              </button>
            </div>
          </div>

          {publicLoading ? (
            <div className="vat-card rounded-2xl p-6 text-sm text-[var(--text-secondary)]">
              {isAr ? `جاري تحميل التقرير المختوم (${publicSlug})...` : `Loading sealed report (${publicSlug})...`}
            </div>
          ) : publicData && pubReport && pubStatus ? (
            <div className="vat-card print-only-sheet rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <div className="vat-mono flex items-center gap-1.5 text-xs font-bold text-[var(--accent-cobalt)]" dir="ltr">
                    <Lock className="h-3.5 w-3.5" />
                    <span>{pubReport.dossierCode}</span>
                  </div>
                  <h1 className="mt-1 text-xl font-extrabold">{pubReport.organizationName}</h1>
                  <div className="vat-mono num-tabular text-xs text-[var(--text-secondary)]" dir="ltr">
                    TRN {pubReport.trnNumber} · {pubReport.assessmentDate}
                  </div>
                </div>
                <div className="text-end">
                  <div className="vat-mono num-tabular text-sm font-bold" dir="ltr" style={{ color: pubStatus.colorVar }}>
                    {pubReport.status.toUpperCase()} · {pubReport.readinessScore}/100
                  </div>
                  <div className="vat-mono num-tabular text-xs text-[var(--text-secondary)]">
                    {t.publicViewsLabel}: {publicData.viewCount}
                  </div>
                </div>
              </div>

              <div className="vat-mono break-all rounded-xl bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-secondary)]" dir="ltr">
                {t.sha256Label}: {pubReport.dossierSha256}
              </div>

              <pre className="vat-mono whitespace-pre-wrap break-words rounded-xl bg-[var(--bg-elevated)] p-4 text-xs leading-relaxed">
                {isAr ? pubReport.briefAr : pubReport.briefEn}
              </pre>
            </div>
          ) : (
            <div className="vat-card rounded-2xl p-6 text-sm text-[var(--accent-crimson)]">
              {isAr ? `تعذر العثور على التقرير المختوم (${publicSlug}).` : `Sealed report (${publicSlug}) not found.`}
            </div>
          )}
        </div>
      </div>
    );
  }

  const badgeInfo = result ? STATUS_META[result.status] : null;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Header (non-sticky so mobile 390px viewports stay uncluttered) */}
      <header className="no-print border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight">VAT129Check</span>
                <span className="vat-mono rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]" dir="ltr">
                  v{VAT129_TOOL_VERSION}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-primary)]">
                  {mode === 'server' ? (
                    <Database className="h-3 w-3" />
                  ) : (
                    <HardDrive className="h-3 w-3" />
                  )}
                  <span>{mode === 'server' ? t.modeServer : t.modeLocal}</span>
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{t.brandTagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="lang-toggle"
              aria-label={t.switchLangLabel}
              title={t.switchLangLabel}
              onClick={() => setLocale((prev) => (prev === 'ar' ? 'en' : 'ar'))}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)]"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{t.switchLangLabel}</span>
            </button>

            <button
              type="button"
              data-testid="theme-toggle"
              aria-label={theme === 'dirham-vellum' ? t.themeDarkLabel : t.themeLightLabel}
              title={theme === 'dirham-vellum' ? t.themeDarkLabel : t.themeLightLabel}
              onClick={() =>
                setTheme((prev) =>
                  prev === 'dirham-vellum' ? 'emirates-slate' : 'dirham-vellum',
                )
              }
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-elevated)]"
            >
              {theme === 'dirham-vellum' ? (
                <Moon className="h-3.5 w-3.5" />
              ) : (
                <Sun className="h-3.5 w-3.5" />
              )}
              <span>{theme === 'dirham-vellum' ? t.themeDarkLabel : t.themeLightLabel}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5">
        {/* Preset Selector Bar */}
        <section className="no-print vat-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
              {t.presetHeading}
            </div>
            <span className="rounded-full bg-[var(--accent-amber-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-amber)]">
              {t.independentNoticeBadge}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {VAT129_PRESETS.map((preset) => {
              const selected =
                !activeDossier && input.organizationName === preset.input.organizationName;
              return (
                <button
                  key={preset.id}
                  type="button"
                  data-testid={`preset-${preset.id}`}
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-xl border p-3 text-start transition ${
                    selected
                      ? 'border-[var(--accent-primary)] bg-[var(--bg-soft)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    {isAr ? preset.labelAr : preset.labelEn}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    {isAr ? preset.descriptionAr : preset.descriptionEn}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Telemetry Summary Banner */}
        {result && badgeInfo && (
          <section className="no-print vat-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                data-testid="status-badge"
                className="vat-mono rounded-lg px-3 py-1.5 text-xs font-extrabold tracking-wide"
                style={{ backgroundColor: badgeInfo.softVar, color: badgeInfo.colorVar }}
              >
                {isAr ? badgeInfo.ar : badgeInfo.en}
              </span>
              <div>
                <div className="vat-mono num-tabular text-sm font-bold text-[var(--text-primary)]">
                  {t.readinessScore}: <span dir="ltr">{result.readinessScore}/100</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  <bdi>{input.organizationName}</bdi> ·{' '}
                  {activeDossier ? (
                    <>
                      {t.dossierCodeLabel}:{' '}
                      <span className="vat-mono font-bold" dir="ltr">
                        {activeDossier.dossierCode}
                      </span>
                    </>
                  ) : (
                    t.draftBadge
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {result.creditAndChain.transitional2026CliffApplies && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-amber-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-amber)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span dir="ltr">
                    2026-12-31 ({result.creditAndChain.daysRemainingToCliff}d)
                  </span>
                </span>
              )}
              {result.penalty.netSavingsVsLegacyAed > 0 && (
                <span className="vat-mono num-tabular inline-flex items-center gap-1 rounded-full bg-[var(--accent-teal-soft)] px-3 py-1 text-xs font-bold text-[var(--accent-teal)]">
                  {isAr ? (
                    <>
                      وفورات: <bdi dir="ltr">{result.penalty.netSavingsVsLegacyAed.toLocaleString('en-US')}</bdi> {t.aedUnit}
                    </>
                  ) : (
                    <span dir="ltr">
                      +{result.penalty.netSavingsVsLegacyAed.toLocaleString('en-US')} AED Saved
                    </span>
                  )}
                </span>
              )}
              {locked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-cobalt-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-cobalt)]">
                  <Lock className="h-3.5 w-3.5" />
                  <span>{t.lockedBadge}</span>
                </span>
              )}
            </div>
          </section>
        )}

        {errorMsg && (
          <div className="no-print rounded-xl border border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-crimson)]">
            {errorMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="no-print flex flex-wrap gap-2">
          {(
            [
              ['scope', t.tabScopePenalty],
              ['controls', t.tabCliffControls],
              ['csv', t.tabCsvAudit],
              ['vault', t.tabVaultPrint],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              data-testid={`tab-${key}`}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === key
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-fg)]'
                  : 'vat-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Active Panel */}
        {result && (
          <section>
            {tab === 'scope' && (
              <RegimeScopePanel
                input={input}
                result={result}
                locale={locale}
                t={t}
                locked={locked}
                onChange={patchInput}
              />
            )}
            {tab === 'controls' && (
              <ControlsAndRcmPanel
                input={input}
                result={result}
                locale={locale}
                t={t}
                locked={locked}
                onChange={patchInput}
              />
            )}
            {tab === 'csv' && (
              <LedgerCsvAuditPanel
                input={input}
                result={result}
                locale={locale}
                t={t}
                locked={locked}
                onChange={patchInput}
                onDownloadCsv={() => void downloadAuditCsv(mode, activeDossier, input, result)}
              />
            )}
            {tab === 'vault' && (
              <DossierVaultAndPrint
                input={input}
                result={result}
                activeDossier={activeDossier}
                dossiers={dossiers}
                profiles={profiles}
                locale={locale}
                t={t}
                busy={busy}
                onChangeNotes={(notes) => patchInput({ notes })}
                onCreateDossier={() => void handleCreateDossier()}
                onUpdateDossier={() => void handleUpdateDossier()}
                onFinalizeDossier={() => void handleFinalizeDossier()}
                onDuplicateDossier={(code) => void handleDuplicateDossier(code)}
                onDeleteDossier={(code) => void handleDeleteDossier(code)}
                onSelectDossier={(item) => {
                  setActiveDossier(item);
                  setInput({ ...item.input });
                }}
                onSaveProfile={() => void handleSaveProfile()}
                onLoadProfile={(prof) => {
                  setActiveDossier(null);
                  patchInput({
                    organizationName: prof.organizationName,
                    trnNumber: prof.trnNumber,
                    assessmentDate: prof.assessmentDate,
                    appliesReverseCharge: prof.appliesReverseCharge,
                    notes: prof.notes,
                  });
                  setTab('scope');
                }}
                onDownloadBrief={() =>
                  void downloadBriefMarkdown(mode, activeDossier, input, result, locale)
                }
                onDownloadCsv={() => void downloadAuditCsv(mode, activeDossier, input, result)}
                onOpenPublicReport={handleOpenPublicReport}
              />
            )}
          </section>
        )}

        {/* Independent Legal Disclaimer Footer */}
        {result && (
          <footer className="vat-card rounded-2xl p-4 text-xs text-[var(--text-secondary)]">
            <div className="font-bold text-[var(--text-primary)]">{t.legalFooterTitle}</div>
            <p className="mt-1">
              {isAr ? result.legalDisclaimerAr : result.legalDisclaimerEn}
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}

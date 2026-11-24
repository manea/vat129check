import {
  assessVat129Readiness,
  buildVat129BriefMarkdown,
  exportVatAuditCsv,
  sanitizeCsvCell,
} from '../core/index.ts';
import type { AssessmentInput, AssessmentResult } from '../core/types.ts';
import { withBase } from './basePath.ts';
import type { Locale } from './i18n.ts';

export type ApiMode = 'server' | 'local';

export interface Vat129DossierRecord {
  id: number | string;
  profileId: number | string | null;
  dossierCode: string;
  title: string;
  organizationName: string;
  trnNumber: string;
  assessmentDate: string;
  status: AssessmentResult['status'];
  readinessScore: number;
  newRegimeTotalAed: number;
  legacyRegimeTotalAed: number;
  netSavingsVsLegacyAed: number;
  creditStatus: AssessmentResult['creditAndChain']['creditStatus'];
  daysRemainingToCliff: number;
  canonicalText: string;
  dossierSha256: string;
  publicSlug: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  input: AssessmentInput;
  result: AssessmentResult;
}

export interface Vat129OrgProfile {
  id: number | string;
  organizationName: string;
  trnNumber: string;
  assessmentDate: string;
  appliesReverseCharge: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicVat129Report {
  viewCount: number;
  lastViewedAt: string;
  report: {
    dossierCode: string;
    publicSlug: string;
    organizationName: string;
    trnNumber: string;
    assessmentDate: string;
    status: AssessmentResult['status'];
    readinessScore: number;
    lockedAt: string;
    dossierSha256: string;
    legalDisclaimerEn: string;
    legalDisclaimerAr: string;
    penalty: AssessmentResult['penalty'];
    creditAndChain: AssessmentResult['creditAndChain'];
    briefAr: string;
    briefEn: string;
  };
}

const LS_DOSSIERS = 'vat129check.v1.dossiers';
const LS_PROFILES = 'vat129check.v1.profiles';
const LS_SEQ = 'vat129check.v1.seq';
const LS_VIEWS = 'vat129check.v1.views';

function readLocalList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocalList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function allocateLocalDossierCode(): string {
  const year = new Date().getUTCFullYear();
  const prev = Number(localStorage.getItem(LS_SEQ) || '0');
  const next = Number.isFinite(prev) ? prev + 1 : 1;
  localStorage.setItem(LS_SEQ, String(next));
  return `VAT-${year}-${String(next).padStart(4, '0')}`;
}

export function triggerTextDownload(
  filename: string,
  mimeType: string,
  content: string | Uint8Array<ArrayBuffer>,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function detectApiMode(): Promise<ApiMode> {
  try {
    const res = await fetch(withBase('/health'), { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; service?: string };
      if (data?.ok && data?.service === 'vat129check') return 'server';
    }
  } catch {
    // static $0 Cloudflare Workers / offline browser fallback
  }
  return 'local';
}

export async function listDossiers(mode: ApiMode): Promise<Vat129DossierRecord[]> {
  if (mode === 'server') {
    const res = await fetch(withBase('/api/dossiers'), { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load VAT129Check dossiers');
    const json = (await res.json()) as { items: Vat129DossierRecord[] };
    return json.items || [];
  }
  return readLocalList<Vat129DossierRecord>(LS_DOSSIERS);
}

export async function listProfiles(mode: ApiMode): Promise<Vat129OrgProfile[]> {
  if (mode === 'server') {
    const res = await fetch(withBase('/api/profiles'), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { items: Vat129OrgProfile[] };
    return json.items || [];
  }
  return readLocalList<Vat129OrgProfile>(LS_PROFILES);
}

export async function saveOrgProfile(
  mode: ApiMode,
  input: AssessmentInput,
): Promise<Vat129OrgProfile> {
  if (mode === 'server') {
    const res = await fetch(withBase('/api/profiles'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationName: input.organizationName,
        trnNumber: input.trnNumber,
        assessmentDate: input.assessmentDate,
        appliesReverseCharge: input.appliesReverseCharge,
        notes: input.notes || '',
      }),
    });
    if (!res.ok) throw new Error('Failed to save UAE entity profile');
    const json = (await res.json()) as { profile: Vat129OrgProfile };
    return json.profile;
  }

  const now = new Date().toISOString();
  const profile: Vat129OrgProfile = {
    id: `prof-${Date.now().toString(36)}`,
    organizationName: input.organizationName,
    trnNumber: input.trnNumber,
    assessmentDate: input.assessmentDate,
    appliesReverseCharge: input.appliesReverseCharge,
    notes: input.notes || '',
    createdAt: now,
    updatedAt: now,
  };
  writeLocalList(LS_PROFILES, [profile, ...readLocalList<Vat129OrgProfile>(LS_PROFILES)]);
  return profile;
}

export async function createDossier(
  mode: ApiMode,
  input: AssessmentInput,
): Promise<Vat129DossierRecord> {
  if (mode === 'server') {
    const res = await fetch(withBase('/api/dossiers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to create VAT129 dossier');
    const json = (await res.json()) as { item: Vat129DossierRecord };
    return json.item;
  }

  const result = await assessVat129Readiness(input);
  const now = new Date().toISOString();
  const code = allocateLocalDossierCode();
  const record: Vat129DossierRecord = {
    id: `local-${Date.now().toString(36)}`,
    profileId: null,
    dossierCode: code,
    title: `${input.organizationName} (${input.assessmentDate})`,
    organizationName: input.organizationName,
    trnNumber: input.trnNumber,
    assessmentDate: input.assessmentDate,
    status: result.status,
    readinessScore: result.readinessScore,
    newRegimeTotalAed: result.penalty.newRegimeTotalAed,
    legacyRegimeTotalAed: result.penalty.legacyRegimeTotalAed,
    netSavingsVsLegacyAed: result.penalty.netSavingsVsLegacyAed,
    creditStatus: result.creditAndChain.creditStatus,
    daysRemainingToCliff: result.creditAndChain.daysRemainingToCliff,
    canonicalText: result.canonicalDossierText,
    dossierSha256: result.dossierSha256,
    publicSlug: null,
    lockedAt: null,
    createdAt: now,
    updatedAt: now,
    input,
    result,
  };
  writeLocalList(LS_DOSSIERS, [record, ...readLocalList<Vat129DossierRecord>(LS_DOSSIERS)]);
  return record;
}

export async function updateDossier(
  mode: ApiMode,
  idOrCode: string,
  input: AssessmentInput,
): Promise<Vat129DossierRecord> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/dossiers/${encodeURIComponent(idOrCode)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to update VAT129 draft');
    const json = (await res.json()) as { item: Vat129DossierRecord };
    return json.item;
  }

  const result = await assessVat129Readiness(input);
  const now = new Date().toISOString();
  const list = readLocalList<Vat129DossierRecord>(LS_DOSSIERS);
  const updated = list.map((item) => {
    if (String(item.id) !== String(idOrCode) && item.dossierCode !== idOrCode) return item;
    if (item.lockedAt) throw new Error('Sealed dossier cannot be modified');
    return {
      ...item,
      organizationName: input.organizationName,
      trnNumber: input.trnNumber,
      assessmentDate: input.assessmentDate,
      status: result.status,
      readinessScore: result.readinessScore,
      newRegimeTotalAed: result.penalty.newRegimeTotalAed,
      legacyRegimeTotalAed: result.penalty.legacyRegimeTotalAed,
      netSavingsVsLegacyAed: result.penalty.netSavingsVsLegacyAed,
      creditStatus: result.creditAndChain.creditStatus,
      daysRemainingToCliff: result.creditAndChain.daysRemainingToCliff,
      canonicalText: result.canonicalDossierText,
      dossierSha256: result.dossierSha256,
      updatedAt: now,
      input,
      result,
    };
  });
  writeLocalList(LS_DOSSIERS, updated);
  const target = updated.find(
    (item) => String(item.id) === String(idOrCode) || item.dossierCode === idOrCode,
  );
  if (!target) throw new Error('Dossier not found');
  return target;
}

export async function finalizeDossier(
  mode: ApiMode,
  idOrCode: string,
): Promise<Vat129DossierRecord> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/dossiers/${encodeURIComponent(idOrCode)}/finalize`), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to finalize dossier');
    const json = (await res.json()) as { item: Vat129DossierRecord };
    return json.item;
  }

  const now = new Date().toISOString();
  const list = readLocalList<Vat129DossierRecord>(LS_DOSSIERS);
  const updated = list.map((item) => {
    if (String(item.id) !== String(idOrCode) && item.dossierCode !== idOrCode) return item;
    if (item.lockedAt) return item;
    return {
      ...item,
      publicSlug: item.publicSlug || `vat129-${item.dossierSha256.slice(0, 12)}`,
      lockedAt: now,
      updatedAt: now,
    };
  });
  writeLocalList(LS_DOSSIERS, updated);
  const target = updated.find(
    (item) => String(item.id) === String(idOrCode) || item.dossierCode === idOrCode,
  );
  if (!target) throw new Error('Dossier not found');
  return target;
}

export async function duplicateDossier(
  mode: ApiMode,
  idOrCode: string,
): Promise<Vat129DossierRecord> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/dossiers/${encodeURIComponent(idOrCode)}/duplicate`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Failed to duplicate dossier');
    const json = (await res.json()) as { item: Vat129DossierRecord };
    return json.item;
  }

  const list = readLocalList<Vat129DossierRecord>(LS_DOSSIERS);
  const src = list.find(
    (item) => String(item.id) === String(idOrCode) || item.dossierCode === idOrCode,
  );
  if (!src) throw new Error('Source dossier not found');
  return createDossier('local', { ...src.input });
}

export async function deleteDossier(mode: ApiMode, idOrCode: string): Promise<void> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/dossiers/${encodeURIComponent(idOrCode)}`), {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete dossier');
    return;
  }
  const list = readLocalList<Vat129DossierRecord>(LS_DOSSIERS);
  writeLocalList(
    LS_DOSSIERS,
    list.filter((item) => String(item.id) !== String(idOrCode) && item.dossierCode !== idOrCode),
  );
}

export async function downloadBriefMarkdown(
  mode: ApiMode,
  dossier: Vat129DossierRecord | null,
  input: AssessmentInput,
  result: AssessmentResult,
  locale: Locale,
): Promise<void> {
  const code = dossier?.dossierCode || 'VAT-PREVIEW';
  if (mode === 'server' && dossier) {
    const res = await fetch(
      withBase(`/api/dossiers/${encodeURIComponent(dossier.dossierCode)}/brief.md?lang=${locale}`),
    );
    if (res.ok) {
      const md = await res.text();
      triggerTextDownload(`${code}.${locale}.brief.md`, 'text/markdown;charset=utf-8', md);
      return;
    }
  }
  const md = buildVat129BriefMarkdown(input, result, code, result.dossierSha256, locale);
  triggerTextDownload(`${code}.${locale}.brief.md`, 'text/markdown;charset=utf-8', md);
}

export async function downloadAuditCsv(
  mode: ApiMode,
  dossier: Vat129DossierRecord | null,
  input: AssessmentInput,
  result: AssessmentResult,
): Promise<void> {
  const code = dossier?.dossierCode || 'VAT-PREVIEW';
  if (mode === 'server' && dossier) {
    const res = await fetch(
      withBase(`/api/dossiers/${encodeURIComponent(dossier.dossierCode)}/export.csv`),
    );
    if (res.ok) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      triggerTextDownload(`${code}.audit.csv`, 'text/csv;charset=utf-8', bytes);
      return;
    }
  }

  let csv: string;
  if (result.csvAudit && result.csvAudit.rows.length > 0) {
    csv = exportVatAuditCsv(result.csvAudit);
  } else {
    const header = [
      'dossier_code',
      'organization_name',
      'trn_number',
      'assessment_date',
      'status',
      'readiness_score',
      'new_regime_total_aed',
      'legacy_regime_total_aed',
      'net_savings_vs_legacy_aed',
      'credit_status',
      'days_remaining_to_cliff',
      'dossier_sha256',
    ].join(',');
    const row = [
      sanitizeCsvCell(code),
      sanitizeCsvCell(input.organizationName),
      sanitizeCsvCell(input.trnNumber),
      sanitizeCsvCell(input.assessmentDate),
      sanitizeCsvCell(result.status),
      sanitizeCsvCell(result.readinessScore),
      sanitizeCsvCell(result.penalty.newRegimeTotalAed),
      sanitizeCsvCell(result.penalty.legacyRegimeTotalAed),
      sanitizeCsvCell(result.penalty.netSavingsVsLegacyAed),
      sanitizeCsvCell(result.creditAndChain.creditStatus),
      sanitizeCsvCell(result.creditAndChain.daysRemainingToCliff),
      sanitizeCsvCell(result.dossierSha256),
    ].join(',');
    csv = `\uFEFF${header}\n${row}\n`;
  }
  const encoded = new TextEncoder().encode(csv);
  triggerTextDownload(`${code}.audit.csv`, 'text/csv;charset=utf-8', encoded);
}

export async function fetchPublicReport(
  mode: ApiMode,
  slugOrCode: string,
): Promise<PublicVat129Report | null> {
  if (mode === 'server') {
    const res = await fetch(withBase(`/api/public/reports/${encodeURIComponent(slugOrCode)}`), {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicVat129Report;
  }

  const list = readLocalList<Vat129DossierRecord>(LS_DOSSIERS);
  const found = list.find(
    (d) => (d.publicSlug === slugOrCode || d.dossierCode === slugOrCode) && Boolean(d.lockedAt),
  );
  if (!found) return null;

  const viewsMap = JSON.parse(localStorage.getItem(LS_VIEWS) || '{}') as Record<string, number>;
  const viewCount = (viewsMap[found.dossierCode] || 0) + 1;
  viewsMap[found.dossierCode] = viewCount;
  localStorage.setItem(LS_VIEWS, JSON.stringify(viewsMap));

  return {
    viewCount,
    lastViewedAt: new Date().toISOString(),
    report: {
      dossierCode: found.dossierCode,
      publicSlug: found.publicSlug || found.dossierCode,
      organizationName: found.organizationName,
      trnNumber: found.trnNumber,
      assessmentDate: found.assessmentDate,
      status: found.status,
      readinessScore: found.readinessScore,
      lockedAt: found.lockedAt!,
      dossierSha256: found.dossierSha256,
      legalDisclaimerEn: found.result.legalDisclaimerEn,
      legalDisclaimerAr: found.result.legalDisclaimerAr,
      penalty: found.result.penalty,
      creditAndChain: found.result.creditAndChain,
      briefAr: buildVat129BriefMarkdown(
        found.input,
        found.result,
        found.dossierCode,
        found.dossierSha256,
        'ar',
      ),
      briefEn: buildVat129BriefMarkdown(
        found.input,
        found.result,
        found.dossierCode,
        found.dossierSha256,
        'en',
      ),
    },
  };
}

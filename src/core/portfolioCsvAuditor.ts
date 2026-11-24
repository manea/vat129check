import {
  addFiveYearsIso,
  diffDaysUtc,
  isValidUaeTrn,
} from './fiveYearCreditEngine.ts';
import {
  DECISION_129_ANNUAL_LATE_RATE,
  UAE_TRANSITIONAL_CREDIT_CLIFF_DATE,
} from './vatCatalog.ts';
import type {
  ReadinessStatus,
  VatCsvAuditSummary,
  VatCsvRowAudit,
} from './types.ts';

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;
  if (tabCount > commaCount && tabCount >= semiCount) return '\t';
  if (semiCount > commaCount) return ';';
  return ',';
}

function parseBool(raw: string | undefined): boolean {
  const val = (raw ?? '').trim().toLowerCase();
  return val === 'true' || val === '1' || val === 'yes' || val === 'y';
}

function parseNumber(raw: string | undefined, fallback: number): number {
  const n = Number((raw ?? '').trim());
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
}

/**
 * Neutralizes CWE-1236 formula injection prefixes and applies RFC 4180 quoting.
 */
export function sanitizeCsvCell(value: string | number | boolean): string {
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function auditVatLedgersCsv(
  csvText: string,
  assessmentDate = '2026-11-25',
): VatCsvAuditSummary {
  const cleaned = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleaned) {
    return {
      totalRows: 0,
      readyCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      totalCreditAtRiskAed: 0,
      invalidTrnCount: 0,
      rows: [],
      parseErrors: ['UAE VAT CSV payload is empty.'],
    };
  }

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      totalRows: 0,
      readyCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      totalCreditAtRiskAed: 0,
      invalidTrnCount: 0,
      rows: [],
      parseErrors: ['CSV must include a header row and at least one period/supplier row.'],
    };
  }

  const delimiter = detectDelimiter(lines[0]!);
  const headers = splitCsvLine(lines[0]!, delimiter).map((h) => h.toLowerCase().trim());
  const idxOf = (candidates: string[]): number => {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxPeriodId = idxOf(['period_id', 'id', 'return_id']);
  const idxSupplier = idxOf(['supplier_name', 'entity_name', 'vendor_name', 'vendor']);
  const idxTrn = idxOf(['supplier_trn', 'trn', 'tax_registration_number']);
  const idxDate = idxOf(['tax_period_end', 'period_end', 'end_date']);
  const idxCredit = idxOf(['excess_credit_aed', 'credit_aed', 'excess_credit']);
  const idxUnpaid = idxOf(['unpaid_tax_aed', 'unpaid_aed', 'tax_due_aed']);
  const idxMonths = idxOf(['months_overdue', 'overdue_months', 'months']);
  const idxClaimed = idxOf(['refund_claimed', 'claimed', 'offset_applied']);
  const idxDocs = idxOf(['docs_retained', 'support_docs', 'customs_docs_retained']);

  if (idxPeriodId === -1 && idxSupplier === -1) {
    return {
      totalRows: 0,
      readyCount: 0,
      conditionalCount: 0,
      blockedCount: 0,
      totalCreditAtRiskAed: 0,
      invalidTrnCount: 0,
      rows: [],
      parseErrors: ['Missing period_id or supplier_name column in CSV header.'],
    };
  }

  const rows: VatCsvRowAudit[] = [];
  const parseErrors: string[] = [];
  let readyCount = 0;
  let conditionalCount = 0;
  let blockedCount = 0;
  let totalCreditAtRiskAed = 0;
  let invalidTrnCount = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const rowNumber = i + 1;
    const cols = splitCsvLine(lines[i]!, delimiter);
    const periodId = idxPeriodId !== -1 ? cols[idxPeriodId] || `ROW-${rowNumber}` : `ROW-${rowNumber}`;
    const supplierName =
      idxSupplier !== -1 ? cols[idxSupplier] || periodId : `Entity Row ${rowNumber}`;
    const supplierTrn = idxTrn !== -1 ? cols[idxTrn] || '' : '';
    const trnValid = isValidUaeTrn(supplierTrn);
    const taxPeriodEnd = idxDate !== -1 && cols[idxDate] ? cols[idxDate]! : '2026-06-30';
    const excessCreditAed = idxCredit !== -1 ? parseNumber(cols[idxCredit], 0) : 0;
    const unpaidTaxAed = idxUnpaid !== -1 ? parseNumber(cols[idxUnpaid], 0) : 0;
    const monthsOverdue = idxMonths !== -1 ? Math.round(parseNumber(cols[idxMonths], 0)) : 0;
    const refundClaimed = idxClaimed !== -1 ? parseBool(cols[idxClaimed]) : false;
    const docsRetained = idxDocs !== -1 ? parseBool(cols[idxDocs]) : true;

    const standardExpiry = addFiveYearsIso(taxPeriodEnd);
    const effectiveExpiryDate =
      excessCreditAed > 0 && standardExpiry <= UAE_TRANSITIONAL_CREDIT_CLIFF_DATE
        ? UAE_TRANSITIONAL_CREDIT_CLIFF_DATE
        : standardExpiry;
    const daysToCliff =
      excessCreditAed > 0 ? diffDaysUtc(assessmentDate, effectiveExpiryDate) : 9999;

    const projected14PctAnnualAed =
      Math.round(unpaidTaxAed * DECISION_129_ANNUAL_LATE_RATE * (monthsOverdue / 12) * 100) / 100;

    const issues: string[] = [];
    let hardBlock = false;

    if (!trnValid) {
      invalidTrnCount += 1;
      hardBlock = true;
      issues.push('Invalid 15-digit UAE TRN (must start with 100)');
    }

    if (!docsRetained) {
      hardBlock = true;
      issues.push('Missing RCM customs/supplier docs under Decree-Law 16/2025');
    }

    if (unpaidTaxAed > 0 && monthsOverdue > 0) {
      if (monthsOverdue >= 3) hardBlock = true;
      issues.push(
        `Overdue AED ${unpaidTaxAed.toLocaleString('en-US')} accruing 14% p.a. (${projected14PctAnnualAed} AED)`,
      );
    }

    let creditAtRisk = false;
    if (excessCreditAed > 0 && !refundClaimed) {
      if (daysToCliff < 0) {
        hardBlock = true;
        creditAtRisk = true;
        totalCreditAtRiskAed += excessCreditAed;
        issues.push(`5-year credit forfeited after ${effectiveExpiryDate}`);
      } else if (daysToCliff <= 90) {
        creditAtRisk = true;
        totalCreditAtRiskAed += excessCreditAed;
        if (daysToCliff <= 14) hardBlock = true;
        issues.push(`Transitional/5y credit cliff in ${daysToCliff}d (${effectiveExpiryDate})`);
      }
    }

    let status: ReadinessStatus;
    if (hardBlock) {
      status = 'blocked';
      blockedCount += 1;
    } else if (issues.length > 0) {
      status = 'conditional';
      conditionalCount += 1;
    } else {
      status = 'ready';
      readyCount += 1;
    }

    rows.push({
      rowNumber,
      periodId,
      supplierName,
      supplierTrn,
      trnValid,
      taxPeriodEnd,
      effectiveExpiryDate,
      daysToCliff,
      excessCreditAed,
      unpaidTaxAed,
      projected14PctAnnualAed,
      creditAtRisk,
      status,
      issues,
    });
  }

  return {
    totalRows: rows.length,
    readyCount,
    conditionalCount,
    blockedCount,
    totalCreditAtRiskAed: Math.round(totalCreditAtRiskAed * 100) / 100,
    invalidTrnCount,
    rows,
    parseErrors,
  };
}

export function exportVatAuditCsv(summary: VatCsvAuditSummary): string {
  const header = [
    'row_number',
    'period_id',
    'supplier_name',
    'supplier_trn',
    'trn_valid',
    'tax_period_end',
    'effective_expiry_date',
    'days_to_cliff',
    'excess_credit_aed',
    'unpaid_tax_aed',
    'projected_14pct_penalty_aed',
    'credit_at_risk',
    'status',
    'audit_issues',
  ].join(',');

  const lines = summary.rows.map((row) =>
    [
      sanitizeCsvCell(row.rowNumber),
      sanitizeCsvCell(row.periodId),
      sanitizeCsvCell(row.supplierName),
      sanitizeCsvCell(row.supplierTrn),
      sanitizeCsvCell(row.trnValid),
      sanitizeCsvCell(row.taxPeriodEnd),
      sanitizeCsvCell(row.effectiveExpiryDate),
      sanitizeCsvCell(row.daysToCliff),
      sanitizeCsvCell(row.excessCreditAed),
      sanitizeCsvCell(row.unpaidTaxAed),
      sanitizeCsvCell(row.projected14PctAnnualAed),
      sanitizeCsvCell(row.creditAtRisk),
      sanitizeCsvCell(row.status),
      sanitizeCsvCell(row.issues.join(' | ')),
    ].join(','),
  );

  return `\uFEFF${[header, ...lines].join('\n')}\n`;
}

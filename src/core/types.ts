export type VoluntaryDisclosureTiming = 'none' | 'pre_audit' | 'post_audit';
export type OffenseRepeatTier = 'none' | 'first_offense' | 'repeat_within_24m';
export type RecordViolationTier = 'none' | 'first_offense' | 'repeat';
export type CreditCliffStatus = 'none' | 'safe' | 'urgent_cliff' | 'forfeited' | 'protected';
export type ReadinessStatus = 'ready' | 'conditional' | 'blocked';
export type SeverityLevel = 'blocker' | 'warning' | 'info';

export type VatControlId =
  | 'VAT129-CTRL-01'
  | 'VAT129-CTRL-02'
  | 'VAT129-CTRL-03'
  | 'VAT129-CTRL-04'
  | 'VAT129-CTRL-05'
  | 'VAT129-CTRL-06';

export interface VatControlSpec {
  id: VatControlId;
  weight: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface AssessmentInput {
  organizationName: string;
  trnNumber: string;
  assessmentDate: string;
  unpaidTaxLiabilityAed: number;
  monthsOverdue: number;
  voluntaryDisclosureTiming: VoluntaryDisclosureTiming;
  voluntaryDisclosureTaxDiffAed: number;
  lateReturnOffenseTier: OffenseRepeatTier;
  recordKeepingViolationTier: RecordViolationTier;
  missingArabicRecords: boolean;
  excessCreditBalanceAed: number;
  excessCreditPeriodEndDate: string;
  hasSubmittedRefundOrOffset: boolean;
  appliesReverseCharge: boolean;
  hasCustomsAndSupplierDocs: boolean;
  vettedSupplierTrnsClean: boolean;
  zeroTaxDifferenceErrorOnly: boolean;
  ledgersCsv?: string;
  implementedControls: readonly VatControlId[];
  notes?: string;
}

export interface FindingItem {
  code: string;
  severity: SeverityLevel;
  titleEn: string;
  titleAr: string;
  detailEn: string;
  detailAr: string;
  legalRef: string;
}

export interface PenaltyEvaluationResult {
  latePayment14PctAed: number;
  vdMonthly1PctAed: number;
  vdPostAudit15PctAed: number;
  fixedAdministrativeAed: number;
  newRegimeTotalAed: number;
  legacyLatePaymentAed: number;
  legacyFixedAndVdAed: number;
  legacyRegimeTotalAed: number;
  netSavingsVsLegacyAed: number;
  unboundedAnnualExposureRisk: boolean;
}

export interface CreditAndChainResult {
  trnValidFormat: boolean;
  creditStatus: CreditCliffStatus;
  standardFiveYearExpiryDate: string;
  effectiveCliffDate: string;
  daysRemainingToCliff: number;
  transitional2026CliffApplies: boolean;
  selfInvoicingExempted: boolean;
  reverseChargeCompliant: boolean;
  supplyChainVettingCompliant: boolean;
}

export interface ControlEvaluationItem {
  id: VatControlId;
  titleEn: string;
  titleAr: string;
  implemented: boolean;
  weight: number;
}

export interface VatCsvRowAudit {
  rowNumber: number;
  periodId: string;
  supplierName: string;
  supplierTrn: string;
  trnValid: boolean;
  taxPeriodEnd: string;
  effectiveExpiryDate: string;
  daysToCliff: number;
  excessCreditAed: number;
  unpaidTaxAed: number;
  projected14PctAnnualAed: number;
  creditAtRisk: boolean;
  status: ReadinessStatus;
  issues: string[];
}

export interface VatCsvAuditSummary {
  totalRows: number;
  readyCount: number;
  conditionalCount: number;
  blockedCount: number;
  totalCreditAtRiskAed: number;
  invalidTrnCount: number;
  rows: VatCsvRowAudit[];
  parseErrors: string[];
}

export interface AssessmentResult {
  toolName: 'VAT129Check';
  version: string;
  legalDisclaimerEn: string;
  legalDisclaimerAr: string;
  organizationName: string;
  trnNumber: string;
  assessmentDate: string;
  penalty: PenaltyEvaluationResult;
  creditAndChain: CreditAndChainResult;
  csvAudit: VatCsvAuditSummary | null;
  status: ReadinessStatus;
  readinessScore: number;
  controls: ControlEvaluationItem[];
  findings: FindingItem[];
  canonicalDossierText: string;
  dossierSha256: string;
}

export interface VatPreset {
  id: string;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  input: AssessmentInput;
}

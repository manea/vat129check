import type {
  CreditCliffStatus,
  OffenseRepeatTier,
  ReadinessStatus,
  RecordViolationTier,
  VoluntaryDisclosureTiming,
} from '../core/types.ts';

export type Locale = 'ar' | 'en';
export type ThemeMode = 'dirham-vellum' | 'emirates-slate';

export const STATUS_META: Record<
  ReadinessStatus,
  { ar: string; en: string; colorVar: string; softVar: string }
> = {
  ready: {
    ar: 'جاهز وممتثل',
    en: 'READY',
    colorVar: 'var(--accent-teal)',
    softVar: 'var(--accent-teal-soft)',
  },
  conditional: {
    ar: 'مشروط (مهلة قريبة)',
    en: 'CONDITIONAL',
    colorVar: 'var(--accent-amber)',
    softVar: 'var(--accent-amber-soft)',
  },
  blocked: {
    ar: 'محجوب (مخالفة / سقوط)',
    en: 'BLOCKED',
    colorVar: 'var(--accent-crimson)',
    softVar: 'var(--accent-crimson-soft)',
  },
};

export const CREDIT_STATUS_LABELS: Record<CreditCliffStatus, { ar: string; en: string }> = {
  none: { ar: 'لا يوجد رصيد دائن', en: 'No Excess Credit' },
  safe: { ar: 'آمن (أكثر من 90 يوماً)', en: 'Safe (> 90 days left)' },
  urgent_cliff: { ar: 'حرج — قريب من هاوية 2026-12-31', en: 'Urgent — Near 2026-12-31 Cliff' },
  forfeited: { ar: 'ساقط بالتقادم (تجاوز 5 سنوات)', en: 'Forfeited (Past 5-Year Cutoff)' },
  protected: { ar: 'محمي (تم تقديم VAT311 / مقاصة)', en: 'Protected (VAT311 / Offset Filed)' },
};

export const VD_TIMING_LABELS: Record<VoluntaryDisclosureTiming, { ar: string; en: string }> = {
  none: { ar: 'لا يوجد إفصاح طوعي', en: 'No Voluntary Disclosure' },
  pre_audit: { ar: 'قبل إشعار التدقيق (1% شهرياً)', en: 'Pre-Audit Notice (1%/month)' },
  post_audit: { ar: 'بعد إشعار التدقيق (15% + 1%/شهر)', en: 'Post-Audit Notice (15% + 1%/mo)' },
};

export const LATE_TIER_LABELS: Record<OffenseRepeatTier, { ar: string; en: string }> = {
  none: { ar: 'لا يوجد تأخر إقرار', en: 'On-Time Return' },
  first_offense: { ar: 'تأخر أول مرة (1,000 د.إ)', en: 'First Offense (AED 1,000)' },
  repeat_within_24m: { ar: 'تكرار خلال 24 شهراً (2,000 د.إ)', en: 'Repeat Within 24m (AED 2,000)' },
};

export const RECORD_TIER_LABELS: Record<RecordViolationTier, { ar: string; en: string }> = {
  none: { ar: 'سجلات مكتملة ومنضبطة', en: 'Complete Tax Records' },
  first_offense: { ar: 'مخالفة حفظ سجلات أول مرة (10,000 د.إ)', en: 'First Offense (AED 10,000)' },
  repeat: { ar: 'تكرار مخالفة السجلات (20,000 د.إ)', en: 'Repeat Violation (AED 20,000)' },
};

export interface Vat129Translations {
  brandTagline: string;
  modeServer: string;
  modeLocal: string;
  switchLangLabel: string;
  themeDarkLabel: string;
  themeLightLabel: string;
  independentNoticeBadge: string;
  presetHeading: string;
  readinessScore: string;
  dossierCodeLabel: string;
  draftBadge: string;
  lockedBadge: string;
  tabScopePenalty: string;
  tabCliffControls: string;
  tabCsvAudit: string;
  tabVaultPrint: string;
  entityProfileTitle: string;
  orgNameLabel: string;
  trnLabel: string;
  trnValidHint: string;
  trnInvalidHint: string;
  assessmentDateLabel: string;
  penaltyInputsTitle: string;
  unpaidTaxLabel: string;
  monthsOverdueLabel: string;
  vdTimingLabel: string;
  vdTaxDiffLabel: string;
  lateReturnTierLabel: string;
  recordTierLabel: string;
  missingArabicLabel: string;
  zeroDiffErrorLabel: string;
  penaltyBreakdownTitle: string;
  new14PctLabel: string;
  vdMonthlyLabel: string;
  vdPostAuditLabel: string;
  fixedAdminLabel: string;
  newTotalLabel: string;
  legacyTotalLabel: string;
  netSavingsLabel: string;
  unboundedWarning: string;
  cliffSectionTitle: string;
  excessCreditLabel: string;
  creditPeriodEndLabel: string;
  refundSubmittedLabel: string;
  rcmChainTitle: string;
  appliesRcmLabel: string;
  customsDocsLabel: string;
  vettedTrnsLabel: string;
  controlsMatrixTitle: string;
  findingsTitle: string;
  noFindingsText: string;
  csvPanelTitle: string;
  csvUploadLabel: string;
  csvLoadSampleBtn: string;
  csvClearBtn: string;
  csvDownloadSafeBtn: string;
  csvTextareaLabel: string;
  csvTotalRows: string;
  csvBlockedRows: string;
  csvInvalidTrns: string;
  csvAtRiskCredit: string;
  vaultTitle: string;
  saveProfileBtn: string;
  savedProfilesLabel: string;
  createDossierBtn: string;
  updateDraftBtn: string;
  sealDossierBtn: string;
  duplicateBtn: string;
  deleteBtn: string;
  openPublicBtn: string;
  downloadBriefBtn: string;
  downloadCsvBtn: string;
  printA4Btn: string;
  savedDossiersHeading: string;
  noSavedDossiers: string;
  notesLabel: string;
  printSheetTitle: string;
  backToWorkspace: string;
  publicViewsLabel: string;
  sha256Label: string;
  legalFooterTitle: string;
  aedUnit: string;
}

const AR: Vat129Translations = {
  brandTagline: 'مدقق تعديلات ضريبة القيمة المضافة الإماراتية (16/2025 و17/2025) وغرامات 129/2025 (14% سنوياً)',
  modeServer: 'SQLite WAL حي',
  modeLocal: 'وضع المتصفح $0',
  switchLangLabel: 'EN',
  themeDarkLabel: 'ليلي (سليت)',
  themeLightLabel: 'نهاري (درهم)',
  independentNoticeBadge: 'أداة تقنية مستقلة — غير تابعة للهيئة FTA',
  presetHeading: 'سيناريوهات ضريبة القيمة المضافة الإماراتية الجاهزة (2026)',
  readinessScore: 'درجة الجاهزية',
  dossierCodeLabel: 'رمز الملف',
  draftBadge: 'مسودة عمل',
  lockedBadge: 'مختوم SHA-256',
  tabScopePenalty: 'الغرامات 14% والنطاق',
  tabCliffControls: 'مهلة 5 سنوات والضوابط',
  tabCsvAudit: 'تدقيق CSV للموردين والفترات',
  tabVaultPrint: 'خزنة الملفات والطباعة A4',
  entityProfileTitle: 'ملف المكلف والرقم الضريبي الإماراتي (TRN)',
  orgNameLabel: 'اسم المنشأة / الشركة المسجلة في الإمارات',
  trnLabel: 'الرقم الضريبي الإماراتي (15 خانة تبدأ بـ 100)',
  trnValidHint: 'صيغة رقم ضريبي إماراتي صحيحة (100xxxxxxxxxxxx)',
  trnInvalidHint: 'تنبيه: الرقم الضريبي الإماراتي يجب أن يتكون من 15 رقماً تبدأ بـ 100',
  assessmentDateLabel: 'تاريخ الفحص التقييمي',
  penaltyInputsTitle: 'حاسبة غرامات قرار مجلس الوزراء (129) لسنة 2025',
  unpaidTaxLabel: 'أصل الضريبة غير المسددة (د.إ)',
  monthsOverdueLabel: 'أشهر التأخر',
  vdTimingLabel: 'توقيت الإفصاح الطوعي (VD)',
  vdTaxDiffLabel: 'فارق الضريبة بالإفصاح الطوعي (د.إ)',
  lateReturnTierLabel: 'غرامة تأخر تقديم الإقرار',
  recordTierLabel: 'مخالفة حفظ السجلات الضريبية',
  missingArabicLabel: 'عدم توفر السجلات/الفواتير بالعربية عند الطلب (5,000 د.إ بدلاً من 20,000)',
  zeroDiffErrorLabel: 'خطأ بأثر ضريبي صفري (تبسيط 16/2025 وإعفاء غرامات الإفصاح)',
  penaltyBreakdownTitle: 'مقارنة النظام الجديد (129/2025) بالنظام القديم (2%+4%)',
  new14PctLabel: 'تراكم 14% سنوياً',
  vdMonthlyLabel: 'إفصاح طوعي (1%/شهر)',
  vdPostAuditLabel: 'مقطوعة بعد التدقيق (15%)',
  fixedAdminLabel: 'غرامات إدارية ثابتة',
  newTotalLabel: 'إجمالي 129/2025',
  legacyTotalLabel: 'النظام السابق (2%+4% و50%)',
  netSavingsLabel: 'صافي الوفورات المتوقعة',
  unboundedWarning: 'تحذير: فائدة الـ 14% السنوية تستمر دون سقف الـ 300% السابق عند التأخر >= 12 شهراً.',
  cliffSectionTitle: 'مهلة الـ 5 سنوات لأرصدة الاسترداد (المرسوم 16/2025) والهاوية الانتقالية 2026-12-31',
  excessCreditLabel: 'رصيد الضريبة الدائن القابل للاسترداد (د.إ)',
  creditPeriodEndLabel: 'تاريخ نهاية الفترة الضريبية التي نشأ فيها الرصيد',
  refundSubmittedLabel: 'تم تقديم طلب استرداد VAT311 أو إجراء مقاصة رسمياً قبل الموعد',
  rcmChainTitle: 'الاحتساب العكسي (إلغاء الفاتورة الذاتية) وفحص سلسلة التوريد',
  appliesRcmLabel: 'تطبق المنشأة آلية الاحتساب العكسي على واردات الخدمات/السلع',
  customsDocsLabel: 'تتوفر فواتير الموردين الأجانب والبيانات الجمركية والعقود الداعمة',
  vettedTrnsLabel: 'تم التحقق من أرقام TRN لجميع الموردين المحليين وسلامتهم من سلاسل التهرب',
  controlsMatrixTitle: 'الضوابط الرقابية الستة (VAT129Check Controls)',
  findingsTitle: 'الملاحظات والتنبيهات التشريعية التفصيلية',
  noFindingsText: 'جميع ضوابط تعديلات 16/2025 و129/2025 مكتملة دون ملاحظات حاجبة.',
  csvPanelTitle: 'تدقيق دفعات فواتير الموردين وأرصدة الفترات (CSV — حماية CWE-1236)',
  csvUploadLabel: 'استيراد ملف CSV / TXT',
  csvLoadSampleBtn: 'تحميل عينة CSV اختبارية',
  csvClearBtn: 'مسح CSV',
  csvDownloadSafeBtn: 'تنزيل CSV آمن (UTF-8 BOM)',
  csvTextareaLabel: 'محتوى CSV (يدعم الفاصلة أو الفاصلة المنقوطة)',
  csvTotalRows: 'إجمالي الصفوف',
  csvBlockedRows: 'صفوف محجوبة',
  csvInvalidTrns: 'أرقام TRN خاطئة',
  csvAtRiskCredit: 'أرصدة مهددة بالسقوط',
  vaultTitle: 'خزنة التقييمات والأختام التشفيرية (SHA-256) والطباعة',
  saveProfileBtn: 'حفظ كملف منشأة',
  savedProfilesLabel: 'ملفات المنشآت المحفوظة',
  createDossierBtn: 'حفظ كمسودة VAT-YYYY-0001',
  updateDraftBtn: 'تحديث المسودة',
  sealDossierBtn: 'اعتماد وختم الملف (SHA-256)',
  duplicateBtn: 'نسخ كمسودة جديدة',
  deleteBtn: 'حذف المسودة',
  openPublicBtn: 'فتح التقرير العام',
  downloadBriefBtn: 'تنزيل الملخص (.md)',
  downloadCsvBtn: 'تنزيل التدقيق (.csv)',
  printA4Btn: 'طباعة / حفظ A4 PDF',
  savedDossiersHeading: 'السجل المحفوظ لملفات الجاهزية',
  noSavedDossiers: 'لا توجد ملفات محفوظة بعد. احفظ مسودة لتوليد رقم مرجعي VAT-YYYY-0001.',
  notesLabel: 'ملاحظات المراجع الضريبي / المنشأة',
  printSheetTitle: 'ورقة الامتثال المعتمدة للطباعة (A4 PDF)',
  backToWorkspace: 'العودة إلى لوحة التدقيق',
  publicViewsLabel: 'مرات المشاهدة',
  sha256Label: 'بصمة التطابق SHA-256',
  legalFooterTitle: 'إخلاء المسؤولية التشريعية والاستقلالية',
  aedUnit: 'د.إ',
};

const EN: Vat129Translations = {
  brandTagline: 'UAE VAT Amendments Auditor (Decree-Law 16 & 17/2025 + Decision 129/2025 14% p.a.)',
  modeServer: 'SQLite WAL Live',
  modeLocal: 'Browser $0 Mode',
  switchLangLabel: 'AR',
  themeDarkLabel: 'Slate Dark',
  themeLightLabel: 'Dirham Light',
  independentNoticeBadge: 'Independent Utility — Not FTA Affiliated',
  presetHeading: 'UAE VAT Amendments Scenarios (2026 Presets)',
  readinessScore: 'Readiness Score',
  dossierCodeLabel: 'Dossier Code',
  draftBadge: 'Working Draft',
  lockedBadge: 'Sealed SHA-256',
  tabScopePenalty: '14% Penalties & Scope',
  tabCliffControls: '5-Yr Cliff & Controls',
  tabCsvAudit: 'Ledger & TRN CSV Audit',
  tabVaultPrint: 'Dossier Vault & A4 Print',
  entityProfileTitle: 'UAE Taxable Person & 15-Digit TRN Profile',
  orgNameLabel: 'UAE Registered Legal Entity Name',
  trnLabel: 'UAE TRN (15 digits starting with 100)',
  trnValidHint: 'Valid 15-digit UAE TRN format (100xxxxxxxxxxxx)',
  trnInvalidHint: 'Warning: UAE FTA TRN must be 15 digits starting with 100',
  assessmentDateLabel: 'Assessment Date',
  penaltyInputsTitle: 'Cabinet Decision No. 129 of 2025 Penalty Calculator',
  unpaidTaxLabel: 'Overdue Unpaid Principal VAT (AED)',
  monthsOverdueLabel: 'Months Overdue',
  vdTimingLabel: 'Voluntary Disclosure (VD) Timing',
  vdTaxDiffLabel: 'Voluntary Disclosure Tax Difference (AED)',
  lateReturnTierLabel: 'Late VAT Return Administrative Tier',
  recordTierLabel: 'Tax Record-Keeping Violation Tier',
  missingArabicLabel: 'Failure to furnish tax records in Arabic on request (AED 5,000 vs 20,000)',
  zeroDiffErrorLabel: 'Zero-tax-difference return error (16/2025 VD surcharge waiver)',
  penaltyBreakdownTitle: 'Decision 129/2025 vs. Legacy Penalty Regime (2%+4% / 50%)',
  new14PctLabel: '14% p.a. Arrears',
  vdMonthlyLabel: 'Pre/Post-Audit 1%/mo VD',
  vdPostAuditLabel: '15% Post-Audit VD',
  fixedAdminLabel: 'Fixed Administrative',
  newTotalLabel: 'Decision 129/2025 Total',
  legacyTotalLabel: 'Legacy Comparator Total',
  netSavingsLabel: 'Net Savings vs. Legacy',
  unboundedWarning: 'Alert: Flat 14% p.a. accrues continuously without the legacy 300% cap when overdue >= 12 months.',
  cliffSectionTitle: '5-Year Recoverable Credit Expiry (Decree-Law 16/2025) & 2026-12-31 Cliff',
  excessCreditLabel: 'Excess Recoverable VAT Credit Balance (AED)',
  creditPeriodEndLabel: 'Origin Tax Period End Date',
  refundSubmittedLabel: 'VAT311 refund claim or tax liability offset formally filed before cutoff',
  rcmChainTitle: 'Reverse Charge (No Self-Invoicing) & Anti-Evasion Supply Chain',
  appliesRcmLabel: 'Business imports goods/services subject to Reverse Charge Mechanism (RCM)',
  customsDocsLabel: 'Foreign supplier invoices, UAE Customs Bayans & contracts retained',
  vettedTrnsLabel: 'Domestic supplier 15-digit TRNs verified & commercial substance vetted',
  controlsMatrixTitle: 'Six UAE VAT Compliance Controls',
  findingsTitle: 'Detailed Regulatory Findings & Actions',
  noFindingsText: 'All Decree-Law 16/2025 and Cabinet Decision 129/2025 controls passed cleanly.',
  csvPanelTitle: 'Batch Period & Supplier TRN Ledger CSV Auditor (CWE-1236 Safe)',
  csvUploadLabel: 'Upload CSV / TXT File',
  csvLoadSampleBtn: 'Load Sample CSV',
  csvClearBtn: 'Clear CSV',
  csvDownloadSafeBtn: 'Download Safe CSV (UTF-8 BOM)',
  csvTextareaLabel: 'CSV Content (comma or semicolon delimited)',
  csvTotalRows: 'Total Rows',
  csvBlockedRows: 'Blocked Rows',
  csvInvalidTrns: 'Invalid TRNs',
  csvAtRiskCredit: 'Credits At Risk',
  vaultTitle: 'Cryptographic Dossier Vault (SHA-256) & Exports',
  saveProfileBtn: 'Save Entity Profile',
  savedProfilesLabel: 'Saved UAE Entity Profiles',
  createDossierBtn: 'Save Draft VAT-YYYY-0001',
  updateDraftBtn: 'Update Draft',
  sealDossierBtn: 'Finalize & Seal (SHA-256)',
  duplicateBtn: 'Duplicate Draft',
  deleteBtn: 'Delete Draft',
  openPublicBtn: 'Open Public Report',
  downloadBriefBtn: 'Download Brief (.md)',
  downloadCsvBtn: 'Download Audit (.csv)',
  printA4Btn: 'Print / Save A4 PDF',
  savedDossiersHeading: 'Saved Readiness Dossiers',
  noSavedDossiers: 'No saved dossiers yet. Save a draft to mint VAT-YYYY-0001.',
  notesLabel: 'Tax Reviewer / Entity Notes',
  printSheetTitle: 'A4 Printable Compliance Dossier Sheet',
  backToWorkspace: 'Back to Auditor',
  publicViewsLabel: 'Views',
  sha256Label: 'SHA-256 Canonical Digest',
  legalFooterTitle: 'Statutory & Independence Disclaimer',
  aedUnit: 'AED',
};

export function getTranslations(locale: Locale): Vat129Translations {
  return locale === 'ar' ? AR : EN;
}

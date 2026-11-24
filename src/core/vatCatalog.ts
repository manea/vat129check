import type { VatControlSpec } from './types.ts';

export const VAT129_TOOL_VERSION = '0.5.0';
export const UAE_DECREE_16_EFFECTIVE_DATE = '2026-01-01';
export const UAE_DECISION_129_EFFECTIVE_DATE = '2026-04-14';
export const UAE_TRANSITIONAL_CREDIT_CLIFF_DATE = '2026-12-31';

export const DECISION_129_ANNUAL_LATE_RATE = 0.14;
export const DECISION_129_VD_MONTHLY_RATE = 0.01;
export const DECISION_129_POST_AUDIT_VD_RATE = 0.15;

export const LATE_RETURN_FIRST_AED = 1_000;
export const LATE_RETURN_REPEAT_AED = 2_000;
export const RECORD_KEEPING_FIRST_AED = 10_000;
export const RECORD_KEEPING_REPEAT_AED = 20_000;
export const MISSING_ARABIC_RECORDS_NEW_AED = 5_000;
export const MISSING_ARABIC_RECORDS_LEGACY_AED = 20_000;

export const LEGAL_DISCLAIMER_EN =
  'Notice: VAT129Check is an independent technical readiness calculator and is NOT affiliated with or endorsed by the UAE Federal Tax Authority (FTA), Ministry of Finance, or any registered tax agent. Calculations are indicative only and do not constitute formal tax or legal advice.';

export const LEGAL_DISCLAIMER_AR =
  'تنبيه مهم: أداة VAT129Check أداة فحص وحساب تقنية مستقلة وليست تابعة أو معتمدة من الهيئة الاتحادية للضرائب الإماراتية (FTA) أو وزارة المالية أو أي وكيل ضريبي. المخرجات استرشادية ولا تُعد استشارة ضريبية أو قانونية رسمية.';

export const VAT129_CONTROLS: readonly VatControlSpec[] = [
  {
    id: 'VAT129-CTRL-01',
    weight: 20,
    titleEn: '5-Year Recoverable Credit Ledger Sweep (Before 2026-12-31 Cliff)',
    titleAr: 'جرد أرصدة الفوائض الضريبية ذات عمر 5 سنوات قبل مهلة 2026-12-31',
    descriptionEn:
      'Reconcile all VAT201 excess input tax balances from 2020–2021 and older periods and file VAT311 refund applications or offsets before statutory forfeiture.',
    descriptionAr:
      'مطابقة فوائض ضريبة المدخلات في إقرارات VAT201 للفترات السابقة وتقديم طلبات استرداد VAT311 قبل سقوط الحق بعد 5 سنوات.',
  },
  {
    id: 'VAT129-CTRL-02',
    weight: 20,
    titleEn: 'Pre-Audit Voluntary Disclosure & 14% Annual Cash Settlement Control',
    titleAr: 'ضابط الإفصاح الطوعي الاستباقي (1%/شهر) وسداد الضريبة قبل إشعار التدقيق',
    descriptionEn:
      'File Voluntary Disclosures proactively (1%/month under Decision 129/2025) and settle principal tax quickly to avoid uncapped 14% annual interest and 15% post-audit surcharges.',
    descriptionAr:
      'تقديم الإفصاح الطوعي استباقياً (1% شهرياً وفق قرار 129/2025) وسداد أصل الضريبة لتفادي فائدة الـ 14% السنوية المفتوحة وغرامة الـ 15% بعد التدقيق.',
  },
  {
    id: 'VAT129-CTRL-03',
    weight: 20,
    titleEn: 'Post-16/2025 Reverse Charge Evidence Pack (No Self-Invoicing)',
    titleAr: 'حفظ حزمة مستندات الاحتساب العكسي (دون الحاجة للفاتورة الذاتية)',
    descriptionEn:
      'Retain supplier commercial invoices, UAE customs declarations (Bayans), and contracts for imported services/goods without redundant self-invoicing.',
    descriptionAr:
      'الاحتفاظ بفواتير الموردين الأجانب والبيانات الجمركية والعقود للواردات الخاضعة للاحتساب العكسي بعد إلغاء إلزامية الفاتورة الذاتية.',
  },
  {
    id: 'VAT129-CTRL-04',
    weight: 15,
    titleEn: '15-Digit UAE TRN Verification & Anti-Evasion Chain Due Diligence',
    titleAr: 'التحقق من الرقم الضريبي الإماراتي (100xxxxxxxxxxxx) وسلامة الموردين',
    descriptionEn:
      'Verify every domestic supplier 15-digit FTA TRN (`100...`) and commercial substance to mitigate "knew or should have known" input tax disallowance.',
    descriptionAr:
      'التدقيق المنتظم للرقم الضريبي الإماراتي للموردين (15 خانة تبدأ بـ 100) والتحقق من موثوقية التوريد لتجنب رفض ضريبة المدخلات.',
  },
  {
    id: 'VAT129-CTRL-05',
    weight: 15,
    titleEn: 'Bilingual Arabic/English Tax Records Readiness (AED 5,000 Penalty Guard)',
    titleAr: 'جاهزية السجلات والفواتير باللغة العربية (الوقاية من غرامة 5,000 د.إ)',
    descriptionEn:
      'Ensure accounting ledgers, tax invoices, and customs summaries can be produced in Arabic cleanly on FTA audit request.',
    descriptionAr:
      'ضمان جاهزية الدفاتر المحاسبية والفواتير والبيانات الجمركية لتقديمها باللغة العربية عند طلب الهيئة لتفادي الغرامة الإدارية.',
  },
  {
    id: 'VAT129-CTRL-06',
    weight: 10,
    titleEn: '5-Year / 15-Year Audit Archive Retention & Reproducible SHA-256 Briefs',
    titleAr: 'أرشفة السجلات لـ 5 سنوات (و15 سنة للتحوط) وتوثيق بصمة الملف',
    descriptionEn:
      'Maintain immutable 5-year standard VAT ledgers aligned with Federal Decree-Law No. 17 of 2025 statute-of-limitations periods.',
    descriptionAr:
      'حفظ السجلات الضريبية الموثقة لمدة لا تقل عن 5 سنوات متوافقة مع مدد التقادم القانونية في قانون الإجراءات الضريبية المعدّل.',
  },
];

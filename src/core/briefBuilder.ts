import type { AssessmentInput, AssessmentResult } from './types.ts';

function escMdCell(value: unknown): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatAed(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString('en-US') : '0';
}

export function buildVat129BriefMarkdown(
  input: AssessmentInput,
  result: AssessmentResult,
  dossierCode: string,
  sha256Digest: string,
  locale: 'en' | 'ar' = 'ar',
): string {
  const digest = sha256Digest || result.dossierSha256;

  if (locale === 'ar') {
    const lines: string[] = [
      `# ملف جاهزية تعديلات ضريبة القيمة المضافة الإماراتية — \`${dossierCode}\``,
      '',
      `> **تنبيه الحوكمة وعدم الاعتماد الرسمي:** ${result.legalDisclaimerAr}`,
      '',
      '## 1. ملخص المنشأة وحالة الجاهزية',
      '',
      '| البند | القيمة |',
      '|---|---|',
      `| رمز الملف | \`${escMdCell(dossierCode)}\` |`,
      `| الأداة والإصدار | \`VAT129Check v${escMdCell(result.version)}\` |`,
      `| اسم المنشأة | ${escMdCell(input.organizationName)} |`,
      `| الرقم الضريبي الإماراتي (TRN) | \`${escMdCell(input.trnNumber)}\` (${result.creditAndChain.trnValidFormat ? 'صيغة صحيحة — 15 خانة تبدأ بـ 100' : 'صيغة غير مطابقة لـ 100xxxxxxxxxxxx'}) |`,
      `| تاريخ التقييم | \`${escMdCell(input.assessmentDate)}\` |`,
      `| حالة الجاهزية | **${result.status.toUpperCase()}** |`,
      `| درجة الجاهزية | **${result.readinessScore}/100** |`,
      `| بصمة SHA-256 القانونية | \`${escMdCell(digest)}\` |`,
      '',
      '## 2. تحليل غرامات قرار مجلس الوزراء (129) لسنة 2025 مقابل النظام القديم',
      '',
      `- أصل الضريبة المتأخرة: **${formatAed(input.unpaidTaxLiabilityAed)} د.إ** لمدة **${input.monthsOverdue} شهر**`,
      `- غرامة التأخر الثابتة **14% سنوياً** (\`1.1667%/شهر\`): **${formatAed(result.penalty.latePayment14PctAed)} د.إ**`,
      `- الإفصاح الطوعي الشهري (**1%/شهر** على فارق \`${formatAed(input.voluntaryDisclosureTaxDiffAed)}\` د.إ): **${formatAed(result.penalty.vdMonthly1PctAed)} د.إ**`,
      `- غرامة الإفصاح بعد إشعار التدقيق (**15% مقطوعة**): **${formatAed(result.penalty.vdPostAudit15PctAed)} د.إ**`,
      `- الغرامات الإدارية الثابتة (تأخر إقرار/سجلات/عدم توفر عربية \`5,000\` د.إ): **${formatAed(result.penalty.fixedAdministrativeAed)} د.إ**`,
      `- إجمالي الغرامات بالنظام الجديد (129/2025): **${formatAed(result.penalty.newRegimeTotalAed)} د.إ**`,
      `- إجمالي الغرامات بالنظام السابق (2%+4%/شهر بسقف 300% و5%/50%): **${formatAed(result.penalty.legacyRegimeTotalAed)} د.إ**`,
      `- صافي الوفورات مقارنة بالنظام السابق: **${formatAed(result.penalty.netSavingsVsLegacyAed)} د.إ**`,
      `- تنبيه استمرار احتساب الـ 14% دون سقف 300%: **${result.penalty.unboundedAnnualExposureRisk ? 'نعم — تعرض مفتوح لـ >=12 شهراً' : 'لا'}**`,
      '',
      '## 3. مهلة الخمس سنوات لاسترداد الأرصدة الدائنة والاحتساب العكسي (المرسوم بقانون 16/2025)',
      '',
      `- رصيد الضريبة الدائن القابل للاسترداد: **${formatAed(input.excessCreditBalanceAed)} د.إ** (نهاية الفترة: \`${escMdCell(input.excessCreditPeriodEndDate)}\`)`,
      `- حالة الرصيد الدائن: \`${result.creditAndChain.creditStatus}\``,
      `- تاريخ السقوط القياسي (5 سنوات): \`${result.creditAndChain.standardFiveYearExpiryDate}\``,
      `- الموعد النهائي الفعلي للسقوط (أو المهلة الانتقالية \`2026-12-31\`): \`${result.creditAndChain.effectiveCliffDate}\` (${result.creditAndChain.daysRemainingToCliff} يوماً متبقياً)`,
      `- انطباق الهاوية الانتقالية 2026-12-31: **${result.creditAndChain.transitional2026CliffApplies ? 'نعم — أرصدة تاريخية حرجة' : 'لا'}**`,
      `- الإعفاء من الفاتورة الذاتية للاحتساب العكسي (16/2025): **${result.creditAndChain.selfInvoicingExempted ? 'مطبق (يكتفى بمستندات المورد والبيان الجمركي)' : 'غير منطبق'}**`,
      `- امتثال مستندات الاحتساب العكسي: **${result.creditAndChain.reverseChargeCompliant ? 'مكتمل ✓' : 'ناقص ✗'}**`,
      `- فحص الموردين وسلاسل التهرب الضريبي: **${result.creditAndChain.supplyChainVettingCompliant ? 'مكتمل ✓' : 'غير مكتمل ✗'}**`,
      '',
      '## 4. الضوابط الرقابية الستة (VAT129Check Controls)',
      '',
      '| الضابط | الحالة | الوزن | الوصف |',
      '|---|---|---|---|',
      ...result.controls.map(
        (ctrl) =>
          `| \`${ctrl.id}\` | ${ctrl.implemented ? 'مُنفذ ✓' : 'ناقص ✗'} | ${ctrl.weight} | ${escMdCell(ctrl.titleAr)} |`,
      ),
    ];

    if (result.csvAudit) {
      lines.push(
        '',
        '## 5. تدقيق دفعات الفترات والموردين (CSV)',
        '',
        `- الإجمالي: ${result.csvAudit.totalRows} | جاهز: ${result.csvAudit.readyCount} | مشروط: ${result.csvAudit.conditionalCount} | محجوب: ${result.csvAudit.blockedCount} | أرقام TRN غير صالحة: ${result.csvAudit.invalidTrnCount} | الأرصدة المعرضة للسقوط: ${formatAed(result.csvAudit.totalCreditAtRiskAed)} د.إ`,
        '',
      );
      if (result.csvAudit.rows.length > 0) {
        lines.push(
          '| الصف | رمز الفترة | المورد | TRN | السقوط الفعلي | الرصيد الدائن (د.إ) | الحالة |',
          '|---|---|---|---|---|---|---|',
          ...result.csvAudit.rows.map(
            (row) =>
              `| ${row.rowNumber} | \`${escMdCell(row.periodId)}\` | ${escMdCell(row.supplierName)} | \`${escMdCell(row.supplierTrn)}\` | \`${escMdCell(row.effectiveExpiryDate)}\` | ${formatAed(row.excessCreditAed)} | **${row.status.toUpperCase()}** |`,
          ),
        );
      }
    }

    lines.push(
      '',
      `## ${result.csvAudit ? '6' : '5'}. الملاحظات والنتائج التفصيلية`,
      '',
      ...(result.findings.length > 0
        ? result.findings.map(
            (f) =>
              `- **[${f.severity.toUpperCase()}] ${f.code} — ${escMdCell(f.titleAr)}:** ${escMdCell(f.detailAr)} *(${escMdCell(f.legalRef)})*`,
          )
        : ['- لا توجد ملاحظات مانعة؛ المنشأة مستوفية لمتطلبات التعديلات الضريبية المحددة.']),
    );

    if (input.notes) {
      lines.push('', '### ملاحظات المستخدم', '', escMdCell(input.notes));
    }

    return `${lines.join('\n')}\n`;
  }

  const lines: string[] = [
    `# UAE VAT Amendments Readiness Brief — \`${dossierCode}\``,
    '',
    `> **Independence Disclaimer:** ${result.legalDisclaimerEn}`,
    '',
    '## 1. Taxable Person Profile & Readiness Summary',
    '',
    '| Field | Value |',
    '|---|---|',
    `| Dossier Code | \`${escMdCell(dossierCode)}\` |`,
    `| Tool / Version | \`VAT129Check v${escMdCell(result.version)}\` |`,
    `| Organization | ${escMdCell(input.organizationName)} |`,
    `| UAE TRN (15 digits) | \`${escMdCell(input.trnNumber)}\` (${result.creditAndChain.trnValidFormat ? 'Valid `100xxxxxxxxxxxx` Format' : 'Invalid Format'}) |`,
    `| Assessment Date | \`${escMdCell(input.assessmentDate)}\` |`,
    `| Readiness Status | **${result.status.toUpperCase()}** |`,
    `| Readiness Score | **${result.readinessScore}/100** |`,
    `| Canonical SHA-256 Digest | \`${escMdCell(digest)}\` |`,
    '',
    '## 2. Cabinet Decision No. 129 of 2025 Penalty Comparison vs. Legacy Regime',
    '',
    `- Overdue Principal VAT: **AED ${formatAed(input.unpaidTaxLiabilityAed)}** across **${input.monthsOverdue} month(s)**`,
    `- Flat **14% p.a.** Late Payment Accrual (\`1.1667%/month\`): **AED ${formatAed(result.penalty.latePayment14PctAed)}**`,
    `- Pre-Audit Monthly Voluntary Disclosure (**1%/month** on AED ${formatAed(input.voluntaryDisclosureTaxDiffAed)} diff): **AED ${formatAed(result.penalty.vdMonthly1PctAed)}**`,
    `- Post-Audit Voluntary Disclosure Fixed Surcharge (**15%**): **AED ${formatAed(result.penalty.vdPostAudit15PctAed)}**`,
    `- Fixed Administrative Penalties (late return / records / AED 5,000 Arabic omission): **AED ${formatAed(result.penalty.fixedAdministrativeAed)}**`,
    `- Total Under Decision 129/2025: **AED ${formatAed(result.penalty.newRegimeTotalAed)}**`,
    `- Legacy Comparator (2%+4%/mo up to 300%, 5%/50% VD, AED 20k Arabic): **AED ${formatAed(result.penalty.legacyRegimeTotalAed)}**`,
    `- Net Savings vs. Legacy Regime: **AED ${formatAed(result.penalty.netSavingsVsLegacyAed)}**`,
    `- Unbounded 14% Annual Exposure Flag (>= 12 months): **${result.penalty.unboundedAnnualExposureRisk ? 'Yes — No 300% Cap Applies' : 'No'}**`,
    '',
    '## 3. 5-Year Credit Expiry Cliff (2026-12-31) & Reverse Charge Supply Chain (Decree-Law 16/2025)',
    '',
    `- Excess Recoverable VAT Credit: **AED ${formatAed(input.excessCreditBalanceAed)}** (Period End: \`${escMdCell(input.excessCreditPeriodEndDate)}\`)`,
    `- Credit Status: \`${result.creditAndChain.creditStatus}\``,
    `- Standard 5-Year Expiry Date: \`${result.creditAndChain.standardFiveYearExpiryDate}\``,
    `- Effective Statutory Cliff Date (or Transitional \`2026-12-31\`): \`${result.creditAndChain.effectiveCliffDate}\` (${result.creditAndChain.daysRemainingToCliff} day(s) remaining)`,
    `- Transitional 2026-12-31 Cliff Applies: **${result.creditAndChain.transitional2026CliffApplies ? 'Yes — Urgent VAT311 Action Required' : 'No'}**`,
    `- Reverse Charge Self-Invoicing Abolished (16/2025): **${result.creditAndChain.selfInvoicingExempted ? 'Exempted (Retain Customs Bayan & Supplier Invoice)' : 'N/A'}**`,
    `- Reverse Charge Evidence Compliance: **${result.creditAndChain.reverseChargeCompliant ? 'Compliant' : 'Missing Evidence'}**`,
    `- Supplier TRN & Anti-Evasion Chain Vetting: **${result.creditAndChain.supplyChainVettingCompliant ? 'Clean' : 'Unvetted / At Risk'}**`,
    '',
    '## 4. Controls Assessment Matrix',
    '',
    '| Control | Status | Weight | Description |',
    '|---|---|---|---|',
    ...result.controls.map(
      (ctrl) =>
        `| \`${ctrl.id}\` | ${ctrl.implemented ? 'Implemented' : 'Gap'} | ${ctrl.weight} | ${escMdCell(ctrl.titleEn)} |`,
    ),
  ];

  if (result.csvAudit) {
    lines.push(
      '',
      '## 5. Supplier & Period VAT Ledger CSV Audit',
      '',
      `- Total Rows: ${result.csvAudit.totalRows} | Ready: ${result.csvAudit.readyCount} | Conditional: ${result.csvAudit.conditionalCount} | Blocked: ${result.csvAudit.blockedCount} | Invalid TRNs: ${result.csvAudit.invalidTrnCount} | Credit at Risk: AED ${formatAed(result.csvAudit.totalCreditAtRiskAed)}`,
      '',
    );
    if (result.csvAudit.rows.length > 0) {
      lines.push(
        '| Row | Period ID | Supplier | TRN | Effective Cliff | Excess Credit (AED) | Status |',
        '|---|---|---|---|---|---|---|',
        ...result.csvAudit.rows.map(
          (row) =>
            `| ${row.rowNumber} | \`${escMdCell(row.periodId)}\` | ${escMdCell(row.supplierName)} | \`${escMdCell(row.supplierTrn)}\` | \`${escMdCell(row.effectiveExpiryDate)}\` | ${formatAed(row.excessCreditAed)} | **${row.status.toUpperCase()}** |`,
        ),
      );
    }
  }

  lines.push(
    '',
    `## ${result.csvAudit ? '6' : '5'}. Detailed Regulatory Findings`,
    '',
    ...(result.findings.length > 0
      ? result.findings.map(
          (f) =>
            `- **[${f.severity.toUpperCase()}] ${f.code} — ${escMdCell(f.titleEn)}:** ${escMdCell(f.detailEn)} *(${escMdCell(f.legalRef)})*`,
        )
      : ['- No blocking findings; UAE VAT 16/2025 & 129/2025 obligations are satisfied.']),
  );

  if (input.notes) {
    lines.push('', '### Assessment Notes', '', escMdCell(input.notes));
  }

  return `${lines.join('\n')}\n`;
}

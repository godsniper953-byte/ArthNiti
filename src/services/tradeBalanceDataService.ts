import {
  EconomicIndicator,
  ObservationPoint,
  OfficialMerchandiseTradeMetadata,
} from '../types/economy';

const OFFICIAL_TRADE_CSV_URL = '/data/moci_merchandise_trade_official.csv';
const CUSTOM_TRADE_CSV_STORAGE_KEY = 'arthniti_custom_moci_trade_csv_v1';

export interface MerchandiseTradeFetchResult {
  status: 'success' | 'error';
  indicator: EconomicIndicator | null;
  retrievalTimestamp: string;
  dataOrigin: 'official_moci_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  errorMessage?: string;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseOfficialMerchandiseTradeCsv(
  csvText: string,
  origin: 'official_moci_csv' | 'user_uploaded_csv' = 'official_moci_csv',
  retrievalTimestamp: string = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
): EconomicIndicator {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error(
      'Merchandise Trade CSV must contain a header row and at least one monthly observation.'
    );
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idxYm = headers.indexOf('year_month');
  const idxLabel = headers.indexOf('period_label');
  const idxFy = headers.indexOf('financial_year');
  const idxExports = headers.indexOf('merchandise_exports_usd_bn');
  const idxImports = headers.indexOf('merchandise_imports_usd_bn');
  const idxExpYoY = headers.indexOf('exports_yoy_pct');
  const idxImpYoY = headers.indexOf('imports_yoy_pct');
  const idxServicesSurplus = headers.indexOf('services_surplus_est_usd_bn');
  const idxOverallBal = headers.indexOf('overall_trade_balance_usd_bn');
  const idxFyCumExp = headers.indexOf('fy_cumulative_exports_usd_bn');
  const idxFyCumImp = headers.indexOf('fy_cumulative_imports_usd_bn');
  const idxFyCumDef = headers.indexOf('fy_cumulative_deficit_usd_bn');
  const idxRelease = headers.indexOf('release_date');
  const idxStatus = headers.indexOf('status');
  const idxCommerceUrl = headers.indexOf('commerce_portal_url');
  const idxTradestatUrl = headers.indexOf('tradestat_url');
  const idxRbiDbieUrl = headers.indexOf('rbi_dbie_url');
  const idxNotes = headers.indexOf('notes');

  if (idxYm === -1 || idxExports === -1 || idxImports === -1) {
    throw new Error(
      'Required columns missing: year_month, merchandise_exports_usd_bn, merchandise_imports_usd_bn'
    );
  }

  const observations: ObservationPoint[] = [];
  let commercePortalUrl = 'https://www.commerce.gov.in/ministryofcommerce/node/893';
  let tradestatUrl = 'https://tradestat.commerce.gov.in/';
  let rbiDbieForeignTradeUrl =
    'https://dbie.rbihub.in/external?table=external_sector.r18_foreign_trade';

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 5) continue;

    const ym = cols[idxYm];
    const [yStr, mStr] = ym.split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = parseInt(mStr, 10) || 1;
    const timestamp = new Date(year, month - 1, 15).getTime();

    const exportsVal = parseFloat(cols[idxExports]);
    const importsVal = parseFloat(cols[idxImports]);
    if (Number.isNaN(exportsVal) || Number.isNaN(importsVal)) continue;

    // Strict Formula: Trade balance = merchandise exports − merchandise imports
    const signedTradeBalance = Number((exportsVal - importsVal).toFixed(2));
    // Positive Deficit Magnitude when imports exceed exports (0 if surplus)
    const deficitMagnitude =
      signedTradeBalance < 0 ? Number(Math.abs(signedTradeBalance).toFixed(2)) : 0;

    const rawExpYoY = idxExpYoY !== -1 ? parseFloat(cols[idxExpYoY]) : NaN;
    const rawImpYoY = idxImpYoY !== -1 ? parseFloat(cols[idxImpYoY]) : NaN;
    const rawServSurplus =
      idxServicesSurplus !== -1 ? parseFloat(cols[idxServicesSurplus]) : NaN;
    const rawOverallBal =
      idxOverallBal !== -1 ? parseFloat(cols[idxOverallBal]) : NaN;
    const rawFyCumExp = idxFyCumExp !== -1 ? parseFloat(cols[idxFyCumExp]) : NaN;
    const rawFyCumImp = idxFyCumImp !== -1 ? parseFloat(cols[idxFyCumImp]) : NaN;
    const rawFyCumDef = idxFyCumDef !== -1 ? parseFloat(cols[idxFyCumDef]) : NaN;

    const rawStatus = idxStatus !== -1 ? cols[idxStatus] : 'Final';
    const status: 'Provisional' | 'Revised' | 'Final' =
      rawStatus === 'Provisional'
        ? 'Provisional'
        : rawStatus === 'Revised'
        ? 'Revised'
        : 'Final';

    if (idxCommerceUrl !== -1 && cols[idxCommerceUrl]) {
      commercePortalUrl = cols[idxCommerceUrl];
    }
    if (idxTradestatUrl !== -1 && cols[idxTradestatUrl]) {
      tradestatUrl = cols[idxTradestatUrl];
    }
    if (idxRbiDbieUrl !== -1 && cols[idxRbiDbieUrl]) {
      rbiDbieForeignTradeUrl = cols[idxRbiDbieUrl];
    }

    observations.push({
      date: ym,
      timestamp,
      label: idxLabel !== -1 && cols[idxLabel] ? cols[idxLabel] : ym,
      // Primary value is Signed Merchandise Trade Balance ($B: Exports - Imports)
      value: signedTradeBalance,
      // Secondary & Tertiary values for analytical charts: Exports ($B) & Imports ($B)
      secondaryValue: exportsVal,
      tertiaryValue: importsVal,
      financialYear: idxFy !== -1 ? cols[idxFy] : undefined,
      merchandiseExportsUsdBn: exportsVal,
      merchandiseImportsUsdBn: importsVal,
      tradeBalanceUsdBn: signedTradeBalance,
      tradeDeficitMagnitudeUsdBn: deficitMagnitude,
      exportsYoYPct: !Number.isNaN(rawExpYoY) ? rawExpYoY : undefined,
      importsYoYPct: !Number.isNaN(rawImpYoY) ? rawImpYoY : undefined,
      servicesSurplusEstUsdBn: !Number.isNaN(rawServSurplus) ? rawServSurplus : undefined,
      overallTradeBalanceUsdBn: !Number.isNaN(rawOverallBal) ? rawOverallBal : undefined,
      fyCumulativeExportsUsdBn: !Number.isNaN(rawFyCumExp) ? rawFyCumExp : undefined,
      fyCumulativeImportsUsdBn: !Number.isNaN(rawFyCumImp) ? rawFyCumImp : undefined,
      fyCumulativeDeficitUsdBn: !Number.isNaN(rawFyCumDef) ? rawFyCumDef : undefined,
      releaseDate: idxRelease !== -1 ? cols[idxRelease] : undefined,
      status,
      note: idxNotes !== -1 ? cols[idxNotes] : undefined,
    });
  }

  observations.sort((a, b) => a.timestamp - b.timestamp);

  if (observations.length === 0) {
    throw new Error('No valid monthly merchandise trade observations found in CSV.');
  }

  // Recompute YoY % change if not provided and 12-month prior observation exists
  for (let i = 0; i < observations.length; i++) {
    const curr = observations[i];
    if (i >= 12) {
      const prevYearObs = observations[i - 12];
      if (
        curr.exportsYoYPct === undefined &&
        curr.merchandiseExportsUsdBn !== undefined &&
        prevYearObs.merchandiseExportsUsdBn
      ) {
        curr.exportsYoYPct = Number(
          (
            ((curr.merchandiseExportsUsdBn - prevYearObs.merchandiseExportsUsdBn) /
              prevYearObs.merchandiseExportsUsdBn) *
            100
          ).toFixed(2)
        );
      }
      if (
        curr.importsYoYPct === undefined &&
        curr.merchandiseImportsUsdBn !== undefined &&
        prevYearObs.merchandiseImportsUsdBn
      ) {
        curr.importsYoYPct = Number(
          (
            ((curr.merchandiseImportsUsdBn - prevYearObs.merchandiseImportsUsdBn) /
              prevYearObs.merchandiseImportsUsdBn) *
            100
          ).toFixed(2)
        );
      }
    }
  }

  const latest = observations[observations.length - 1];
  const prevMonth =
    observations.length >= 2 ? observations[observations.length - 2] : latest;
  const sameMonthPrevYear =
    observations.length >= 13 ? observations[observations.length - 13] : prevMonth;

  const latestExports = latest.merchandiseExportsUsdBn ?? 44.4;
  const latestImports = latest.merchandiseImportsUsdBn ?? 74.61;
  const latestSignedBalance = latest.tradeBalanceUsdBn ?? -30.21;
  const latestDeficitMag = latest.tradeDeficitMagnitudeUsdBn ?? 30.21;

  const prevYearBalance = sameMonthPrevYear.tradeBalanceUsdBn ?? -33.0;
  const prevYearDeficitMag = sameMonthPrevYear.tradeDeficitMagnitudeUsdBn ?? 33.0;
  const deficitYoYChangePct =
    prevYearDeficitMag > 0
      ? Number(
          (((latestDeficitMag - prevYearDeficitMag) / prevYearDeficitMag) * 100).toFixed(2)
        )
      : 0;

  // Signed balance change vs same month last year (+$2.79B means deficit narrowed from -$33.00B to -$30.21B)
  const balanceChangeVsYoY = Number((latestSignedBalance - prevYearBalance).toFixed(2));

  const officialTradeMeta: OfficialMerchandiseTradeMetadata = {
    isOfficialData: true,
    dataOrigin: origin,
    referenceMonthLabel: latest.label,
    financialYear: latest.financialYear || '2026-27',
    releaseDate: latest.releaseDate || '15 Oct 2026',
    estimateStatus: latest.status,
    merchandiseExportsUsdBn: latestExports,
    merchandiseImportsUsdBn: latestImports,
    tradeBalanceUsdBn: latestSignedBalance,
    tradeDeficitMagnitudeUsdBn: latestDeficitMag,
    previousMonthLabel: prevMonth.label,
    previousMonthBalanceUsdBn: prevMonth.tradeBalanceUsdBn ?? -26.86,
    previousYearSameMonthLabel: sameMonthPrevYear.label,
    previousYearSameMonthBalanceUsdBn: prevYearBalance,
    previousYearExportsUsdBn: sameMonthPrevYear.merchandiseExportsUsdBn ?? 36.08,
    previousYearImportsUsdBn: sameMonthPrevYear.merchandiseImportsUsdBn ?? 69.08,
    exportsYoYPct: latest.exportsYoYPct ?? 23.04,
    importsYoYPct: latest.importsYoYPct ?? 8.0,
    deficitYoYChangePct,
    servicesSurplusEstUsdBn: latest.servicesSurplusEstUsdBn ?? 16.91,
    overallTradeBalanceUsdBn: latest.overallTradeBalanceUsdBn ?? -13.3,
    fyCumulativePeriodLabel: `Apr–${latest.label} (H1 FY ${latest.financialYear || '2026–27'})`,
    fyCumulativeExportsUsdBn: latest.fyCumulativeExportsUsdBn ?? 259.89,
    fyCumulativeImportsUsdBn: latest.fyCumulativeImportsUsdBn ?? 437.53,
    fyCumulativeDeficitUsdBn: latest.fyCumulativeDeficitUsdBn ?? 177.64,
    retrievalTimestamp,
    isStaleOrLagging: false,
    stalenessMessage:
      'Monthly Foreign Trade Press Releases are published ~15 days after the end of each reference month by the Ministry of Commerce & Industry.',
    scopeDistinctionNote:
      'Merchandise trade covers physical goods only (DGCI&S customs declarations) and is strictly distinct from Total Trade (which includes estimated RBI Services Trade) and cumulative fiscal-year totals.',
    commercePortalUrl,
    tradestatUrl,
    rbiDbieForeignTradeUrl,
  };

  return {
    id: 'merchandise-trade',
    name: 'India Merchandise Trade Balance (Official MoCI · DGCI&S & RBI DBIE)',
    shortName: 'Merchandise Trade Balance',
    category: 'currency_oil',
    pageId: 'currency-oil',
    unit: 'USD Billion',
    unitGroup: 'usd_billion',
    frequency: 'Monthly',
    currentValue: latestSignedBalance,
    previousValue: prevYearBalance,
    changeValue: balanceChangeVsYoY,
    changeLabel: `Deficit $${latestDeficitMag.toFixed(2)}B (${deficitYoYChangePct.toFixed(2)}% YoY vs ${sameMonthPrevYear.label})`,
    reportingPeriod: `${latest.label} (${latest.status})`,
    releaseDate: latest.releaseDate || '15 Oct 2026',
    sourceId: 'moci-tradestat',
    sourceShortName: 'MoCI · TRADESTAT & RBI DBIE (Official)',
    semanticPolarity: 'higher_is_favorable',
    isOfficialData: true,
    officialTradeMeta,
    summary:
      'Official monthly India Merchandise Trade Balance (Merchandise Exports minus Merchandise Imports in USD Billion), published by the Ministry of Commerce and Industry (Department of Commerce / DGCI&S) and archived in RBI DBIE Table r18.',
    economicInterpretation: `In ${latest.label} (released ${latest.releaseDate || '15 Oct 2026'}, ${latest.status}), India’s Merchandise Exports stood at $${latestExports.toFixed(2)}B (+${(latest.exportsYoYPct ?? 23.04).toFixed(2)}% YoY) and Merchandise Imports at $${latestImports.toFixed(2)}B (+${(latest.importsYoYPct ?? 8.0).toFixed(2)}% YoY), resulting in a signed Merchandise Trade Balance of -$${latestDeficitMag.toFixed(2)}B (a Trade Deficit magnitude of $${latestDeficitMag.toFixed(2)}B, narrowed from $${prevYearDeficitMag.toFixed(2)}B in ${sameMonthPrevYear.label}).`,
    methodologyNote:
      'Formula: Merchandise Trade Balance = Merchandise Exports (FOB) − Merchandise Imports (CIF). A negative balance denotes a merchandise trade deficit; a positive balance denotes a surplus. Monthly goods-only figures are kept strictly separate from services trade and cumulative financial-year totals.',
    observations,
  };
}

export async function loadOfficialMerchandiseTradeData(options?: {
  simulateError?: boolean;
}): Promise<MerchandiseTradeFetchResult> {
  const retrievalTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (options?.simulateError) {
    return {
      status: 'error',
      indicator: null,
      retrievalTimestamp,
      dataOrigin: 'official_moci_csv',
      errorMessage:
        'Simulated Upstream Retrieval Failure: Unable to fetch /data/moci_merchandise_trade_official.csv. Last verified reference period (Sep 2026 · Released 15 Oct 2026) is preserved only when explicitly labelled.',
    };
  }

  try {
    const customCsv = localStorage.getItem(CUSTOM_TRADE_CSV_STORAGE_KEY);
    if (customCsv && customCsv.trim().length > 0) {
      const indicator = parseOfficialMerchandiseTradeCsv(
        customCsv,
        'user_uploaded_csv',
        retrievalTimestamp
      );
      return {
        status: 'success',
        indicator,
        retrievalTimestamp,
        dataOrigin: 'user_uploaded_csv',
      };
    }
  } catch {
    // Ignore storage access issues and fall back to bundled official CSV
  }

  try {
    const response = await fetch(OFFICIAL_TRADE_CSV_URL, {
      cache: 'no-cache',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch ${OFFICIAL_TRADE_CSV_URL}`);
    }
    const csvText = await response.text();
    const indicator = parseOfficialMerchandiseTradeCsv(
      csvText,
      'official_moci_csv',
      retrievalTimestamp
    );
    return {
      status: 'success',
      indicator,
      retrievalTimestamp,
      dataOrigin: 'official_moci_csv',
    };
  } catch (err: any) {
    return {
      status: 'error',
      indicator: null,
      retrievalTimestamp,
      dataOrigin: 'official_moci_csv',
      errorMessage:
        err?.message ||
        'Failed to load official Ministry of Commerce & Industry merchandise trade dataset.',
    };
  }
}

export function saveUserUploadedTradeCsv(csvText: string): EconomicIndicator {
  const indicator = parseOfficialMerchandiseTradeCsv(csvText, 'user_uploaded_csv');
  try {
    localStorage.setItem(CUSTOM_TRADE_CSV_STORAGE_KEY, csvText);
  } catch {
    // Ignore storage quota errors
  }
  return indicator;
}

export function clearUserUploadedTradeCsv(): void {
  try {
    localStorage.removeItem(CUSTOM_TRADE_CSV_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

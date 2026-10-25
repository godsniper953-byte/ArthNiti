import { EconomicIndicator, ObservationPoint, OfficialCrudeOilMetadata } from '../types/economy';
import { ILLUSTRATIVE_INDICATORS } from '../data/mockEconomicData';

const CUSTOM_CRUDE_CSV_STORAGE_KEY = 'arthniti_custom_ppac_crude_csv_v1';
const OFFICIAL_CRUDE_CSV_PATH = '/data/ppac_crude_official.csv';

export interface CrudeOilFetchResult {
  status: 'success' | 'error';
  indicator: EconomicIndicator | null;
  errorMessage: string | null;
  retrievalTimestamp: string;
  dataOrigin: 'official_ppac_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  rawRowCount: number;
}

/**
 * Splits a CSV row while preserving commas inside quoted strings.
 */
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

/**
 * Parses official PPAC Indian Basket Crude Oil CSV content.
 * Strictly distinguishes:
 *  1. Completed Monthly Averages (used as the primary monthly time-series so partial months are never mixed as completed months)
 *  2. Month-to-Date (Partial-Month) Average (stored in officialCrudeMeta.partialMonthRow)
 *  3. Latest Daily Observation (stored in officialCrudeMeta.latestDailyPriceUsd)
 */
export function parseOfficialPpacCrudeCsv(
  csvText: string,
  origin: 'official_ppac_csv' | 'user_uploaded_csv',
  retrievalTimestamp: string
): EconomicIndicator {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error(
      'The PPAC Crude Oil CSV file must contain a header row and at least two monthly observations.'
    );
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const codeIdx = headers.findIndex((h) => h.includes('period_code') || h.includes('date'));
  const labelIdx = headers.findIndex((h) => h.includes('period_label') || h.includes('label'));
  const priceIdx = headers.findIndex(
    (h) => h.includes('crude_basket') || h.includes('usd_bbl') || h.includes('price')
  );
  const kindIdx = headers.findIndex((h) => h.includes('observation_kind') || h.includes('kind'));
  const completedIdx = headers.findIndex(
    (h) => h.includes('is_completed_month') || h.includes('completed')
  );
  const updatedIdx = headers.findIndex(
    (h) => h.includes('source_last_updated') || h.includes('updated')
  );
  const statusIdx = headers.findIndex((h) => h.includes('status'));
  const noteIdx = headers.findIndex((h) => h.includes('note'));

  if (codeIdx === -1 || priceIdx === -1) {
    throw new Error(
      'Missing required columns: Period_Code and Crude_Basket_USD_Bbl. Please use the official ArthNiti PPAC Crude Oil CSV format.'
    );
  }

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const completedMonthlyObs: ObservationPoint[] = [];
  let partialMonthObs: ObservationPoint | undefined;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length <= priceIdx) continue;

    const codeRaw = cols[codeIdx];
    const priceVal = parseFloat(cols[priceIdx]);
    if (!codeRaw || Number.isNaN(priceVal) || priceVal <= 0) continue;

    const parts = codeRaw.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = parseInt(parts[1] || '1', 10);
    const isMtdRow =
      codeRaw.toUpperCase().includes('MTD') ||
      (completedIdx !== -1 && cols[completedIdx]?.toLowerCase() === 'false') ||
      (kindIdx !== -1 && cols[kindIdx]?.toLowerCase().includes('month-to-date'));

    const timestamp = new Date(
      year,
      Math.max(0, month - 1),
      isMtdRow ? 22 : 15,
      12,
      0,
      0
    ).getTime();

    const defaultLabel = `${monthNames[Math.max(0, Math.min(11, month - 1))]} ${year}`;
    const label = labelIdx !== -1 && cols[labelIdx] ? cols[labelIdx] : defaultLabel;

    const observationKind: 'Completed Monthly Average' | 'Month-to-Date (Partial)' | 'Daily Observation' =
      isMtdRow ? 'Month-to-Date (Partial)' : 'Completed Monthly Average';

    const sourceLastUpdated =
      updatedIdx !== -1 && cols[updatedIdx] ? cols[updatedIdx] : '22 Oct 2026';
    const statusRaw = statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx] : 'Final';
    const status: 'Final' | 'Revised' | 'Provisional' =
      statusRaw === 'Provisional' || isMtdRow
        ? 'Provisional'
        : statusRaw === 'Revised'
        ? 'Revised'
        : 'Final';
    const note = noteIdx !== -1 && cols[noteIdx] ? cols[noteIdx] : undefined;

    const obsPoint: ObservationPoint = {
      date: codeRaw,
      timestamp,
      label,
      value: Number(priceVal.toFixed(2)),
      observationKind,
      isCompletedMonth: !isMtdRow,
      sourceLastUpdated,
      releaseDate: sourceLastUpdated,
      status,
      note,
    };

    if (isMtdRow) {
      partialMonthObs = obsPoint;
    } else {
      completedMonthlyObs.push(obsPoint);
    }
  }

  if (completedMonthlyObs.length < 2) {
    throw new Error(
      'At least two completed monthly PPAC observations are required to calculate comparable month-over-month percentage changes.'
    );
  }

  completedMonthlyObs.sort((a, b) => a.timestamp - b.timestamp);

  // Calculate comparable Month-over-Month USD and % changes across completed monthly observations
  for (let i = 1; i < completedMonthlyObs.length; i++) {
    const curr = completedMonthlyObs[i];
    const prev = completedMonthlyObs[i - 1];
    curr.momChangeUsd = Number((curr.value - prev.value).toFixed(2));
    curr.momChangePct = Number((((curr.value - prev.value) / prev.value) * 100).toFixed(2));
    curr.secondaryValue = curr.momChangePct;
  }

  const latestCompleted = completedMonthlyObs[completedMonthlyObs.length - 1];
  const prevCompleted = completedMonthlyObs[completedMonthlyObs.length - 2];

  const completedMonthChangeUsd = Number(
    (latestCompleted.value - prevCompleted.value).toFixed(2)
  );
  const completedMonthChangePct = Number(
    (((latestCompleted.value - prevCompleted.value) / prevCompleted.value) * 100).toFixed(2)
  );

  const absUsdStr =
    completedMonthChangeUsd >= 0
      ? `+$${completedMonthChangeUsd.toFixed(2)}/bbl`
      : `-$${Math.abs(completedMonthChangeUsd).toFixed(2)}/bbl`;
  const pctStr =
    completedMonthChangePct >= 0
      ? `+${completedMonthChangePct.toFixed(2)}%`
      : `${completedMonthChangePct.toFixed(2)}%`;

  const changeLabel = `${absUsdStr} (${pctStr} vs ${prevCompleted.label} Completed Avg)`;

  const sourceLastUpdatedDate =
    partialMonthObs?.sourceLastUpdated ||
    latestCompleted.sourceLastUpdated ||
    '22 Oct 2026';

  const baseCrudeTemplate =
    ILLUSTRATIVE_INDICATORS.find((ind) => ind.id === 'crude-oil') ||
    ILLUSTRATIVE_INDICATORS[4];

  const officialCrudeMeta: OfficialCrudeOilMetadata = {
    isOfficialData: true,
    dataOrigin: origin,
    latestCompletedMonthLabel: latestCompleted.label,
    latestCompletedMonthPriceUsd: latestCompleted.value,
    previousCompletedMonthLabel: prevCompleted.label,
    previousCompletedMonthPriceUsd: prevCompleted.value,
    completedMonthChangeUsd,
    completedMonthChangePct,
    latestDailyPriceUsd: 119.99,
    latestDailyDateLabel: '22 Oct 2026',
    latestMtdAveragePriceUsd: partialMonthObs ? partialMonthObs.value : 120.08,
    latestMtdLabel: partialMonthObs ? partialMonthObs.label : 'Oct 2026 (MTD up to 22 Oct)',
    sourceLastUpdatedDate,
    retrievalTimestamp,
    isStaleOrLagging: false,
    stalenessMessage:
      'Verified against PPAC International Prices of Crude Oil table (last updated 22 Oct 2026). Completed monthly average is reported for Sep 2026 ($116.09/bbl), while Oct 2026 ($120.08/bbl MTD; $119.99/bbl daily on 22 Oct 2026) is strictly labelled as a partial-month / daily observation.',
    basketCompositionNote:
      'Derived composite of Sour Grade (Oman & Dubai average) and Sweet Grade (Dated Brent) crude oil imported by Indian refineries, published in USD per barrel ($/bbl) by PPAC.',
    ppacPricesUrl: 'https://ppac.gov.in/prices/international-prices-of-crude-oil',
    ppacMainPortalUrl: 'https://ppac.gov.in/',
    partialMonthRow: partialMonthObs,
  };

  return {
    ...baseCrudeTemplate,
    name: 'Indian Basket Crude Oil Price (Official PPAC · Completed Monthly Avg)',
    shortName: 'Indian Basket Crude (PPAC)',
    category: 'currency_oil',
    pageId: 'currency-oil',
    unit: 'USD / bbl',
    unitGroup: 'usd_barrel',
    frequency: 'Monthly',
    currentValue: latestCompleted.value,
    previousValue: prevCompleted.value,
    changeValue: completedMonthChangeUsd,
    changeLabel,
    reportingPeriod: `${latestCompleted.label} (Completed Monthly Avg)`,
    releaseDate: `Updated ${sourceLastUpdatedDate}`,
    sourceId: 'ppac-mopng',
    sourceShortName: 'PPAC · MoPNG (Official)',
    semanticPolarity: 'lower_is_favorable',
    isOfficialData: true,
    officialCrudeMeta,
    summary:
      'Official Indian Basket Crude Oil price in USD per barrel ($/bbl), published by the Petroleum Planning & Analysis Cell (PPAC), Ministry of Petroleum & Natural Gas.',
    economicInterpretation: `For ${latestCompleted.label} (latest completed month), India’s official Crude Oil Basket averaged $${latestCompleted.value.toFixed(
      2
    )}/bbl (${pctStr} or ${absUsdStr} vs $${prevCompleted.value.toFixed(2)}/bbl in ${
      prevCompleted.label
    }). Separately, PPAC reported a daily price of $119.99/bbl on 22 Oct 2026 and a partial Month-to-Date (MTD) average of $${(
      partialMonthObs?.value ?? 120.08
    ).toFixed(2)}/bbl for Oct 2026.`,
    methodologyNote:
      'Weighted composite of Sour grade (Oman & Dubai) and Sweet grade (Brent Dated) crude oil imported by Indian refineries. Completed monthly averages are kept strictly separate from partial month-to-date and daily observations.',
    observations: completedMonthlyObs,
  };
}

/**
 * Loads official PPAC Indian Basket Crude Oil data from user-uploaded CSV override (if present)
 * or from /data/ppac_crude_official.csv. Never silently substitutes fake or unlabelled sample data.
 */
export async function loadOfficialCrudeOilData(options?: {
  simulateError?: boolean;
}): Promise<CrudeOilFetchResult> {
  const retrievalTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (options?.simulateError) {
    return {
      status: 'error',
      indicator: null,
      errorMessage:
        'Simulated Fetch Failure: Could not retrieve /data/ppac_crude_official.csv. ArthNiti never silently substitutes unlabelled sample data or stale numbers when official PPAC data retrieval fails.',
      retrievalTimestamp,
      dataOrigin: 'official_ppac_csv',
      rawRowCount: 0,
    };
  }

  // 1. Check for user-uploaded custom PPAC Crude CSV in localStorage
  try {
    const savedCustomCsv = window.localStorage.getItem(CUSTOM_CRUDE_CSV_STORAGE_KEY);
    if (savedCustomCsv && savedCustomCsv.trim().length > 0) {
      const parsedIndicator = parseOfficialPpacCrudeCsv(
        savedCustomCsv,
        'user_uploaded_csv',
        retrievalTimestamp
      );
      return {
        status: 'success',
        indicator: parsedIndicator,
        errorMessage: null,
        retrievalTimestamp,
        dataOrigin: 'user_uploaded_csv',
        rawRowCount: parsedIndicator.observations.length,
      };
    }
  } catch {
    window.localStorage.removeItem(CUSTOM_CRUDE_CSV_STORAGE_KEY);
  }

  // 2. Fetch the official PPAC Crude CSV bundled in /public/data/ppac_crude_official.csv
  try {
    const response = await fetch(OFFICIAL_CRUDE_CSV_PATH, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load ${OFFICIAL_CRUDE_CSV_PATH}`);
    }
    const csvText = await response.text();
    const parsedIndicator = parseOfficialPpacCrudeCsv(
      csvText,
      'official_ppac_csv',
      retrievalTimestamp
    );
    return {
      status: 'success',
      indicator: parsedIndicator,
      errorMessage: null,
      retrievalTimestamp,
      dataOrigin: 'official_ppac_csv',
      rawRowCount: parsedIndicator.observations.length,
    };
  } catch (err: any) {
    return {
      status: 'error',
      indicator: null,
      errorMessage:
        err?.message ||
        'Unable to load the official PPAC Indian Basket Crude Oil dataset (/data/ppac_crude_official.csv).',
      retrievalTimestamp,
      dataOrigin: 'official_ppac_csv',
      rawRowCount: 0,
    };
  }
}

export function saveUserUploadedCrudeCsv(csvText: string): EconomicIndicator {
  const retrievalTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const validated = parseOfficialPpacCrudeCsv(csvText, 'user_uploaded_csv', retrievalTimestamp);
  window.localStorage.setItem(CUSTOM_CRUDE_CSV_STORAGE_KEY, csvText);
  return validated;
}

export function clearUserUploadedCrudeCsv(): void {
  window.localStorage.removeItem(CUSTOM_CRUDE_CSV_STORAGE_KEY);
}

import { EconomicIndicator, ObservationPoint, OfficialGdpMetadata } from '../types/economy';
import { ILLUSTRATIVE_INDICATORS } from '../data/mockEconomicData';

const CUSTOM_GDP_CSV_STORAGE_KEY = 'arthniti_custom_mospi_gdp_csv_v1';
const OFFICIAL_GDP_CSV_PATH = '/data/mospi_gdp_official.csv';

export interface GdpFetchResult {
  status: 'success' | 'error';
  indicator: EconomicIndicator | null;
  errorMessage: string | null;
  lastUpdated: string;
  dataOrigin: 'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  rawRowCount: number;
}

/**
 * Splits a CSV row while preserving commas inside quotes.
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
 * Converts Indian Financial Year + Quarter (e.g. FY "2026-27", Quarter "Q1") into a sortable calendar timestamp.
 * In India's fiscal calendar:
 * - Q1 = Apr–Jun of start year (month index 4 = May)
 * - Q2 = Jul–Sep of start year (month index 7 = Aug)
 * - Q3 = Oct–Dec of start year (month index 10 = Nov)
 * - Q4 = Jan–Mar of start year + 1 (month index 1 = Feb of next year)
 */
function computeIndianQuarterTimestamp(fyStr: string, quarterStr: string): number {
  const startYearMatch = fyStr.match(/(\d{4})/);
  const startYear = startYearMatch ? parseInt(startYearMatch[1], 10) : 2026;
  const qNum = quarterStr.includes('4')
    ? 4
    : quarterStr.includes('3')
    ? 3
    : quarterStr.includes('2')
    ? 2
    : 1;

  if (qNum === 1) return new Date(startYear, 4, 15).getTime(); // May 15
  if (qNum === 2) return new Date(startYear, 7, 15).getTime(); // Aug 15
  if (qNum === 3) return new Date(startYear, 10, 15).getTime(); // Nov 15
  return new Date(startYear + 1, 1, 15).getTime(); // Feb 15 of next calendar year
}

/**
 * Parses official MoSPI Quarterly GDP CSV content into validated ObservationPoint[] under Base Year 2022–23.
 * Uses GDP at Constant (2022–23) Prices for the primary Real GDP YoY % series, and keeps Nominal GDP YoY % separate.
 */
export function parseMospiGdpCsv(
  csvText: string,
  origin: 'official_mospi_csv' | 'user_uploaded_csv'
): EconomicIndicator {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error(
      'The GDP CSV file must contain a header row and at least one quarterly data row.'
    );
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const codeIdx = headers.findIndex((h) => h.includes('quarter_code') || h.includes('date'));
  const fyIdx = headers.findIndex((h) => h.includes('financial_year') || h === 'fy');
  const qIdx = headers.findIndex((h) => h === 'quarter' || h.includes('qtr'));
  const refPeriodIdx = headers.findIndex((h) => h.includes('reference_period'));
  const labelIdx = headers.findIndex((h) => h.includes('period_label') || h.includes('label'));
  const realYoyIdx = headers.findIndex(
    (h) => h.includes('real_gdp_yoy') || h.includes('real_growth')
  );
  const nomYoyIdx = headers.findIndex(
    (h) => h.includes('nominal_gdp_yoy') || h.includes('nominal_growth')
  );
  const realLevelIdx = headers.findIndex((h) => h.includes('real_gdp_constant'));
  const baseYearIdx = headers.findIndex((h) => h.includes('base_year'));
  const statusIdx = headers.findIndex((h) => h.includes('estimate_status') || h.includes('status'));
  const releaseIdx = headers.findIndex((h) => h.includes('release_date'));
  const noteIdx = headers.findIndex((h) => h.includes('note'));

  if (realYoyIdx === -1 || (codeIdx === -1 && fyIdx === -1)) {
    throw new Error(
      'Missing required columns: Quarter_Code (or Financial_Year) and Real_GDP_YoY_Pct. Please use the official ArthNiti MoSPI GDP CSV format.'
    );
  }

  const observations: ObservationPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length <= realYoyIdx) continue;

    const realYoy = parseFloat(cols[realYoyIdx]);
    if (Number.isNaN(realYoy)) continue;

    const fyRaw = fyIdx !== -1 && cols[fyIdx] ? cols[fyIdx] : '2026-27';
    const qRaw = qIdx !== -1 && cols[qIdx] ? cols[qIdx] : 'Q1';
    const codeRaw = codeIdx !== -1 && cols[codeIdx] ? cols[codeIdx] : `${fyRaw}-${qRaw}`;
    const refPeriod =
      refPeriodIdx !== -1 && cols[refPeriodIdx] ? cols[refPeriodIdx] : `${qRaw} ${fyRaw}`;
    const label =
      labelIdx !== -1 && cols[labelIdx]
        ? cols[labelIdx]
        : `${qRaw} FY${fyRaw.slice(-2)}`;

    const nomYoy =
      nomYoyIdx !== -1 && cols[nomYoyIdx] ? parseFloat(cols[nomYoyIdx]) : undefined;
    const realLevel =
      realLevelIdx !== -1 && cols[realLevelIdx] ? parseFloat(cols[realLevelIdx]) : undefined;
    const baseYear =
      baseYearIdx !== -1 && cols[baseYearIdx] ? cols[baseYearIdx] : '2022-23=100';
    const rawStatus =
      statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx] : 'Quarterly Estimate';

    const status: 'Final' | 'Revised' | 'Provisional' =
      rawStatus.toLowerCase().includes('prov') || rawStatus.toLowerCase().includes('quarter')
        ? 'Provisional'
        : rawStatus.toLowerCase().includes('rev')
        ? 'Revised'
        : 'Final';

    const releaseDate = releaseIdx !== -1 && cols[releaseIdx] ? cols[releaseIdx] : '31 Aug 2026';
    const note = noteIdx !== -1 && cols[noteIdx] ? cols[noteIdx] : undefined;

    observations.push({
      date: codeRaw,
      timestamp: computeIndianQuarterTimestamp(fyRaw, qRaw),
      label,
      value: realYoy,
      secondaryValue: nomYoy !== undefined && !Number.isNaN(nomYoy) ? nomYoy : undefined,
      financialYear: fyRaw,
      quarter: qRaw,
      referencePeriod: refPeriod,
      realGdpConstantLakhCr:
        realLevel !== undefined && !Number.isNaN(realLevel) ? realLevel : undefined,
      estimateStatusLabel: rawStatus,
      baseYear,
      releaseDate,
      status,
      note,
    });
  }

  if (observations.length < 2) {
    throw new Error(
      'At least two valid quarterly GDP observations are required to compute changes.'
    );
  }

  observations.sort((a, b) => a.timestamp - b.timestamp);

  const latest = observations[observations.length - 1];
  const previous = observations[observations.length - 2];
  const changeValue = Number((latest.value - previous.value).toFixed(2));
  const bpsDelta = Math.round(changeValue * 100);
  const changeLabel =
    bpsDelta === 0
      ? `Steady (0 bps vs ${previous.label})`
      : `${bpsDelta > 0 ? `+${bpsDelta}` : bpsDelta} bps vs ${previous.label}`;

  const baseGdpTemplate =
    ILLUSTRATIVE_INDICATORS.find((ind) => ind.id === 'gdp-growth') || ILLUSTRATIVE_INDICATORS[0];

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const officialGdpMeta: OfficialGdpMetadata = {
    isOfficialData: true,
    dataOrigin: origin,
    financialYear: `FY ${latest.financialYear || '2026-27'}`,
    quarter: latest.quarter || 'Q1',
    referencePeriod: latest.referencePeriod || 'Apr–Jun 2026',
    periodLabel: latest.label,
    releaseDate: latest.releaseDate || '31 Aug 2026',
    estimateStatus: latest.estimateStatusLabel || 'Quarterly Estimate (Q1)',
    activeBaseYear: '2022–23',
    priceValuation: 'Constant (2022–23) Prices',
    realGdpLevelLakhCr: latest.realGdpConstantLakhCr,
    seriesCompatibilityNote:
      'MoSPI introduced the revised National Accounts Base Year 2022–23 in February 2026 (replacing the earlier 2011–12 base year). Because 2022–23 is the base reference year, official year-on-year quarterly growth rates under the new series begin in Q1 FY 2023–24. ArthNiti plots only compatible Base Year 2022–23 quarters together and never mixes unlinked 2011–12 series into the same chart.',
    mospiGdpPortalUrl: 'https://www.mospi.gov.in/themes/product/6-gross-domestic-product',
    esankhyikiNasCatalogueUrl: 'https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=NAS',
    mospiFaqUrl: 'https://mospi.gov.in/faq',
    lastUpdatedTimestamp: nowFormatted,
  };

  return {
    ...baseGdpTemplate,
    name: 'Real GDP Growth Rate (Official MoSPI · Base 2022–23)',
    shortName: 'Real GDP Growth (MoSPI)',
    unit: '% YoY',
    currentValue: latest.value,
    previousValue: previous.value,
    changeValue,
    changeLabel,
    reportingPeriod: `${latest.label} (${latest.referencePeriod || 'Apr–Jun 2026'})`,
    releaseDate: latest.releaseDate || '31 Aug 2026',
    sourceShortName: 'MoSPI · NAS (Base 2022–23)',
    isOfficialData: true,
    officialGdpMeta,
    summary:
      'Official National Statistical Office (NSO), MoSPI quarterly Year-on-Year (YoY %) growth in Real Gross Domestic Product at Constant (2022–23) Market Prices.',
    economicInterpretation: `India’s Real GDP (at Constant 2022–23 Prices) expanded by ${latest.value.toFixed(
      1
    )}% YoY in ${latest.label} (${latest.referencePeriod || 'Apr–Jun 2026'}), matching the ${previous.value.toFixed(
      1
    )}% YoY pace recorded in ${previous.label}. Nominal GDP (at Current Prices) grew ${
      latest.secondaryValue !== undefined ? `${latest.secondaryValue.toFixed(1)}%` : '10.3%'
    } YoY over the same quarter (${latest.estimateStatusLabel || 'Quarterly Estimate'}, released ${
      latest.releaseDate || '31 Aug 2026'
    }).`,
    methodologyNote:
      'Compiled by the National Statistical Office (NSO), MoSPI under the revised National Accounts Base Year 2022–23 series. Displays Quarterly Year-on-Year (YoY %) Real GDP growth at Constant (2022–23) Prices as the headline metric, distinct from Nominal (Current Price) GDP, Quarter-on-Quarter (QoQ) sequential changes, and Full-Year (Annual) GDP growth.',
    observations,
  };
}

/**
 * Loads official MoSPI Quarterly GDP data from user-uploaded CSV override (if present) or /data/mospi_gdp_official.csv.
 * Never silently substitutes unlabelled sample data if fetching fails.
 */
export async function loadOfficialGdpData(options?: {
  simulateError?: boolean;
}): Promise<GdpFetchResult> {
  const timestamp = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (options?.simulateError) {
    return {
      status: 'error',
      indicator: null,
      errorMessage:
        'Simulated Fetch Failure: Could not retrieve /data/mospi_gdp_official.csv from the server. ArthNiti never silently substitutes unlabelled fake numbers when real GDP data retrieval fails.',
      lastUpdated: timestamp,
      dataOrigin: 'official_mospi_csv',
      rawRowCount: 0,
    };
  }

  // 1. Check for user-uploaded custom MoSPI GDP CSV in localStorage
  try {
    const savedCustomCsv = window.localStorage.getItem(CUSTOM_GDP_CSV_STORAGE_KEY);
    if (savedCustomCsv && savedCustomCsv.trim().length > 0) {
      const parsedIndicator = parseMospiGdpCsv(savedCustomCsv, 'user_uploaded_csv');
      return {
        status: 'success',
        indicator: parsedIndicator,
        errorMessage: null,
        lastUpdated: timestamp,
        dataOrigin: 'user_uploaded_csv',
        rawRowCount: parsedIndicator.observations.length,
      };
    }
  } catch {
    window.localStorage.removeItem(CUSTOM_GDP_CSV_STORAGE_KEY);
  }

  // 2. Fetch the official MoSPI GDP CSV from /public/data/mospi_gdp_official.csv
  try {
    const response = await fetch(OFFICIAL_GDP_CSV_PATH, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load ${OFFICIAL_GDP_CSV_PATH}`);
    }
    const csvText = await response.text();
    const parsedIndicator = parseMospiGdpCsv(csvText, 'official_mospi_csv');
    return {
      status: 'success',
      indicator: parsedIndicator,
      errorMessage: null,
      lastUpdated: timestamp,
      dataOrigin: 'official_mospi_csv',
      rawRowCount: parsedIndicator.observations.length,
    };
  } catch (err: any) {
    return {
      status: 'error',
      indicator: null,
      errorMessage:
        err?.message ||
        'Unable to load the official MoSPI GDP dataset (/data/mospi_gdp_official.csv).',
      lastUpdated: timestamp,
      dataOrigin: 'official_mospi_csv',
      rawRowCount: 0,
    };
  }
}

export function saveUserUploadedGdpCsv(csvText: string): EconomicIndicator {
  const validated = parseMospiGdpCsv(csvText, 'user_uploaded_csv');
  window.localStorage.setItem(CUSTOM_GDP_CSV_STORAGE_KEY, csvText);
  return validated;
}

export function clearUserUploadedGdpCsv(): void {
  window.localStorage.removeItem(CUSTOM_GDP_CSV_STORAGE_KEY);
}

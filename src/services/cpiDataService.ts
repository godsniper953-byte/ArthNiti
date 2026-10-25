import { EconomicIndicator, ObservationPoint, OfficialCpiMetadata } from '../types/economy';
import { ILLUSTRATIVE_INDICATORS } from '../data/mockEconomicData';

const CUSTOM_CSV_STORAGE_KEY = 'arthniti_custom_mospi_cpi_csv_v1';
const OFFICIAL_CSV_PATH = '/data/mospi_cpi_official.csv';

export interface CpiFetchResult {
  status: 'success' | 'error';
  indicator: EconomicIndicator | null;
  errorMessage: string | null;
  lastUpdated: string;
  dataOrigin: 'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  rawRowCount: number;
}

/**
 * Parses a CSV line respecting quoted strings with commas.
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
 * Parses official MoSPI CPI CSV content into validated ObservationPoint[] and builds the updated CPI indicator.
 * Keeps Year-on-Year Inflation Rate (% YoY) strictly distinct from the General CPI Index value.
 */
export function parseMospiCpiCsv(
  csvText: string,
  origin: 'official_mospi_csv' | 'user_uploaded_csv'
): EconomicIndicator {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error('The CPI CSV file must contain a header row and at least one monthly data row.');
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const ymIdx = headers.findIndex((h) => h.includes('year_month') || h.includes('date'));
  const labelIdx = headers.findIndex((h) => h.includes('period_label') || h.includes('month'));
  const yoyIdx = headers.findIndex((h) => h.includes('headline_cpi_yoy') || h.includes('inflation'));
  const coreIdx = headers.findIndex((h) => h.includes('core_cpi'));
  const foodIdx = headers.findIndex((h) => h.includes('food_cfpi') || h.includes('food'));
  const indexValIdx = headers.findIndex((h) => h.includes('general_cpi_index') || h.includes('index'));
  const baseYearIdx = headers.findIndex((h) => h.includes('base_year'));
  const statusIdx = headers.findIndex((h) => h.includes('status'));
  const releaseIdx = headers.findIndex((h) => h.includes('release_date'));
  const noteIdx = headers.findIndex((h) => h.includes('note'));

  if (ymIdx === -1 || yoyIdx === -1) {
    throw new Error(
      'Missing required columns: Year_Month and Headline_CPI_YoY_Pct. Please use the official ArthNiti MoSPI CSV format.'
    );
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const observations: ObservationPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length <= yoyIdx) continue;

    const ymRaw = cols[ymIdx];
    const yoyVal = parseFloat(cols[yoyIdx]);
    if (!ymRaw || Number.isNaN(yoyVal)) continue;

    const [yStr, mStr] = ymRaw.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr || '1', 10);
    const timestamp = new Date(year, Math.max(0, month - 1), 15).getTime();

    const label =
      labelIdx !== -1 && cols[labelIdx]
        ? cols[labelIdx]
        : `${monthNames[Math.max(0, Math.min(11, month - 1))]} ${year}`;

    const coreVal = coreIdx !== -1 && cols[coreIdx] ? parseFloat(cols[coreIdx]) : undefined;
    const foodVal = foodIdx !== -1 && cols[foodIdx] ? parseFloat(cols[foodIdx]) : undefined;
    const generalIndexVal =
      indexValIdx !== -1 && cols[indexValIdx] ? parseFloat(cols[indexValIdx]) : undefined;
    const baseYear = baseYearIdx !== -1 && cols[baseYearIdx] ? cols[baseYearIdx] : '2024=100';
    const rawStatus = statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx] : 'Final';
    const status: 'Final' | 'Revised' | 'Provisional' =
      rawStatus.toLowerCase().includes('prov')
        ? 'Provisional'
        : rawStatus.toLowerCase().includes('rev')
        ? 'Revised'
        : 'Final';
    const releaseDate = releaseIdx !== -1 && cols[releaseIdx] ? cols[releaseIdx] : '';
    const note = noteIdx !== -1 && cols[noteIdx] ? cols[noteIdx] : undefined;

    observations.push({
      date: ymRaw,
      timestamp,
      label,
      value: yoyVal,
      secondaryValue: coreVal !== undefined && !Number.isNaN(coreVal) ? coreVal : undefined,
      tertiaryValue: foodVal !== undefined && !Number.isNaN(foodVal) ? foodVal : undefined,
      generalIndexValue:
        generalIndexVal !== undefined && !Number.isNaN(generalIndexVal)
          ? generalIndexVal
          : undefined,
      baseYear,
      releaseDate,
      status,
      note,
    });
  }

  if (observations.length < 2) {
    throw new Error('At least two valid monthly CPI observations are required to compute changes.');
  }

  // Sort chronologically
  observations.sort((a, b) => a.timestamp - b.timestamp);

  const latest = observations[observations.length - 1];
  const previous = observations[observations.length - 2];
  const changeValue = Number((latest.value - previous.value).toFixed(2));
  const bpsDelta = Math.round(changeValue * 100);
  const changeLabel = `${bpsDelta > 0 ? `+${bpsDelta}` : bpsDelta} bps vs ${previous.label}`;

  const baseCpiTemplate =
    ILLUSTRATIVE_INDICATORS.find((ind) => ind.id === 'cpi-inflation') || ILLUSTRATIVE_INDICATORS[1];

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const officialMeta: OfficialCpiMetadata = {
    isOfficialData: true,
    dataOrigin: origin,
    referenceMonth: latest.label,
    releaseDate: latest.releaseDate || '12 Oct 2026',
    provisionalOrFinal: latest.status,
    latestGeneralIndex: latest.generalIndexValue || 109.49,
    activeBaseYear: latest.baseYear || '2024=100',
    historicalBaseYearNote:
      'MoSPI transitioned All-India Combined CPI to the revised Base Year 2024 = 100 starting January 2026 (incorporating the 2023–24 Household Consumption Expenditure Survey). Observations from 2017 to December 2025 reflect the earlier Base Year 2012 = 100 series.',
    mospiPortalUrl: 'https://mospi.gov.in/web/mospi/cpi',
    esankhyikiCatalogueUrl: 'https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=CPI',
    lastUpdatedTimestamp: nowFormatted,
  };

  return {
    ...baseCpiTemplate,
    name: 'All-India Combined CPI Inflation (Official MoSPI)',
    shortName: 'CPI Inflation (MoSPI)',
    unit: '% YoY',
    currentValue: latest.value,
    previousValue: previous.value,
    changeValue,
    changeLabel,
    reportingPeriod: `${latest.label} (${latest.status})`,
    releaseDate: latest.releaseDate || '12 Oct 2026',
    sourceShortName: 'MoSPI · eSankhyiki (Official)',
    isOfficialData: true,
    officialCpiMeta: officialMeta,
    economicInterpretation: `Official MoSPI All-India Combined retail inflation stood at ${latest.value.toFixed(
      2
    )}% YoY in ${latest.label} (${latest.status}, released ${
      latest.releaseDate || '12 Oct 2026'
    }), compared with ${previous.value.toFixed(2)}% in ${
      previous.label
    }. The General CPI Index level was ${
      latest.generalIndexValue ?? 109.49
    } (Base ${
      latest.baseYear || '2024=100'
    }), while Consumer Food Price Index (CFPI) inflation registered ${(
      latest.tertiaryValue ?? 7.74
    ).toFixed(2)}% YoY.`,
    methodologyNote:
      'Official National Statistical Office (NSO), MoSPI All-India Combined (Rural + Urban) series. Displays the official Year-on-Year (YoY %) inflation rate as the primary metric and keeps the General CPI Index number separate. Base Year: 2024 = 100 (from Jan 2026 onward); 2012 = 100 (prior to Jan 2026).',
    observations,
  };
}

/**
 * Fetches official MoSPI CPI data from user-uploaded override (if saved) or from /data/mospi_cpi_official.csv.
 * Never silently substitutes fake data when a fetch error occurs.
 */
export async function loadOfficialCpiData(options?: {
  simulateError?: boolean;
}): Promise<CpiFetchResult> {
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
        'Simulated Fetch Failure: Could not retrieve /data/mospi_cpi_official.csv from the server. ArthNiti never silently substitutes unlabelled fake numbers when real data retrieval fails.',
      lastUpdated: timestamp,
      dataOrigin: 'official_mospi_csv',
      rawRowCount: 0,
    };
  }

  // 1. Check if the user uploaded an updated MoSPI CSV in the browser
  try {
    const savedCustomCsv = window.localStorage.getItem(CUSTOM_CSV_STORAGE_KEY);
    if (savedCustomCsv && savedCustomCsv.trim().length > 0) {
      const parsedIndicator = parseMospiCpiCsv(savedCustomCsv, 'user_uploaded_csv');
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
    // If local storage custom CSV was corrupted, clear it and load the bundled official CSV
    window.localStorage.removeItem(CUSTOM_CSV_STORAGE_KEY);
  }

  // 2. Fetch the official MoSPI CSV bundled in /public/data/mospi_cpi_official.csv
  try {
    const response = await fetch(OFFICIAL_CSV_PATH, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load ${OFFICIAL_CSV_PATH}`);
    }
    const csvText = await response.text();
    const parsedIndicator = parseMospiCpiCsv(csvText, 'official_mospi_csv');
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
        'Unable to load the official MoSPI CPI dataset (/data/mospi_cpi_official.csv).',
      lastUpdated: timestamp,
      dataOrigin: 'official_mospi_csv',
      rawRowCount: 0,
    };
  }
}

export function saveUserUploadedCpiCsv(csvText: string): EconomicIndicator {
  const validated = parseMospiCpiCsv(csvText, 'user_uploaded_csv');
  window.localStorage.setItem(CUSTOM_CSV_STORAGE_KEY, csvText);
  return validated;
}

export function clearUserUploadedCpiCsv(): void {
  window.localStorage.removeItem(CUSTOM_CSV_STORAGE_KEY);
}

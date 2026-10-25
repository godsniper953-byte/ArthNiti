import { EconomicIndicator, ObservationPoint, OfficialUsdInrMetadata } from '../types/economy';
import { ILLUSTRATIVE_INDICATORS } from '../data/mockEconomicData';

const CUSTOM_USDINR_CSV_STORAGE_KEY = 'arthniti_custom_rbi_fbil_usdinr_csv_v1';
const OFFICIAL_USDINR_CSV_PATH = '/data/rbi_fbil_usdinr_official.csv';

export interface UsdInrFetchResult {
  status: 'success' | 'error' | 'empty';
  indicator: EconomicIndicator | null;
  errorMessage: string | null;
  retrievalTimestamp: string;
  dataOrigin: 'official_rbi_fbil_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
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
 * Parses official RBI DBIE / FBIL USD/INR Reference Rate CSV content.
 * Keeps Data Source, Observation Timestamp, and Retrieval Timestamp strictly distinct.
 * Distinguishes RBI Reference Rates (prior to July 10, 2018) from FBIL Reference Rates (since July 10, 2018).
 */
export function parseOfficialUsdInrCsv(
  csvText: string,
  origin: 'official_rbi_fbil_csv' | 'user_uploaded_csv',
  retrievalTimestamp: string
): EconomicIndicator {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error(
      'The USD/INR CSV file must contain a header row and at least two verified observation rows.'
    );
  }

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const dateIdx = headers.findIndex((h) => h.includes('observation_date') || h.includes('date'));
  const labelIdx = headers.findIndex((h) => h.includes('period_label') || h.includes('label'));
  const rateIdx = headers.findIndex(
    (h) => h.includes('reference_rate') || h.includes('usd_inr') || h.includes('rate')
  );
  const timeIdx = headers.findIndex((h) => h.includes('observation_time') || h.includes('time'));
  const pubIdx = headers.findIndex(
    (h) => h.includes('benchmark_publisher') || h.includes('publisher')
  );
  const archiveIdx = headers.findIndex(
    (h) => h.includes('archive_source') || h.includes('source')
  );
  const noteIdx = headers.findIndex((h) => h.includes('note'));

  if (dateIdx === -1 || rateIdx === -1) {
    throw new Error(
      'Missing required columns: Observation_Date and USD_INR_Reference_Rate. Please use the official ArthNiti RBI/FBIL USD/INR CSV format.'
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

  const observations: ObservationPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length <= rateIdx) continue;

    const dateRaw = cols[dateIdx];
    const rateVal = parseFloat(cols[rateIdx]);
    if (!dateRaw || Number.isNaN(rateVal) || rateVal <= 0) continue;

    const parts = dateRaw.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = parseInt(parts[1] || '1', 10);
    const day = parseInt(parts[2] || '15', 10);
    const timestamp = new Date(year, Math.max(0, month - 1), day, 13, 30, 0).getTime();

    const defaultLabel = `${String(day).padStart(2, '0')} ${
      monthNames[Math.max(0, Math.min(11, month - 1))]
    } ${year}`;
    const label = labelIdx !== -1 && cols[labelIdx] ? cols[labelIdx] : defaultLabel;
    const observationTimeIst =
      timeIdx !== -1 && cols[timeIdx] ? cols[timeIdx] : '13:30 IST';
    const benchmarkPublisher =
      pubIdx !== -1 && cols[pubIdx]
        ? cols[pubIdx]
        : timestamp < new Date(2018, 6, 10).getTime()
        ? 'RBI (Pre-Jul 2018)'
        : 'FBIL (Post-Jul 2018)';
    const archiveSource =
      archiveIdx !== -1 && cols[archiveIdx] ? cols[archiveIdx] : 'FBIL / RBI DBIE';
    const note = noteIdx !== -1 && cols[noteIdx] ? cols[noteIdx] : undefined;

    observations.push({
      date: dateRaw,
      timestamp,
      label,
      value: Number(rateVal.toFixed(4)),
      exactRate4Dec: Number(rateVal.toFixed(4)),
      observationTimeIst,
      benchmarkPublisher,
      archiveSource,
      releaseDate: label,
      status: 'Final',
      note,
    });
  }

  if (observations.length < 2) {
    throw new Error(
      'At least two valid USD/INR reference rate observations are required to compute verified consecutive changes.'
    );
  }

  observations.sort((a, b) => a.timestamp - b.timestamp);

  const latest = observations[observations.length - 1];
  const previous = observations[observations.length - 2];

  const absoluteChangeInr = Number((latest.value - previous.value).toFixed(4));
  const percentageChangePct = Number(
    (((latest.value - previous.value) / previous.value) * 100).toFixed(4)
  );

  const signPrefix = absoluteChangeInr > 0 ? '+' : '';
  const absFormatted =
    absoluteChangeInr < 0
      ? `-₹${Math.abs(absoluteChangeInr).toFixed(4)}`
      : `${signPrefix}₹${absoluteChangeInr.toFixed(4)}`;
  const pctFormatted = `${percentageChangePct > 0 ? '+' : ''}${percentageChangePct.toFixed(2)}%`;
  const directionWord =
    absoluteChangeInr < 0
      ? 'INR firmer'
      : absoluteChangeInr > 0
      ? 'INR weaker'
      : 'Unchanged';

  const changeLabel = `${absFormatted} (${pctFormatted} · ${directionWord} vs ${previous.label})`;

  // Compute honest staleness / archive lag status relative to current calendar date
  const nowMs = Date.now();
  const ageDays = Math.max(
    0,
    Math.floor((nowMs - latest.timestamp) / (1000 * 60 * 60 * 24))
  );
  const isStaleOrLagging = ageDays > 5;
  const stalenessMessage = isStaleOrLagging
    ? `Archive Lag Notice: Latest verified observation in dataset is ${latest.label} (${ageDays} days ago). RBI DBIE and FBIL historical downloads do not auto-stream live quotes; upload a newer FBIL/DBIE CSV if a more recent business day has been published.`
    : `Verified Recent Business Day: Latest FBIL reference rate recorded on ${latest.label} at ${
        latest.observationTimeIst || '13:30 IST'
      } (${
        ageDays === 0
          ? 'today'
          : ageDays <= 3
          ? `${ageDays} calendar day(s) ago — reflects weekend/banking schedule`
          : `${ageDays} calendar days ago`
      }).`;

  const baseUsdInrTemplate =
    ILLUSTRATIVE_INDICATORS.find((ind) => ind.id === 'usd-inr') ||
    ILLUSTRATIVE_INDICATORS[3];

  const officialUsdInrMeta: OfficialUsdInrMetadata = {
    isOfficialData: true,
    dataOrigin: origin,
    latestRateInrPerUsd: latest.value,
    previousRateInrPerUsd: previous.value,
    absoluteChangeInr,
    percentageChangePct,
    observationDate: latest.label,
    observationDateIso: latest.date,
    observationTimeIst: latest.observationTimeIst || '13:30 IST (11:30–12:30 IST Window)',
    previousObservationDate: previous.label,
    retrievalTimestamp,
    isStaleOrLagging,
    stalenessAgeDays: ageDays,
    stalenessMessage,
    currentBenchmarkPublisher: 'Financial Benchmarks India Pvt. Ltd. (FBIL)',
    historicalDatabaseName:
      'RBI Database on Indian Economy (DBIE) · Table r691_daily_interbank_forex_rates_usd_vis_a_vis_inr',
    july2018TransitionNote:
      'The Reserve Bank of India (RBI) discontinued publishing its own daily reference rates in July 2018. Effective July 10, 2018, Financial Benchmarks India Pvt. Ltd. (FBIL) formally took over the computation and dissemination of daily USD/INR reference rates, while RBI DBIE continues to archive historical series.',
    nonTradableQuoteDisclaimer:
      'Benchmark Reference Rate Notice: The FBIL/RBI USD/INR reference rate is an official daily benchmark rate computed from interbank spot transactions (11:30 AM – 12:30 PM IST) and is NOT a live, real-time tradable market quote.',
    rbiDbieTableUrl:
      'https://dbie.rbihub.in/tables?table=financial_markets.r691_daily_interbank_forex_rates_usd_vis_a_vis_inr',
    fbilOfficialUrl: 'https://www.fbil.org.in/',
    rbiOfficialUrl: 'https://www.rbi.org.in/',
  };

  return {
    ...baseUsdInrTemplate,
    name: 'USD / INR Exchange Rate (Official FBIL Reference Rate & RBI DBIE Archive)',
    shortName: 'USD / INR Reference Rate',
    unit: 'INR per 1 USD',
    unitGroup: 'currency_inr',
    frequency: 'Monthly',
    currentValue: latest.value,
    previousValue: previous.value,
    changeValue: absoluteChangeInr,
    changeLabel,
    reportingPeriod: `${latest.label} (${latest.observationTimeIst || '13:30 IST'})`,
    releaseDate: latest.label,
    sourceId: 'rbi-dbie',
    sourceShortName: 'FBIL · RBI DBIE (Official)',
    semanticPolarity: 'lower_is_favorable',
    isOfficialData: true,
    officialUsdInrMeta,
    summary:
      'Official daily spot reference exchange rate of the Indian Rupee per 1 US Dollar (INR per 1 USD), published by Financial Benchmarks India Pvt. Ltd. (FBIL) and archived in RBI DBIE.',
    economicInterpretation: `On ${latest.label} (${
      latest.observationTimeIst || '13:30 IST'
    }), the official FBIL USD/INR reference rate stood at ₹${latest.value.toFixed(
      4
    )} per 1 USD, compared with ₹${previous.value.toFixed(4)} on ${
      previous.label
    } (${absFormatted} or ${pctFormatted}). Note: Reference rates are daily interbank benchmarks and not live tradable retail quotes.`,
    methodologyNote:
      'Computed by FBIL (since July 10, 2018; previously by RBI) based on volume-weighted interbank spot transactions during a random 15-minute window between 11:30 AM and 12:30 PM IST on Indian banking business days.',
    observations,
  };
}

/**
 * Loads official RBI DBIE / FBIL USD/INR Reference Rate data from user-uploaded CSV override (if present)
 * or from /data/rbi_fbil_usdinr_official.csv. Never silently substitutes fake or unlabelled sample data.
 */
export async function loadOfficialUsdInrData(options?: {
  simulateError?: boolean;
  simulateEmpty?: boolean;
}): Promise<UsdInrFetchResult> {
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
        'Simulated Fetch Failure: Could not retrieve /data/rbi_fbil_usdinr_official.csv. ArthNiti never silently substitutes hardcoded sample rates or unverified quotes when official RBI DBIE / FBIL data retrieval fails.',
      retrievalTimestamp,
      dataOrigin: 'official_rbi_fbil_csv',
      rawRowCount: 0,
    };
  }

  if (options?.simulateEmpty) {
    return {
      status: 'empty',
      indicator: null,
      errorMessage: null,
      retrievalTimestamp,
      dataOrigin: 'official_rbi_fbil_csv',
      rawRowCount: 0,
    };
  }

  // 1. Check for user-uploaded custom USD/INR CSV in localStorage
  try {
    const savedCustomCsv = window.localStorage.getItem(CUSTOM_USDINR_CSV_STORAGE_KEY);
    if (savedCustomCsv && savedCustomCsv.trim().length > 0) {
      const parsedIndicator = parseOfficialUsdInrCsv(
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
    window.localStorage.removeItem(CUSTOM_USDINR_CSV_STORAGE_KEY);
  }

  // 2. Fetch the official RBI DBIE / FBIL CSV bundled in /public/data/rbi_fbil_usdinr_official.csv
  try {
    const response = await fetch(OFFICIAL_USDINR_CSV_PATH, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load ${OFFICIAL_USDINR_CSV_PATH}`);
    }
    const csvText = await response.text();
    const parsedIndicator = parseOfficialUsdInrCsv(
      csvText,
      'official_rbi_fbil_csv',
      retrievalTimestamp
    );
    return {
      status: 'success',
      indicator: parsedIndicator,
      errorMessage: null,
      retrievalTimestamp,
      dataOrigin: 'official_rbi_fbil_csv',
      rawRowCount: parsedIndicator.observations.length,
    };
  } catch (err: any) {
    return {
      status: 'error',
      indicator: null,
      errorMessage:
        err?.message ||
        'Unable to load the official RBI DBIE / FBIL USD/INR Reference Rate dataset (/data/rbi_fbil_usdinr_official.csv).',
      retrievalTimestamp,
      dataOrigin: 'official_rbi_fbil_csv',
      rawRowCount: 0,
    };
  }
}

export function saveUserUploadedUsdInrCsv(csvText: string): EconomicIndicator {
  const retrievalTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const validated = parseOfficialUsdInrCsv(csvText, 'user_uploaded_csv', retrievalTimestamp);
  window.localStorage.setItem(CUSTOM_USDINR_CSV_STORAGE_KEY, csvText);
  return validated;
}

export function clearUserUploadedUsdInrCsv(): void {
  window.localStorage.removeItem(CUSTOM_USDINR_CSV_STORAGE_KEY);
}

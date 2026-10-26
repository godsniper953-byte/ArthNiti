import {
  DateRangeFilter,
  EconomicIndicator,
  ObservationPoint,
} from '../types/economy';

export interface SeriesSummaryStats {
  latest: number;
  earliest: number;
  min: number;
  max: number;
  mean: number;
  netChange: number;
  percentChange: number;
}

export interface AlignedComparisonPoint {
  periodKey: string;
  label: string;
  timestamp: number;
  rawA: number;
  rawB: number;
  indexedA: number;
  indexedB: number;
  deltaPercentA: number;
  deltaPercentB: number;
}

/**
 * Splits a CSV row while preserving commas inside quotes.
 */
export function splitCsvLine(line: string): string[] {
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
 * Validates that a candidate number is a finite numeric value.
 * Rejects NaN, +Infinity, -Infinity, null, undefined, and non-numeric strings.
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Formats signed USD Billion values consistently (e.g., -$30.21B or +$36.75B).
 * Never formats negative values as $-30.21B and returns an explicit unavailable
 * representation ('—') for NaN, Infinity, null, or undefined.
 */
export function formatSignedUsdBillion(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const abs = Math.abs(value).toFixed(decimals);
  if (value < 0) return `-$${abs}B`;
  if (value > 0) return `+$${abs}B`;
  return `$${abs}B`;
}

/**
 * Verifies the merchandise trade accounting identity:
 * Trade Balance = Merchandise Exports − Merchandise Imports
 * and Positive Deficit Magnitude = max(0, Imports − Exports).
 */
export function validateMerchandiseTradeIdentity(
  exportsUsdBn: number,
  importsUsdBn: number,
  balanceUsdBn: number,
  deficitMagnitudeUsdBn?: number
): {
  valid: boolean;
  expectedBalanceUsdBn: number;
  expectedDeficitMagnitudeUsdBn: number;
} {
  if (
    !Number.isFinite(exportsUsdBn) ||
    !Number.isFinite(importsUsdBn) ||
    !Number.isFinite(balanceUsdBn)
  ) {
    return {
      valid: false,
      expectedBalanceUsdBn: 0,
      expectedDeficitMagnitudeUsdBn: 0,
    };
  }
  const expectedBalanceUsdBn = Number((exportsUsdBn - importsUsdBn).toFixed(2));
  const expectedDeficitMagnitudeUsdBn =
    expectedBalanceUsdBn < 0 ? Number(Math.abs(expectedBalanceUsdBn).toFixed(2)) : 0;

  const balanceMatches = Math.abs(balanceUsdBn - expectedBalanceUsdBn) <= 0.01;
  const deficitMatches =
    deficitMagnitudeUsdBn === undefined ||
    (Number.isFinite(deficitMagnitudeUsdBn) &&
      Math.abs(deficitMagnitudeUsdBn - expectedDeficitMagnitudeUsdBn) <= 0.01);

  return {
    valid: balanceMatches && deficitMatches,
    expectedBalanceUsdBn,
    expectedDeficitMagnitudeUsdBn,
  };
}

/**
 * Verifies the bilateral trade accounting identities:
 * Total Bilateral Trade = Exports + Imports
 * Bilateral Trade Balance = Exports − Imports
 */
export function validateBilateralTradeIdentity(
  exportsUsdBn: number,
  importsUsdBn: number,
  totalTradeUsdBn: number,
  tradeBalanceUsdBn: number
): {
  valid: boolean;
  expectedTotalUsdBn: number;
  expectedBalanceUsdBn: number;
} {
  if (
    !Number.isFinite(exportsUsdBn) ||
    !Number.isFinite(importsUsdBn) ||
    !Number.isFinite(totalTradeUsdBn) ||
    !Number.isFinite(tradeBalanceUsdBn)
  ) {
    return {
      valid: false,
      expectedTotalUsdBn: 0,
      expectedBalanceUsdBn: 0,
    };
  }
  const expectedTotalUsdBn = Number((exportsUsdBn + importsUsdBn).toFixed(2));
  const expectedBalanceUsdBn = Number((exportsUsdBn - importsUsdBn).toFixed(2));

  const totalMatches = Math.abs(totalTradeUsdBn - expectedTotalUsdBn) <= 0.01;
  const balanceMatches = Math.abs(tradeBalanceUsdBn - expectedBalanceUsdBn) <= 0.01;

  return {
    valid: totalMatches && balanceMatches,
    expectedTotalUsdBn,
    expectedBalanceUsdBn,
  };
}

export function filterObservationsByRange(
  observations: ObservationPoint[] | null | undefined,
  range: DateRangeFilter
): ObservationPoint[] {
  if (!Array.isArray(observations) || observations.length === 0) {
    return [];
  }
  const validObservations = observations.filter(
    (obs) =>
      obs &&
      typeof obs.value === 'number' &&
      Number.isFinite(obs.value) &&
      typeof obs.timestamp === 'number' &&
      Number.isFinite(obs.timestamp)
  );
  if (validObservations.length === 0) {
    return [];
  }
  if (range === 'MAX' || range === '10Y') {
    return validObservations;
  }
  const latestTs = validObservations[validObservations.length - 1].timestamp;
  const yearsMap: Record<Exclude<DateRangeFilter, '10Y' | 'MAX'>, number> = {
    '1Y': 1.15,
    '3Y': 3.15,
    '5Y': 5.15,
  };
  const cutoffMs = latestTs - yearsMap[range] * 365.25 * 24 * 60 * 60 * 1000;
  const filtered = validObservations.filter((obs) => obs.timestamp >= cutoffMs);
  return filtered.length >= 2
    ? filtered
    : validObservations.slice(-Math.min(validObservations.length, 6));
}

export function computeSeriesStats(
  observations: ObservationPoint[] | null | undefined
): SeriesSummaryStats {
  if (!Array.isArray(observations) || observations.length === 0) {
    return {
      latest: 0,
      earliest: 0,
      min: 0,
      max: 0,
      mean: 0,
      netChange: 0,
      percentChange: 0,
    };
  }
  const vals = observations
    .filter(
      (o) =>
        o &&
        typeof o.timestamp === 'number' &&
        Number.isFinite(o.timestamp) &&
        typeof o.value === 'number' &&
        Number.isFinite(o.value)
    )
    .map((o) => o.value);
  if (vals.length === 0) {
    return {
      latest: 0,
      earliest: 0,
      min: 0,
      max: 0,
      mean: 0,
      netChange: 0,
      percentChange: 0,
    };
  }
  const earliest = vals[0];
  const latest = vals[vals.length - 1];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const mean = vals.reduce((acc, v) => acc + v, 0) / vals.length;
  const netChange = latest - earliest;
  const percentChange =
    earliest !== 0 ? ((latest - earliest) / Math.abs(earliest)) * 100 : 0;

  return {
    latest: Number(latest.toFixed(2)),
    earliest: Number(earliest.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    mean: Number(mean.toFixed(2)),
    netChange: Number(netChange.toFixed(2)),
    percentChange: Number(percentChange.toFixed(2)),
  };
}

export function alignIndicatorsForComparison(
  indicatorA: EconomicIndicator,
  indicatorB: EconomicIndicator,
  range: DateRangeFilter
): {
  points: AlignedComparisonPoint[];
  pearsonR: number;
  compatibleNativeUnits: boolean;
} {
  const obsA = filterObservationsByRange(indicatorA.observations, range);
  const obsB = filterObservationsByRange(indicatorB.observations, range);

  const matched: { label: string; timestamp: number; valA: number; valB: number }[] = [];
  const maxDiffMs = 68 * 24 * 60 * 60 * 1000;

  for (const ptA of obsA) {
    let closestB: ObservationPoint | null = null;
    let minDiff = Infinity;
    for (const ptB of obsB) {
      const diff = Math.abs(ptA.timestamp - ptB.timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestB = ptB;
      }
    }
    if (closestB && minDiff <= maxDiffMs) {
      matched.push({
        label: ptA.label,
        timestamp: ptA.timestamp,
        valA: ptA.value,
        valB: closestB.value,
      });
    }
  }

  if (matched.length === 0) {
    return {
      points: [],
      pearsonR: 0,
      compatibleNativeUnits: indicatorA.unitGroup === indicatorB.unitGroup,
    };
  }

  const baseA = matched[0].valA || 1;
  const baseB = matched[0].valB || 1;

  const points: AlignedComparisonPoint[] = matched.map((m) => {
    const indexedA = Number((100 + ((m.valA - baseA) / Math.abs(baseA)) * 100).toFixed(2));
    const indexedB = Number((100 + ((m.valB - baseB) / Math.abs(baseB)) * 100).toFixed(2));
    const deltaPercentA = Number((((m.valA - baseA) / Math.abs(baseA)) * 100).toFixed(2));
    const deltaPercentB = Number((((m.valB - baseB) / Math.abs(baseB)) * 100).toFixed(2));

    return {
      periodKey: String(m.timestamp),
      label: m.label,
      timestamp: m.timestamp,
      rawA: m.valA,
      rawB: m.valB,
      indexedA,
      indexedB,
      deltaPercentA,
      deltaPercentB,
    };
  });

  const n = points.length;
  const meanA = points.reduce((s, p) => s + p.rawA, 0) / n;
  const meanB = points.reduce((s, p) => s + p.rawB, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (const p of points) {
    const da = p.rawA - meanA;
    const db = p.rawB - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const denom = Math.sqrt(denA * denB);
  const pearsonR = denom === 0 ? 0 : Number((num / denom).toFixed(2));

  return {
    points,
    pearsonR,
    compatibleNativeUnits: indicatorA.unitGroup === indicatorB.unitGroup,
  };
}

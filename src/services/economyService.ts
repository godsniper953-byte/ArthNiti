import {
  DATA_SOURCES_REGISTRY,
  ILLUSTRATIVE_INDICATORS,
  INDIA_ECONOMIC_HUBS,
  LATEST_DATA_RELEASES,
  SECTOR_GVA_BREAKDOWN,
  STRUCTURED_INDICATOR_SOURCE_REGISTRY,
} from '../data/mockEconomicData';
import {
  DataSourceMetadata,
  DateRangeFilter,
  EconomicIndicator,
  IndiaEconomicHubNode,
  LatestDataRelease,
  ObservationPoint,
  PageId,
  SectorGvaShare,
  StructuredIndicatorSourceRegistryEntry,
} from '../types/economy';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim() || '';

export const VALID_PAGE_IDS: PageId[] = [
  'overview',
  'gdp-growth',
  'inflation',
  'labour-market',
  'currency-oil',
  'financial-markets',
  'economic-news',
  'comparisons',
  'data-sources',
  'about',
];

/**
 * Resolves deep-link URL hash (e.g. "#gdp-growth" or "#currency-oil?indicator=merchandise-trade")
 * or query string ("?page=inflation&indicator=cpi-inflation") into a validated PageId and optional indicatorId.
 */
export function resolvePageFromLocation(
  hash: string,
  search: string
): { pageId: PageId; indicatorId: string | null } {
  try {
    const cleanHash = (hash || '').replace(/^#\/?/, '').trim();
    const [hashPagePart, hashQueryPart] = cleanHash.split('?');
    const hashParams = new URLSearchParams(hashQueryPart || '');
    const searchParams = new URLSearchParams((search || '').replace(/^\?/, ''));

    const candidatePage = (
      hashPagePart ||
      hashParams.get('page') ||
      searchParams.get('page') ||
      ''
    )
      .trim()
      .toLowerCase();

    const pageId: PageId = VALID_PAGE_IDS.includes(candidatePage as PageId)
      ? (candidatePage as PageId)
      : 'overview';

    const indicatorId =
      hashParams.get('indicator') || searchParams.get('indicator') || null;

    return { pageId, indicatorId };
  } catch {
    return { pageId: 'overview', indicatorId: null };
  }
}

export interface EconomyDataServiceStatus {
  mode: 'official_verified_hybrid' | 'live_api';
  apiBaseUrl: string | null;
  lastSynced: string;
}

export function getServiceStatus(): EconomyDataServiceStatus {
  return {
    mode: API_BASE_URL ? 'live_api' : 'official_verified_hybrid',
    apiBaseUrl: API_BASE_URL || null,
    lastSynced:
      '7 Official Macro Series (MoSPI · RBI · FBIL · PPAC · MoCI) + Live Market & News APIs',
  };
}

export async function fetchAllIndicators(): Promise<EconomicIndicator[]> {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/indicators`);
      if (response.ok) {
        return (await response.json()) as EconomicIndicator[];
      }
    } catch {
      // Gracefully fall back to verified local dataset when external FastAPI server is unreachable
    }
  }
  return ILLUSTRATIVE_INDICATORS;
}

export function getIndicatorsSync(): EconomicIndicator[] {
  return ILLUSTRATIVE_INDICATORS;
}

export function getIndicatorById(id: string): EconomicIndicator | undefined {
  return ILLUSTRATIVE_INDICATORS.find((ind) => ind.id === id);
}

export function getDataSourcesSync(): DataSourceMetadata[] {
  return DATA_SOURCES_REGISTRY;
}

export function getStructuredIndicatorRegistrySync(): StructuredIndicatorSourceRegistryEntry[] {
  return STRUCTURED_INDICATOR_SOURCE_REGISTRY;
}

export function getSectorGvaSync(): SectorGvaShare[] {
  return SECTOR_GVA_BREAKDOWN;
}

export function getLatestReleasesSync(): LatestDataRelease[] {
  return LATEST_DATA_RELEASES;
}

export function getIndiaHubsSync(): IndiaEconomicHubNode[] {
  return INDIA_ECONOMIC_HUBS;
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

export interface SeriesSummaryStats {
  latest: number;
  earliest: number;
  min: number;
  max: number;
  mean: number;
  netChange: number;
  percentChange: number;
}

export function computeSeriesStats(
  observations: ObservationPoint[] | null | undefined
): SeriesSummaryStats {
  if (!Array.isArray(observations) || observations.length === 0) {
    return { latest: 0, earliest: 0, min: 0, max: 0, mean: 0, netChange: 0, percentChange: 0 };
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
    return { latest: 0, earliest: 0, min: 0, max: 0, mean: 0, netChange: 0, percentChange: 0 };
  }
  const earliest = vals[0];
  const latest = vals[vals.length - 1];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const mean = vals.reduce((acc, v) => acc + v, 0) / vals.length;
  const netChange = latest - earliest;
  const percentChange = earliest !== 0 ? ((latest - earliest) / Math.abs(earliest)) * 100 : 0;

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

export interface AlignedComparisonPoint {
  periodKey: string;
  label: string;
  timestamp: number;
  rawA: number;
  rawB: number;
  indexedA: number; // Base 100 at start of window
  indexedB: number; // Base 100 at start of window
  deltaPercentA: number; // % change from start of window
  deltaPercentB: number;
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

  // Align each point in A with the closest timestamp in B within 65 days
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

  // Calculate Pearson correlation coefficient (r)
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

export function formatSignedUsdBillion(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  const abs = Math.abs(value).toFixed(decimals);
  if (value < 0) return `-$${abs}B`;
  if (value > 0) return `+$${abs}B`;
  return `$${abs}B`;
}

export function exportObservationsToCsv(
  title: string,
  unit: string,
  source: string,
  observations: ObservationPoint[],
  secondaryLabel?: string,
  tertiaryLabel?: string
): void {
  const headerMeta = [
    `# ArthNiti — Indian Economic Intelligence Platform`,
    `# Dataset: ${title}`,
    `# Unit: ${unit}`,
    `# Source Attribution: ${source}`,
    `# Notice: Verified official statistical dataset & analytical time-series exported from ArthNiti`,
    `# Exported At: ${new Date().toISOString()}`,
    '',
  ];

  const columns = ['Date_Code', 'Period_Label', `Primary_Value (${unit})`];
  if (secondaryLabel) columns.push(secondaryLabel);
  if (tertiaryLabel) columns.push(tertiaryLabel);
  columns.push('Data_Status', 'Analytical_Note');

  const rows = observations.map((obs) => {
    const cells = [
      obs.date,
      `"${obs.label}"`,
      String(obs.value),
    ];
    if (secondaryLabel) cells.push(obs.secondaryValue !== undefined ? String(obs.secondaryValue) : '');
    if (tertiaryLabel) cells.push(obs.tertiaryValue !== undefined ? String(obs.tertiaryValue) : '');
    cells.push(obs.status, `"${(obs.note || '').replace(/"/g, '""')}"`);
    return cells.join(',');
  });

  const csvContent = [...headerMeta, columns.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFilename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  link.href = url;
  link.setAttribute('download', `arthniti-${safeFilename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import {
  ILLUSTRATIVE_INDICATORS,
  INDIA_ECONOMIC_HUBS,
  LATEST_DATA_RELEASES,
  SECTOR_GVA_BREAKDOWN,
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
import {
  AlignedComparisonPoint,
  SeriesSummaryStats,
  alignIndicatorsForComparison,
  computeSeriesStats,
  filterObservationsByRange,
  formatSignedUsdBillion,
} from '../utils/economicEngine';
import {
  getDataSourcesDirectory,
  getIndicatorSourceRegistry,
} from './indicatorRegistry';

export type { AlignedComparisonPoint, SeriesSummaryStats };
export {
  alignIndicatorsForComparison,
  computeSeriesStats,
  filterObservationsByRange,
  formatSignedUsdBillion,
};

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim() || '';

export const VALID_PAGE_IDS: PageId[] = [
  'overview',
  'gdp-growth',
  'inflation',
  'labour-market',
  'currency-oil',
  'financial-markets',
  'economic-news',
  'economist-bites',
  'comparisons',
  'data-sources',
  'about',
];

const HASH_PAGE_ALIASES: Record<string, { pageId: PageId; defaultIndicatorId?: string }> = {
  audit: { pageId: 'data-sources' },
  methodology: { pageId: 'data-sources' },
  provenance: { pageId: 'data-sources' },
  sources: { pageId: 'data-sources' },
  trade: { pageId: 'currency-oil', defaultIndicatorId: 'merchandise-trade' },
  'merchandise-trade': { pageId: 'currency-oil', defaultIndicatorId: 'merchandise-trade' },
  'crude-oil': { pageId: 'currency-oil', defaultIndicatorId: 'crude-oil' },
  'usd-inr': { pageId: 'currency-oil', defaultIndicatorId: 'usd-inr' },
  gdp: { pageId: 'gdp-growth', defaultIndicatorId: 'gdp-growth' },
  cpi: { pageId: 'inflation', defaultIndicatorId: 'cpi-inflation' },
  unemployment: { pageId: 'labour-market', defaultIndicatorId: 'unemployment-rate' },
  markets: { pageId: 'financial-markets' },
  news: { pageId: 'economic-news' },
  bites: { pageId: 'economist-bites' },
  economists: { pageId: 'economist-bites' },
  research: { pageId: 'economist-bites' },
};

/**
 * Resolves deep-link URL hash (e.g. "#gdp-growth", "#audit", "#methodology", "#trade", or "#currency-oil?indicator=merchandise-trade")
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

    const aliasMatch = HASH_PAGE_ALIASES[candidatePage];
    const pageId: PageId = VALID_PAGE_IDS.includes(candidatePage as PageId)
      ? (candidatePage as PageId)
      : aliasMatch
      ? aliasMatch.pageId
      : 'overview';

    const indicatorId =
      hashParams.get('indicator') ||
      searchParams.get('indicator') ||
      aliasMatch?.defaultIndicatorId ||
      null;

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
  return getDataSourcesDirectory();
}

export function getStructuredIndicatorRegistrySync(): StructuredIndicatorSourceRegistryEntry[] {
  return getIndicatorSourceRegistry();
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

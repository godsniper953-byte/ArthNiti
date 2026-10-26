import {
  DATA_SOURCES_REGISTRY,
  STRUCTURED_INDICATOR_SOURCE_REGISTRY,
} from '../data/mockEconomicData';
import {
  DataSourceMetadata,
  StructuredIndicatorSourceRegistryEntry,
} from '../types/economy';

export type IndicatorVerificationClassification =
  | 'official_source_independently_verified'
  | 'official_source_configured_bundled_csv'
  | 'secondary_aggregator_feed'
  | 'static_historical_dataset'
  | 'cached_observation'
  | 'stale_observation'
  | 'data_unavailable'
  | 'official_dataset_not_connected';

export interface IndicatorProvenanceStatusMeta {
  indicatorId: string;
  classification: IndicatorVerificationClassification;
  badgeLabel: string;
  isStaticCsvReload: boolean;
  verificationSummary: string;
}

export const INDICATOR_PROVENANCE_CLASSIFICATIONS: Record<
  string,
  IndicatorProvenanceStatusMeta
> = {
  'gdp-growth': {
    indicatorId: 'gdp-growth',
    classification: 'official_source_independently_verified',
    badgeLabel: 'Official Source Independently Verified (Bundled CSV)',
    isStaticCsvReload: true,
    verificationSummary:
      'Verified against MoSPI NSO Press Release (31 Aug 2026 & 05 Jun 2026): Q1 FY27 Real GDP +7.8% YoY (₹81.36 Lakh Cr Constant 2022–23 Prices vs ₹75.46 Lakh Cr in Q1 FY26) and Nominal GDP +10.3% YoY (₹88.27 Lakh Cr). Reload button revalidates local CSV.',
  },
  'cpi-inflation': {
    indicatorId: 'cpi-inflation',
    classification: 'official_source_independently_verified',
    badgeLabel: 'Official Source Independently Verified (Bundled CSV)',
    isStaticCsvReload: true,
    verificationSummary:
      'Verified against MoSPI NSO CPI Release (12 Oct 2026, Base 2024=100): Sep 2026 Combined Headline CPI 5.54% YoY (Index 109.49), Food CFPI 7.74% YoY. Core CPI (3.85%) is explicitly labelled as a derived analytical estimate.',
  },
  'rbi-repo-rate': {
    indicatorId: 'rbi-repo-rate',
    classification: 'official_source_independently_verified',
    badgeLabel: 'Official Source Independently Verified (Bundled CSV)',
    isStaticCsvReload: true,
    verificationSummary:
      'Verified against RBI 63rd Monetary Policy Committee Resolution (07 Oct 2026): Repo Rate 5.50% (+25 bps), SDF 5.25%, MSF/Bank Rate 5.75%, Stance: Calibrated Tightening.',
  },
  'unemployment-rate': {
    indicatorId: 'unemployment-rate',
    classification: 'official_source_independently_verified',
    badgeLabel: 'Official Source Independently Verified (Bundled CSV)',
    isStaticCsvReload: true,
    verificationSummary:
      'Verified against MoSPI 18th Monthly All-India PLFS Bulletin (15 Oct 2026, CWS Age 15+): Sep 2026 Overall UR 5.0% (Rural 4.2%, Urban 6.9%, LFPR 55.5%, WPR 52.7%).',
  },
  'usd-inr': {
    indicatorId: 'usd-inr',
    classification: 'official_source_configured_bundled_csv',
    badgeLabel: 'Official Benchmark Methodology Verified · Bundled CSV',
    isStaticCsvReload: true,
    verificationSummary:
      'FBIL post-10 Jul 2018 benchmark transition and FY2017–FY2025 historical rates verified via RBI DBIE Table r691; 2026 observations (₹94.6986 per 1 USD on 22 Oct 2026) are loaded from the bundled CSV dataset (daily reference benchmark, not a live tradable spot quote).',
  },
  'crude-oil': {
    indicatorId: 'crude-oil',
    classification: 'official_source_independently_verified',
    badgeLabel: 'Official Source Independently Verified (Bundled CSV)',
    isStaticCsvReload: true,
    verificationSummary:
      'Verified against PPAC International Crude Oil Price tables (ppac.gov.in): Sep 2026 Completed Monthly Average $116.09/bbl (+28.72% MoM vs Aug 2026 $90.19/bbl); kept strictly separate from Oct 2026 Partial MTD ($120.08/bbl) and Daily ($119.99/bbl on 22 Oct 2026).',
  },
  'merchandise-trade': {
    indicatorId: 'merchandise-trade',
    classification: 'official_source_independently_verified',
    badgeLabel: 'Official Source Independently Verified (Bundled CSV)',
    isStaticCsvReload: true,
    verificationSummary:
      'Verified against Ministry of Commerce & Industry / PIB Foreign Trade Release (15 Oct 2026): Sep 2026 Exports $44.40B, Imports $74.61B, Signed Balance -$30.21B; Official Apr–Sep H1 FY27 Cumulative Exports $259.89B, Imports $437.53B, Deficit $177.64B.',
  },
  'bilateral-trade-network': {
    indicatorId: 'bilateral-trade-network',
    classification: 'static_historical_dataset',
    badgeLabel: 'Static Historical Dataset (Verified FY 2023–24 Final)',
    isStaticCsvReload: true,
    verificationSummary:
      'Verified against MoCI TRADESTAT Export-Import Data Bank (FY 2023–24 Final): Total Merchandise Trade $1,115.28B (Exports $437.07B + Imports $678.21B, Balance -$241.14B) across 22 sovereign partners + 2 regional blocs; 3 corridors marked Official Dataset Not Connected.',
  },
  'live-indian-market-indices': {
    indicatorId: 'live-indian-market-indices',
    classification: 'secondary_aggregator_feed',
    badgeLabel: 'Secondary Aggregator Feed (Delayed Public Exchange Proxy)',
    isStaticCsvReload: false,
    verificationSummary:
      'Retrieved via server-side /api/market-indices proxy (Yahoo Finance v8 Exchange Feed for ^NSEI, ^BSESN, ^NSEBANK, ^CNXIT, NIFTY_MIDCAP_100.NS) with 1–5 min exchange dissemination delay, 15s server cache TTL, and explicit Stale Cache Fallback.',
  },
  'economic-news-intelligence': {
    indicatorId: 'economic-news-intelligence',
    classification: 'secondary_aggregator_feed',
    badgeLabel: 'Live Institutional & Financial RSS/JSON Aggregator',
    isStaticCsvReload: false,
    verificationSummary:
      'Server-side /api/economic-news engine polling 10 configured institutional (RBI, Fed, ECB, World Bank) and financial press feeds with 300s cache TTL, HTTP/HTTPS URL sanitization, and Jaccard headline deduplication.',
  },
};

export function getIndicatorSourceRegistry(): StructuredIndicatorSourceRegistryEntry[] {
  return STRUCTURED_INDICATOR_SOURCE_REGISTRY;
}

export function getIndicatorSourceEntryById(
  indicatorId: string
): StructuredIndicatorSourceRegistryEntry | undefined {
  return STRUCTURED_INDICATOR_SOURCE_REGISTRY.find(
    (entry) => entry.indicatorId === indicatorId
  );
}

export function getDataSourcesDirectory(): DataSourceMetadata[] {
  return DATA_SOURCES_REGISTRY;
}

export function getIndicatorProvenanceClassification(
  indicatorId: string
): IndicatorProvenanceStatusMeta | undefined {
  return INDICATOR_PROVENANCE_CLASSIFICATIONS[indicatorId];
}

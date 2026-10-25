export type PageId =
  | 'overview'
  | 'gdp-growth'
  | 'inflation'
  | 'labour-market'
  | 'currency-oil'
  | 'financial-markets'
  | 'comparisons'
  | 'data-sources'
  | 'about';

export type IndicatorCategory =
  | 'gdp'
  | 'inflation'
  | 'labour'
  | 'currency_oil'
  | 'markets'
  | 'policy';

export type SemanticPolarity =
  | 'higher_is_favorable'
  | 'lower_is_favorable'
  | 'target_band'
  | 'neutral_context';

export type DataFrequency = 'Quarterly' | 'Monthly' | 'Annual';

export type DateRangeFilter = '1Y' | '3Y' | '5Y' | '10Y' | 'MAX';

export type ChartDisplayType = 'line' | 'area' | 'bar';

export interface ObservationPoint {
  date: string; // e.g. "2026-Q2" or "2026-09"
  timestamp: number; // sortable epoch ms
  label: string; // e.g. "Q2 FY27" or "Sep 2026"
  value: number; // Primary value (e.g. YoY Inflation Rate %)
  secondaryValue?: number; // e.g. Core CPI % or Nominal GDP
  tertiaryValue?: number; // e.g. Food CFPI %
  generalIndexValue?: number; // CPI Index Level (e.g. 109.49) kept distinct from YoY % rate
  baseYear?: string; // e.g. "2024=100" or "2012=100"
  releaseDate?: string; // e.g. "12 Oct 2026"
  status: 'Final' | 'Revised' | 'Provisional';
  note?: string;
}

export interface OfficialCpiMetadata {
  isOfficialData: boolean;
  dataOrigin: 'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  referenceMonth: string;
  releaseDate: string;
  provisionalOrFinal: 'Provisional' | 'Final' | 'Revised';
  latestGeneralIndex: number;
  activeBaseYear: string;
  historicalBaseYearNote: string;
  mospiPortalUrl: string;
  esankhyikiCatalogueUrl: string;
  lastUpdatedTimestamp: string;
}

export interface EconomicIndicator {
  id: string;
  name: string;
  shortName: string;
  category: IndicatorCategory;
  pageId: PageId;
  unit: string;
  unitGroup: 'percent_rate' | 'currency_inr' | 'usd_barrel' | 'equity_index';
  frequency: DataFrequency;
  currentValue: number;
  previousValue: number;
  changeValue: number;
  changeLabel: string;
  reportingPeriod: string;
  releaseDate: string;
  sourceId: string;
  sourceShortName: string;
  semanticPolarity: SemanticPolarity;
  isOfficialData?: boolean;
  officialCpiMeta?: OfficialCpiMetadata;
  targetBand?: {
    min: number;
    max: number;
    midpoint: number;
    label: string;
  };
  summary: string;
  economicInterpretation: string;
  methodologyNote: string;
  observations: ObservationPoint[];
}

export interface DataSourceMetadata {
  id: string;
  name: string;
  shortName: string;
  ministryOrBody: string;
  officialUrl: string;
  secondaryUrl?: string;
  primaryIndicators: string[];
  unitsAndBaseYear: string;
  frequency: string;
  coverageDates: string;
  dataFreshnessLag: string;
  methodologySummary: string;
  knownLimitations: string[];
}

export interface SectorGvaShare {
  sector: string;
  sharePercent: number;
  growthRateYoY: number;
  realTrillionInr: number;
  description: string;
}

export interface LatestDataRelease {
  id: string;
  indicatorId: string;
  indicatorName: string;
  period: string;
  releaseDate: string;
  actualValue: string;
  previousValue: string;
  source: string;
  summaryNote: string;
  pageId: PageId;
  isOfficial?: boolean;
}

export interface IndiaEconomicHubNode {
  id: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  primarySector: string;
  gdpContributionNote: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  accentColor: 'emerald' | 'gold' | 'cyan';
}

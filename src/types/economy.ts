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
  date: string; // e.g. "2026-27-Q1" or "2026-09"
  timestamp: number; // sortable epoch ms
  label: string; // e.g. "Q1 FY27" or "Sep 2026"
  value: number; // Primary value (e.g. Real GDP YoY % or YoY Inflation Rate %)
  secondaryValue?: number; // e.g. Nominal GDP YoY % or Core CPI %
  tertiaryValue?: number; // e.g. Food CFPI %
  generalIndexValue?: number; // CPI Index Level (e.g. 109.49) kept distinct from YoY % rate
  financialYear?: string; // e.g. "2026-27"
  quarter?: string; // e.g. "Q1"
  referencePeriod?: string; // e.g. "Apr-Jun 2026"
  realGdpConstantLakhCr?: number; // e.g. 90.41 (₹ Lakh Crore at Constant 2022-23 Prices)
  estimateStatusLabel?: string; // e.g. "Quarterly Estimate (Q1)" or "Provisional Estimate"
  baseYear?: string; // e.g. "2022-23=100" or "2024=100"
  releaseDate?: string; // e.g. "31 Aug 2026"
  announcementDate?: string; // e.g. "07 Oct 2026"
  effectiveDate?: string; // e.g. "07 Oct 2026"
  changeBps?: number; // e.g. 25 or -25 or 0
  policyStance?: string; // e.g. "Calibrated Tightening" or "Neutral"
  ruralUrPct?: number; // e.g. 4.2 (Rural CWS Unemployment Rate %)
  urbanUrPct?: number; // e.g. 6.9 (Urban CWS Unemployment Rate %)
  lfprCwsPct?: number; // e.g. 55.5 (Labour Force Participation Rate CWS %, kept distinct from UR)
  wprCwsPct?: number; // e.g. 52.7 (Worker Population Ratio CWS %, kept distinct from UR)
  surveyMeasure?: string; // e.g. "Current Weekly Status (CWS) · Age 15+"
  observationTimeIst?: string; // e.g. "13:30 IST"
  benchmarkPublisher?: string; // e.g. "FBIL (Post-Jul 2018)" or "RBI (Pre-Jul 2018)"
  archiveSource?: string; // e.g. "FBIL / RBI DBIE"
  exactRate4Dec?: number; // e.g. 94.6986
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

export interface OfficialGdpMetadata {
  isOfficialData: boolean;
  dataOrigin: 'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  financialYear: string;
  quarter: string;
  referencePeriod: string;
  periodLabel: string;
  releaseDate: string;
  estimateStatus: string;
  activeBaseYear: string;
  priceValuation: string;
  realGdpLevelLakhCr?: number;
  seriesCompatibilityNote: string;
  mospiGdpPortalUrl: string;
  esankhyikiNasCatalogueUrl: string;
  mospiFaqUrl: string;
  lastUpdatedTimestamp: string;
}

export interface OfficialRepoMetadata {
  isOfficialData: boolean;
  dataOrigin: 'official_rbi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  currentRepoRate: number;
  previousRepoRate: number;
  changeBps: number;
  sdfRate: number;
  msfAndBankRate: number;
  effectiveDate: string;
  announcementDate: string;
  mpcMeetingLabel: string;
  policyStance: string;
  rbiOfficialWebsiteUrl: string;
  rbiMonetaryPolicyUrl: string;
  rbiDbiePortalUrl: string;
  lastVerifiedTimestamp: string;
}

export interface OfficialPlfsMetadata {
  isOfficialData: boolean;
  dataOrigin: 'official_mospi_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  referenceMonth: string;
  releaseDate: string;
  ageCohort: string;
  statusApproach: string;
  overallUrPct: number;
  ruralUrPct: number;
  urbanUrPct: number;
  lfprCwsPct: number;
  wprCwsPct: number;
  seriesCompatibilityNote: string;
  mospiPlfsPortalUrl: string;
  esankhyikiPlfsCatalogueUrl: string;
  mospiLatestReleasesUrl: string;
  lastVerifiedTimestamp: string;
}

export interface OfficialUsdInrMetadata {
  isOfficialData: boolean;
  dataOrigin: 'official_rbi_fbil_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  latestRateInrPerUsd: number;
  previousRateInrPerUsd: number;
  absoluteChangeInr: number;
  percentageChangePct: number;
  observationDate: string;
  observationDateIso: string;
  observationTimeIst: string;
  previousObservationDate: string;
  retrievalTimestamp: string;
  isStaleOrLagging: boolean;
  stalenessAgeDays: number;
  stalenessMessage: string;
  currentBenchmarkPublisher: string;
  historicalDatabaseName: string;
  july2018TransitionNote: string;
  nonTradableQuoteDisclaimer: string;
  rbiDbieTableUrl: string;
  fbilOfficialUrl: string;
  rbiOfficialUrl: string;
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
  officialGdpMeta?: OfficialGdpMetadata;
  officialRepoMeta?: OfficialRepoMetadata;
  officialPlfsMeta?: OfficialPlfsMetadata;
  officialUsdInrMeta?: OfficialUsdInrMetadata;
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

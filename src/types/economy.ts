export type PageId =
  | 'overview'
  | 'gdp-growth'
  | 'inflation'
  | 'labour-market'
  | 'currency-oil'
  | 'financial-markets'
  | 'economic-news'
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
  observationKind?: 'Completed Monthly Average' | 'Month-to-Date (Partial)' | 'Daily Observation';
  isCompletedMonth?: boolean;
  momChangeUsd?: number; // Month-over-Month USD/bbl change between comparable completed months
  momChangePct?: number; // Month-over-Month % change between comparable completed months
  sourceLastUpdated?: string; // e.g. "22 Oct 2026"
  merchandiseExportsUsdBn?: number; // e.g. 44.40 (USD Billion)
  merchandiseImportsUsdBn?: number; // e.g. 74.61 (USD Billion)
  tradeBalanceUsdBn?: number; // Signed Trade Balance = Exports - Imports (e.g. -30.21 USD Billion)
  tradeDeficitMagnitudeUsdBn?: number; // Positive Deficit Magnitude when Imports > Exports (e.g. 30.21 USD Billion)
  exportsYoYPct?: number; // Year-over-Year % change in Merchandise Exports (e.g. 23.04)
  importsYoYPct?: number; // Year-over-Year % change in Merchandise Imports (e.g. 8.00)
  servicesSurplusEstUsdBn?: number; // Estimated monthly services trade surplus for scope distinction (e.g. 16.91)
  overallTradeBalanceUsdBn?: number; // Combined Merchandise + Services balance for scope distinction (e.g. -13.30)
  fyCumulativeExportsUsdBn?: number; // Kept strictly separate from monthly figures (e.g. 259.89)
  fyCumulativeImportsUsdBn?: number; // Kept strictly separate from monthly figures (e.g. 437.53)
  fyCumulativeDeficitUsdBn?: number; // Kept strictly separate from monthly figures (e.g. 177.64)
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

export interface OfficialCrudeOilMetadata {
  isOfficialData: boolean;
  dataOrigin: 'official_ppac_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  latestCompletedMonthLabel: string;
  latestCompletedMonthPriceUsd: number;
  previousCompletedMonthLabel: string;
  previousCompletedMonthPriceUsd: number;
  completedMonthChangeUsd: number;
  completedMonthChangePct: number;
  latestDailyPriceUsd: number;
  latestDailyDateLabel: string;
  latestMtdAveragePriceUsd: number;
  latestMtdLabel: string;
  sourceLastUpdatedDate: string;
  retrievalTimestamp: string;
  isStaleOrLagging: boolean;
  stalenessMessage: string;
  basketCompositionNote: string;
  ppacPricesUrl: string;
  ppacMainPortalUrl: string;
  partialMonthRow?: ObservationPoint;
}

export interface OfficialMerchandiseTradeMetadata {
  isOfficialData: boolean;
  dataOrigin: 'official_moci_csv' | 'user_uploaded_csv' | 'demonstration_fallback';
  referenceMonthLabel: string; // e.g. "Sep 2026"
  financialYear: string; // e.g. "2026-27"
  releaseDate: string; // e.g. "15 Oct 2026"
  estimateStatus: 'Provisional' | 'Revised' | 'Final';
  merchandiseExportsUsdBn: number; // 44.40
  merchandiseImportsUsdBn: number; // 74.61
  tradeBalanceUsdBn: number; // -30.21 (Exports - Imports)
  tradeDeficitMagnitudeUsdBn: number; // 30.21 (positive magnitude when Imports > Exports)
  previousMonthLabel: string; // "Aug 2026"
  previousMonthBalanceUsdBn: number; // -26.86
  previousYearSameMonthLabel: string; // "Sep 2025"
  previousYearSameMonthBalanceUsdBn: number; // -33.00
  previousYearExportsUsdBn: number; // 36.08
  previousYearImportsUsdBn: number; // 69.08
  exportsYoYPct: number; // +23.04
  importsYoYPct: number; // +8.00
  deficitYoYChangePct: number; // -8.45 (narrowed from $33.00B to $30.21B)
  servicesSurplusEstUsdBn: number; // 16.91
  overallTradeBalanceUsdBn: number; // -13.30
  fyCumulativePeriodLabel: string; // "Apr–Sep 2026–27 (H1 FY27)"
  fyCumulativeExportsUsdBn: number; // 259.89
  fyCumulativeImportsUsdBn: number; // 437.53
  fyCumulativeDeficitUsdBn: number; // 177.64
  retrievalTimestamp: string;
  isStaleOrLagging: boolean;
  stalenessMessage: string;
  scopeDistinctionNote: string;
  commercePortalUrl: string;
  tradestatUrl: string;
  rbiDbieForeignTradeUrl: string;
}

export interface EconomicIndicator {
  id: string;
  name: string;
  shortName: string;
  category: IndicatorCategory;
  pageId: PageId;
  unit: string;
  unitGroup: 'percent_rate' | 'currency_inr' | 'usd_barrel' | 'usd_billion' | 'equity_index';
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
  officialCrudeMeta?: OfficialCrudeOilMetadata;
  officialTradeMeta?: OfficialMerchandiseTradeMetadata;
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

export type TradeRegionFilter =
  | 'All'
  | 'BRICS'
  | 'European Union'
  | 'ASEAN'
  | 'North America'
  | 'Middle East'
  | 'Asia-Pacific'
  | 'Africa'
  | 'Latin America';

export type TradeRouteDisplayMode = 'all' | 'exports' | 'imports' | 'balance';

export interface GlobalTradePartnerNode {
  id: string;
  name: string;
  shortName: string;
  isoCode: string;
  flagCode: string;
  entityType: 'country' | 'regional_aggregate';
  dataStatus: 'verified_official' | 'illustrative_corridor';
  primaryRegion: Exclude<TradeRegionFilter, 'All'>;
  isBricsMember: boolean;
  isAseanMember: boolean;
  isEuAggregate: boolean;
  lat: number;
  lon: number;
  reportingPeriod: string;
  exportsUsdBn: number | null;
  importsUsdBn: number | null;
  totalTradeUsdBn: number | null;
  tradeBalanceUsdBn: number | null;
  shareOfIndiaTradePct: number | null;
  keyExportsFromIndia: string;
  keyImportsToIndia: string;
  relationshipNote: string;
  sourceUrl: string;
}

export interface GlobalTradeNetworkDataset {
  status: 'success' | 'empty' | 'error';
  partners: GlobalTradePartnerNode[];
  reportingPeriod: string;
  indiaTotalMerchandiseExportsUsdBn: number;
  indiaTotalMerchandiseImportsUsdBn: number;
  indiaTotalMerchandiseTradeUsdBn: number;
  indiaTotalMerchandiseBalanceUsdBn: number;
  sourceName: string;
  sourceUrl: string;
  lastUpdated: string;
  errorMessage?: string;
}

export interface StructuredIndicatorSourceRegistryEntry {
  indicatorId: string;
  displayName: string;
  provider: string;
  sourceUrl: string;
  retrievalMethod: string;
  unit: string;
  referencePeriod: string;
  publicationTimestamp: string;
  lastSuccessfulRetrievalNote: string;
  expectedUpdateFrequency: string;
  freshnessThreshold: string;
  dataStatus:
    | 'verified_official_csv'
    | 'live_exchange_api_proxy'
    | 'live_rss_json_aggregation';
  methodologicalNotes: string;
}



import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { parseMospiGdpCsv } from '../src/services/gdpDataService.ts';
import { parseMospiCpiCsv } from '../src/services/cpiDataService.ts';
import { parseRbiRepoCsv } from '../src/services/repoDataService.ts';
import { parseMospiPlfsCsv } from '../src/services/plfsDataService.ts';
import { parseOfficialUsdInrCsv } from '../src/services/usdInrDataService.ts';
import { parseOfficialPpacCrudeCsv } from '../src/services/crudeOilDataService.ts';
import { parseOfficialMerchandiseTradeCsv } from '../src/services/tradeBalanceDataService.ts';
import { ObservationPoint } from '../src/types/economy.ts';
import {
  INDIA_FY24_TOTAL_TRADE_USD_BN,
  parseBilateralTradeCsv,
} from '../src/services/globalTradeNetworkService.ts';
import {
  auditBilateralTradeNetworkNodes,
  OFFICIAL_BILATERAL_TRADE_CSV_PATH,
} from '../src/data/indiaTradeNetworkData.ts';
import {
  INDICATOR_PROVENANCE_CLASSIFICATIONS,
  getIndicatorProvenanceClassification,
  getIndicatorSourceEntryById,
  getIndicatorSourceRegistry,
} from '../src/services/indicatorRegistry.ts';
import {
  validateBilateralTradeIdentity,
  validateMerchandiseTradeIdentity,
} from '../src/utils/economicEngine.ts';
import {
  VALID_PAGE_IDS,
  alignIndicatorsForComparison,
  computeSeriesStats,
  filterObservationsByRange,
  formatSignedUsdBillion,
  getDataSourcesSync,
  getIndicatorsSync,
  getStructuredIndicatorRegistrySync,
  resolvePageFromLocation,
} from '../src/services/economyService.ts';
import {
  computeBackoffDelayMs,
  createOutOfOrderResponseGuard,
  formatIndianIndexNumber,
  formatPercentChange,
  formatPointChange,
  isRetryableHttpStatus,
} from '../src/services/indianMarketService.ts';
import {
  evaluateIndianMarketSession,
  resetMarketIndicesCacheForTest,
  default as marketIndicesHandler,
} from '../api/market-indices.ts';
import {
  areHeadlinesDuplicate,
  isEconomicallyRelevant,
  normalizeNewsPublicationTimestamp,
  parseRssFeedXmlItems,
  resetEconomicNewsCacheForTest,
  sanitizeExternalHttpUrl,
  default as economicNewsHandler,
} from '../api/economic-news.ts';
import { getHealthCheckPayload, default as healthHandler } from '../api/health.ts';
import { ARTHNITI_NAV_ITEMS } from '../src/components/navigation/Sidebar.tsx';

const PUBLIC_DATA_DIR = path.resolve(process.cwd(), 'public/data');

// Helper mock HTTP Req/Res for serverless handler verification
function createMockReqRes(method = 'GET', query: Record<string, string> = {}) {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: any = null;
  let ended = false;

  const req = { method, query };
  const res = {
    setHeader(k: string, v: string) {
      headers[k.toLowerCase()] = v;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      jsonBody = payload;
      ended = true;
      return this;
    },
    end() {
      ended = true;
      return this;
    },
  };

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getHeaders: () => headers,
    getJson: () => jsonBody,
    isEnded: () => ended,
  };
}

test('1. All 8 Official CSV Datasets parse cleanly and satisfy monthly & cumulative economic accounting identities', () => {
  // 1. Official MoSPI GDP (Base 2022-23)
  const gdpCsv = fs.readFileSync(path.join(PUBLIC_DATA_DIR, 'mospi_gdp_official.csv'), 'utf-8');
  const gdpInd = parseMospiGdpCsv(gdpCsv, 'official_mospi_csv');
  assert.equal(gdpInd.currentValue, 7.8, 'Latest Real GDP YoY should be 7.8% (Q1 FY27)');
  assert.equal(gdpInd.officialGdpMeta?.activeBaseYear, '2022–23');
  assert.equal(
    gdpInd.officialGdpMeta?.realGdpLevelLakhCr,
    81.36,
    'Q1 FY27 Real GDP constant-price level must equal 81.36 Lakh Crore (verified against Q1 FY26 75.46 Lakh Cr -> +7.82% YoY)'
  );
  assert.equal(gdpInd.releaseDate, '31 Aug 2026');

  // Verify Q1 FY27 vs Q1 FY26 and Q4 FY26 vs Q4 FY25 YoY growth consistency in GDP CSV
  const q1Fy27 = gdpInd.observations.find((o) => o.date === '2026-27-Q1')!;
  const q1Fy26 = gdpInd.observations.find((o) => o.date === '2025-26-Q1')!;
  const computedQ1Growth = Number(
    (((q1Fy27.realGdpConstantLakhCr! - q1Fy26.realGdpConstantLakhCr!) /
      q1Fy26.realGdpConstantLakhCr!) *
      100).toFixed(1)
  );
  assert.equal(computedQ1Growth, 7.8, 'Constant-price GDP level ratio Q1 FY27 / Q1 FY26 must yield 7.8% YoY');

  // 2. Official MoSPI CPI (Base 2024=100)
  const cpiCsv = fs.readFileSync(path.join(PUBLIC_DATA_DIR, 'mospi_cpi_official.csv'), 'utf-8');
  const cpiInd = parseMospiCpiCsv(cpiCsv, 'official_mospi_csv');
  assert.equal(cpiInd.currentValue, 5.54, 'Latest CPI Headline YoY should be 5.54% (Sep 2026)');
  assert.equal(cpiInd.previousValue, 4.83, 'Previous CPI Headline YoY should be 4.83% (Aug 2026)');
  assert.equal(
    cpiInd.officialCpiMeta?.latestGeneralIndex,
    109.49,
    'CPI Index level (109.49) must be kept distinct from YoY inflation rate (5.54%)'
  );

  // 3. Official RBI Policy Repo Rate
  const repoCsv = fs.readFileSync(path.join(PUBLIC_DATA_DIR, 'rbi_repo_official.csv'), 'utf-8');
  const repoInd = parseRbiRepoCsv(repoCsv, 'official_rbi_csv');
  assert.equal(repoInd.currentValue, 5.5, 'Latest RBI Repo Rate should be 5.50%');
  assert.equal(repoInd.officialRepoMeta?.sdfRate, 5.25);
  assert.equal(repoInd.officialRepoMeta?.msfAndBankRate, 5.75);
  assert.equal(repoInd.officialRepoMeta?.changeBps, 25);

  // 4. Official MoSPI Monthly PLFS (CWS Age 15+)
  const plfsCsv = fs.readFileSync(path.join(PUBLIC_DATA_DIR, 'mospi_plfs_official.csv'), 'utf-8');
  const plfsInd = parseMospiPlfsCsv(plfsCsv, 'official_mospi_csv');
  assert.equal(plfsInd.currentValue, 5.0, 'Latest All-India CWS Unemployment Rate should be 5.0%');
  assert.equal(plfsInd.officialPlfsMeta?.ruralUrPct, 4.2);
  assert.equal(plfsInd.officialPlfsMeta?.urbanUrPct, 6.9);
  assert.equal(plfsInd.officialPlfsMeta?.lfprCwsPct, 55.5);
  assert.equal(plfsInd.officialPlfsMeta?.wprCwsPct, 52.7);

  // 5. Official FBIL / RBI DBIE USD/INR Reference Rate
  const fxCsv = fs.readFileSync(
    path.join(PUBLIC_DATA_DIR, 'rbi_fbil_usdinr_official.csv'),
    'utf-8'
  );
  const fxInd = parseOfficialUsdInrCsv(
    fxCsv,
    'official_rbi_fbil_csv',
    '23 Oct 2026, 15:30 IST'
  );
  assert.equal(fxInd.currentValue, 94.6986, 'Latest FBIL USD/INR Reference Rate should be 94.6986');
  assert.ok(
    fxInd.officialUsdInrMeta?.currentBenchmarkPublisher.includes('FBIL'),
    'Must attribute post-July 2018 benchmark to FBIL'
  );

  // 6. Official PPAC Indian Basket Crude Oil: Completed Monthly Avg vs Partial MTD vs Daily
  const crudeCsv = fs.readFileSync(path.join(PUBLIC_DATA_DIR, 'ppac_crude_official.csv'), 'utf-8');
  const crudeInd = parseOfficialPpacCrudeCsv(
    crudeCsv,
    'official_ppac_csv',
    '23 Oct 2026, 15:30 IST'
  );
  assert.equal(
    crudeInd.currentValue,
    116.09,
    'Primary series value must be the latest completed monthly average ($116.09/bbl Sep 2026)'
  );
  assert.equal(crudeInd.officialCrudeMeta?.previousCompletedMonthPriceUsd, 90.19);
  assert.equal(crudeInd.officialCrudeMeta?.completedMonthChangeUsd, 25.9);
  assert.equal(crudeInd.officialCrudeMeta?.completedMonthChangePct, 28.72);
  assert.equal(crudeInd.officialCrudeMeta?.latestDailyPriceUsd, 119.99);
  assert.equal(crudeInd.officialCrudeMeta?.latestMtdAveragePriceUsd, 120.08);
  assert.ok(
    crudeInd.observations.every((obs: ObservationPoint) => obs.isCompletedMonth === true),
    'Completed monthly chart series must exclude partial MTD rows'
  );
  assert.ok(
    !crudeInd.observations.some((obs: ObservationPoint) => obs.date.includes('MTD')),
    'No MTD row may appear in completedMonthlyObs'
  );

  // 7. Official MoCI Merchandise Trade Balance: Monthly & Cumulative Identities
  const tradeCsv = fs.readFileSync(
    path.join(PUBLIC_DATA_DIR, 'moci_merchandise_trade_official.csv'),
    'utf-8'
  );
  const tradeInd = parseOfficialMerchandiseTradeCsv(tradeCsv, 'official_moci_csv');
  assert.equal(tradeInd.currentValue, -30.21, 'Sep 2026 signed trade balance must be -30.21B (never -44.40B)');
  assert.equal(tradeInd.officialTradeMeta?.merchandiseExportsUsdBn, 44.4);
  assert.equal(tradeInd.officialTradeMeta?.merchandiseImportsUsdBn, 74.61);
  assert.equal(tradeInd.officialTradeMeta?.tradeDeficitMagnitudeUsdBn, 30.21);
  // Official published DGCI&S / PIB Apr-Sep 2026 (H1 FY 2026-27) cumulative totals:
  assert.equal(tradeInd.officialTradeMeta?.fyCumulativeExportsUsdBn, 259.89);
  assert.equal(tradeInd.officialTradeMeta?.fyCumulativeImportsUsdBn, 437.53);
  assert.equal(tradeInd.officialTradeMeta?.fyCumulativeDeficitUsdBn, 177.64);

  // Verify Jan 2026 row preserves official published Apr-Jan FY26 cumulative figures (366.63 / 649.86 / 283.23)
  const jan2026Obs = tradeInd.observations.find((o) => o.date === '2026-01')!;
  assert.equal(jan2026Obs.merchandiseExportsUsdBn, 36.56);
  assert.equal(jan2026Obs.merchandiseImportsUsdBn, 71.24);
  assert.equal(jan2026Obs.tradeBalanceUsdBn, -34.68);
  assert.equal(jan2026Obs.fyCumulativeExportsUsdBn, 366.63);
  assert.equal(jan2026Obs.fyCumulativeImportsUsdBn, 649.86);
  assert.equal(jan2026Obs.fyCumulativeDeficitUsdBn, 283.23);

  // Verify every single monthly observation & fiscal-year cumulative deficit identity in tradeInd
  for (const obs of tradeInd.observations) {
    const exp = obs.merchandiseExportsUsdBn!;
    const imp = obs.merchandiseImportsUsdBn!;
    const bal = obs.tradeBalanceUsdBn!;
    const identityCheck = validateMerchandiseTradeIdentity(
      exp,
      imp,
      bal,
      obs.tradeDeficitMagnitudeUsdBn
    );
    assert.equal(
      identityCheck.valid,
      true,
      `Row ${obs.date} must satisfy monthly merchandise trade identity`
    );
    assert.equal(
      obs.fyCumulativeDeficitUsdBn,
      Number((obs.fyCumulativeImportsUsdBn! - obs.fyCumulativeExportsUsdBn!).toFixed(2)),
      `Row ${obs.date} cumulative FY deficit must equal cumulative imports minus cumulative exports`
    );
    if (obs.servicesSurplusEstUsdBn !== undefined && obs.overallTradeBalanceUsdBn !== undefined) {
      assert.equal(
        Number((bal + obs.servicesSurplusEstUsdBn).toFixed(2)),
        obs.overallTradeBalanceUsdBn,
        `Row ${obs.date}: Overall Trade Balance must equal Merchandise Balance + Services Surplus`
      );
    }
  }

  // 8. Official TRADESTAT Bilateral Partners Matrix & Single Source of Truth Audit Helper
  assert.equal(OFFICIAL_BILATERAL_TRADE_CSV_PATH, '/data/moci_tradestat_bilateral_partners.csv');
  const bilateralCsv = fs.readFileSync(
    path.join(PUBLIC_DATA_DIR, 'moci_tradestat_bilateral_partners.csv'),
    'utf-8'
  );
  const partners = parseBilateralTradeCsv(bilateralCsv);
  assert.equal(partners.length, 27);
  const auditResult = auditBilateralTradeNetworkNodes(partners);
  assert.equal(auditResult.valid, true, `Bilateral trade network audit errors: ${auditResult.errors.join('; ')}`);
  assert.equal(auditResult.verifiedCount, 24);
  assert.equal(auditResult.illustrativeCount, 3);
  assert.equal(auditResult.regionalBlocCount, 2);
  assert.equal(auditResult.sovereignCount, 25);

  const verifiedPartners = partners.filter((p) => p.dataStatus === 'verified_official');
  for (const p of verifiedPartners) {
    const idCheck = validateBilateralTradeIdentity(
      p.exportsUsdBn!,
      p.importsUsdBn!,
      p.totalTradeUsdBn!,
      p.tradeBalanceUsdBn!
    );
    assert.equal(idCheck.valid, true, `Bilateral identity failed for ${p.name}`);
    assert.equal(
      Number(((p.totalTradeUsdBn! / INDIA_FY24_TOTAL_TRADE_USD_BN) * 100).toFixed(2)),
      p.shareOfIndiaTradePct,
      `Trade share for ${p.name} must use consistent FY24 total merchandise trade denominator`
    );
  }
});

test('2. Cross-layer consistency between CSV datasets, mockEconomicData.ts, indicatorRegistry.ts, and Single Source of Truth', () => {
  const syncIndicators = getIndicatorsSync();
  const registry = getStructuredIndicatorRegistrySync();
  const directRegistry = getIndicatorSourceRegistry();
  assert.equal(registry.length, directRegistry.length);

  const gdpSync = syncIndicators.find((i) => i.id === 'gdp-growth')!;
  const cpiSync = syncIndicators.find((i) => i.id === 'cpi-inflation')!;
  const plfsSync = syncIndicators.find((i) => i.id === 'unemployment-rate')!;
  const fxSync = syncIndicators.find((i) => i.id === 'usd-inr')!;
  const crudeSync = syncIndicators.find((i) => i.id === 'crude-oil')!;
  const tradeSync = syncIndicators.find((i) => i.id === 'merchandise-trade')!;
  const repoSync = syncIndicators.find((i) => i.id === 'rbi-repo-rate')!;

  assert.equal(gdpSync.currentValue, 7.8);
  assert.equal(
    gdpSync.observations[gdpSync.observations.length - 1].realGdpConstantLakhCr,
    81.36,
    'mockEconomicData latest Q1 FY27 Real GDP constant level must equal 81.36 Lakh Crore'
  );
  assert.equal(cpiSync.currentValue, 5.54, 'mockEconomicData CPI must match mospi_cpi_official.csv (5.54%)');
  assert.equal(plfsSync.currentValue, 5.0);
  assert.equal(fxSync.currentValue, 94.6986);
  assert.equal(crudeSync.currentValue, 116.09);
  assert.equal(crudeSync.observations.length, 33, 'mockEconomicData crude series must have all 33 completed months');
  assert.equal(tradeSync.currentValue, -30.21);
  const latestTradeObs = tradeSync.observations[tradeSync.observations.length - 1];
  assert.equal(latestTradeObs.secondaryValue, 44.4);
  assert.equal(latestTradeObs.tertiaryValue, 74.61);
  assert.ok(tradeSync.economicInterpretation.includes('$259.89B'));
  assert.ok(tradeSync.economicInterpretation.includes('$437.53B'));
  assert.ok(tradeSync.economicInterpretation.includes('$177.64B'));
  assert.equal(repoSync.currentValue, 5.5);

  const gdpReg = getIndicatorSourceEntryById('gdp-growth')!;
  assert.ok(gdpReg.methodologicalNotes.includes('81.36'));

  const cpiReg = getIndicatorSourceEntryById('cpi-inflation')!;
  assert.ok(cpiReg.unit.includes('5.54%'));
  assert.ok(cpiReg.referencePeriod.includes('September 2026'));
  assert.ok(cpiReg.methodologicalNotes.includes('derived analytical series'));

  const tradeReg = getIndicatorSourceEntryById('merchandise-trade')!;
  assert.ok(tradeReg.unit.includes('-$30.21B'));
  assert.ok(tradeReg.methodologicalNotes.includes('$259.89B'));
  assert.ok(tradeReg.methodologicalNotes.includes('$437.53B'));
  assert.ok(tradeReg.methodologicalNotes.includes('$177.64B'));

  // Verify explicit provenance classifications exist for all 10 indicators
  assert.equal(Object.keys(INDICATOR_PROVENANCE_CLASSIFICATIONS).length, 10);
  assert.equal(
    getIndicatorProvenanceClassification('gdp-growth')?.classification,
    'official_source_independently_verified'
  );
  assert.equal(
    getIndicatorProvenanceClassification('live-indian-market-indices')?.classification,
    'secondary_aggregator_feed'
  );
});

test('3. Navigation routes, deep-linking, hash aliases (#audit, #methodology, #trade), and Registry completeness', () => {
  assert.equal(VALID_PAGE_IDS.length, 10, 'All 10 primary routes must be registered');
  assert.equal(ARTHNITI_NAV_ITEMS.length, 10, 'Sidebar must expose all 10 routes');

  assert.deepEqual(resolvePageFromLocation('#gdp-growth', ''), {
    pageId: 'gdp-growth',
    indicatorId: null,
  });
  assert.deepEqual(
    resolvePageFromLocation('#currency-oil?indicator=merchandise-trade', ''),
    {
      pageId: 'currency-oil',
      indicatorId: 'merchandise-trade',
    }
  );
  // Verify Phase 11 required hash aliases (#audit, #methodology, #trade)
  assert.deepEqual(resolvePageFromLocation('#audit', ''), {
    pageId: 'data-sources',
    indicatorId: null,
  });
  assert.deepEqual(resolvePageFromLocation('#methodology', ''), {
    pageId: 'data-sources',
    indicatorId: null,
  });
  assert.deepEqual(resolvePageFromLocation('#trade', ''), {
    pageId: 'currency-oil',
    indicatorId: 'merchandise-trade',
  });
  assert.deepEqual(resolvePageFromLocation('', '?page=economic-news'), {
    pageId: 'economic-news',
    indicatorId: null,
  });
  assert.deepEqual(resolvePageFromLocation('#invalid-unknown-route', ''), {
    pageId: 'overview',
    indicatorId: null,
  });

  const registry = getStructuredIndicatorRegistrySync();
  assert.equal(registry.length, 10);
  for (const item of registry) {
    assert.ok(item.indicatorId.length > 0);
    assert.ok(item.displayName.length > 0);
    assert.ok(item.provider.length > 0);
    assert.ok(item.sourceUrl.startsWith('https://'), `Source URL for ${item.indicatorId} must be HTTPS`);
    assert.ok(item.unit.length > 0);
    assert.ok(item.referencePeriod.length > 0);
    assert.ok(item.methodologicalNotes.length > 20);
  }

  const sources = getDataSourcesSync();
  assert.ok(sources.length >= 7);
  for (const src of sources) {
    assert.ok(src.officialUrl.startsWith('https://'));
  }
});

test('4. Malformed CSV upload rejection and partial row resilience across all 7 macro parsers', () => {
  // Empty CSVs must throw descriptive validation errors
  assert.throws(() => parseMospiGdpCsv('', 'user_uploaded_csv'), /header row/);
  assert.throws(() => parseMospiCpiCsv('only_one_line', 'user_uploaded_csv'), /header row/);
  assert.throws(() => parseRbiRepoCsv('', 'user_uploaded_csv'), /header row/);
  assert.throws(() => parseMospiPlfsCsv('', 'user_uploaded_csv'), /header row/);
  assert.throws(() => parseOfficialUsdInrCsv('', 'user_uploaded_csv', 'now'), /header row/);
  assert.throws(() => parseOfficialPpacCrudeCsv('', 'user_uploaded_csv', 'now'), /header row/);
  assert.throws(() => parseOfficialMerchandiseTradeCsv('', 'user_uploaded_csv'), /header row/);

  // Wrong column headers must throw descriptive validation errors
  const wrongHeaders = 'col_a,col_b,col_c\n1,2,3\n4,5,6';
  assert.throws(() => parseMospiGdpCsv(wrongHeaders, 'user_uploaded_csv'), /Missing required columns/);
  assert.throws(() => parseMospiCpiCsv(wrongHeaders, 'user_uploaded_csv'), /Missing required columns/);
  assert.throws(() => parseRbiRepoCsv(wrongHeaders, 'user_uploaded_csv'), /Missing required columns/);
  assert.throws(() => parseMospiPlfsCsv(wrongHeaders, 'user_uploaded_csv'), /Missing required columns/);
  assert.throws(() => parseOfficialUsdInrCsv(wrongHeaders, 'user_uploaded_csv', 'now'), /Missing required columns/);
  assert.throws(() => parseOfficialPpacCrudeCsv(wrongHeaders, 'user_uploaded_csv', 'now'), /Missing required columns/);
  assert.throws(() => parseOfficialMerchandiseTradeCsv(wrongHeaders, 'user_uploaded_csv'), /Required columns missing/);

  // Malformed numeric rows mixed with valid rows should skip corrupted rows without crashing
  const mixedTradeCsv = [
    'year_month,period_label,financial_year,merchandise_exports_usd_bn,merchandise_imports_usd_bn',
    '2026-08,Aug 2026,2026-27,43.81,70.67',
    '2026-BAD,Corrupt Row,2026-27,NOT_A_NUMBER,70.00',
    '2026-09,Sep 2026,2026-27,44.40,74.61',
  ].join('\n');
  const parsedTrade = parseOfficialMerchandiseTradeCsv(mixedTradeCsv, 'user_uploaded_csv');
  assert.equal(parsedTrade.observations.length, 2, 'Corrupted numeric row must be skipped cleanly');
  assert.equal(parsedTrade.currentValue, -30.21);
});

test('5. NaN/Infinity resilience and negative USD currency formatting (-$30.21B, never $-30.21B)', () => {
  assert.equal(formatSignedUsdBillion(-30.21), '-$30.21B');
  assert.equal(formatSignedUsdBillion(36.75), '+$36.75B');
  assert.equal(formatSignedUsdBillion(0), '$0.00B');
  assert.equal(formatSignedUsdBillion(NaN), '—');
  assert.equal(formatSignedUsdBillion(Infinity), '—');
  assert.equal(formatSignedUsdBillion(null), '—');
  assert.ok(!formatSignedUsdBillion(-30.21).includes('$-'), 'Must never format negative currency as $-30.21B');

  assert.deepEqual(filterObservationsByRange([], '5Y'), []);
  assert.deepEqual(filterObservationsByRange(null, '1Y'), []);
  assert.deepEqual(computeSeriesStats([]), {
    latest: 0,
    earliest: 0,
    min: 0,
    max: 0,
    mean: 0,
    netChange: 0,
    percentChange: 0,
  });

  const malformedObs: any[] = [
    { date: '2025-01', timestamp: NaN, label: 'Bad TS', value: 5.2, status: 'Final' },
    { date: '2025-02', timestamp: 1739577600000, label: 'Bad Val', value: NaN, status: 'Final' },
    { date: '2025-02B', timestamp: 1739577600000, label: 'Inf Val', value: Infinity, status: 'Final' },
    { date: '2025-03', timestamp: 1742000000000, label: 'Valid 1', value: 5.0, status: 'Final' },
    { date: '2025-04', timestamp: 1744600000000, label: 'Valid 2', value: 5.5, status: 'Final' },
  ];

  const cleaned = filterObservationsByRange(malformedObs, 'MAX');
  assert.equal(cleaned.length, 2, 'Should filter out NaN/Infinity timestamp and value entries');
  const stats = computeSeriesStats(malformedObs);
  assert.equal(stats.earliest, 5.0);
  assert.equal(stats.latest, 5.5);
  assert.equal(stats.mean, 5.25);
  assert.ok(Number.isFinite(stats.percentChange));

  const allIndicators = getIndicatorsSync();
  const alignment = alignIndicatorsForComparison(allIndicators[1], allIndicators[5], '5Y');
  assert.ok(alignment.points.length > 0);
  assert.ok(Number.isFinite(alignment.pearsonR));
});

test('6. Market session IST boundaries, retryable status classification, out-of-order response guard, and bounded exponential backoff', () => {
  // 1. Weekday 11:00 AM IST -> OPEN (2026-10-26 is Monday, 11:00 IST = 05:30 UTC)
  const mondayOpenUtc = Date.parse('2026-10-26T05:30:00Z');
  assert.equal(evaluateIndianMarketSession(mondayOpenUtc).status, 'OPEN');

  // 2. Weekday 09:05 AM IST -> PRE_OPEN (03:35 UTC)
  const mondayPreOpenUtc = Date.parse('2026-10-26T03:35:00Z');
  assert.equal(evaluateIndianMarketSession(mondayPreOpenUtc).status, 'PRE_OPEN');

  // 3. Weekday 17:00 PM IST -> CLOSED (11:30 UTC)
  const mondayClosedUtc = Date.parse('2026-10-26T11:30:00Z');
  assert.equal(evaluateIndianMarketSession(mondayClosedUtc).status, 'CLOSED');

  // 4. Weekend (Sunday 2026-10-25 06:00 UTC) -> CLOSED (Weekend)
  const sundayUtc = Date.parse('2026-10-25T06:00:00Z');
  const weekendSession = evaluateIndianMarketSession(sundayUtc);
  assert.equal(weekendSession.status, 'CLOSED');
  assert.ok(weekendSession.label.includes('Weekend'));

  // 5. Official NSE/BSE Exchange Holiday (Friday 2026-10-02 Gandhi Jayanti 11:00 IST = 05:30 UTC) -> CLOSED (Exchange Holiday)
  const holidayUtc = Date.parse('2026-10-02T05:30:00Z');
  const holidaySession = evaluateIndianMarketSession(holidayUtc);
  assert.equal(holidaySession.status, 'CLOSED');
  assert.ok(holidaySession.label.includes('Holiday'));

  // 6. Formatting helpers handle null/NaN safely
  assert.equal(formatIndianIndexNumber(null), '—');
  assert.equal(formatIndianIndexNumber(NaN), '—');
  assert.equal(formatPointChange(125.4), '+125.40');
  assert.equal(formatPointChange(-42.1), '-42.10');
  assert.equal(formatPercentChange(1.234), '+1.23%');

  // 7. Retryable vs non-retryable HTTP statuses (permanent 400/404/405 must NOT retry)
  assert.equal(isRetryableHttpStatus(400), false);
  assert.equal(isRetryableHttpStatus(404), false);
  assert.equal(isRetryableHttpStatus(405), false);
  assert.equal(isRetryableHttpStatus(429), true);
  assert.equal(isRetryableHttpStatus(502), true);
  assert.equal(isRetryableHttpStatus(503), true);

  // 8. Bounded exponential backoff with jitter stays within [base, maxDelayMs]
  for (let attempt = 0; attempt < 6; attempt++) {
    const delay = computeBackoffDelayMs(attempt, 200, 2000);
    assert.ok(delay >= 200 && delay <= 2000, `Backoff delay ${delay}ms must be bounded within [200, 2000]`);
  }

  // 9. Out-of-order response guard prevents stale request #1 from overwriting newer request #2
  const guard = createOutOfOrderResponseGuard();
  const req1 = guard.nextRequestId();
  const req2 = guard.nextRequestId();
  assert.equal(req1, 1);
  assert.equal(req2, 2);
  // Newer request #2 finishes first
  assert.equal(guard.shouldApplyResponse(req2), true);
  assert.equal(guard.getLatestCompletedId(), 2);
  // Older request #1 arrives late — must be rejected
  assert.equal(guard.shouldApplyResponse(req1), false);
  assert.equal(guard.getLatestCompletedId(), 2);
});

test('7. External URL sanitization, clickbait filtering, headline deduplication, and malformed RSS/XML resilience', () => {
  const fallback = 'https://www.rbi.org.in/';
  assert.equal(
    sanitizeExternalHttpUrl('javascript:alert(document.cookie)', fallback),
    fallback,
    'Must block javascript: XSS URLs'
  );
  assert.equal(
    sanitizeExternalHttpUrl('data:text/html,<script>alert(1)</script>', fallback),
    fallback,
    'Must block data: URI XSS'
  );
  assert.equal(
    sanitizeExternalHttpUrl('vbscript:msgbox(1)', fallback),
    fallback,
    'Must block vbscript: URLs'
  );
  assert.equal(
    sanitizeExternalHttpUrl('not-a-valid-url', fallback),
    fallback,
    'Must replace malformed URLs with official fallback'
  );
  assert.equal(
    sanitizeExternalHttpUrl('https://mospi.gov.in/latest-releases', fallback),
    'https://mospi.gov.in/latest-releases'
  );

  // Clickbait exclusion vs economic relevance
  assert.equal(
    isEconomicallyRelevant(
      'Bollywood actor box office collection crosses 200 crore in IPL week',
      'Entertainment movie review',
      'economic_press'
    ),
    false,
    'Must reject celebrity/sports/entertainment clickbait'
  );
  assert.equal(
    isEconomicallyRelevant(
      'RBI MPC raises policy repo rate by 25 bps to 5.50% to anchor CPI inflation',
      'Monetary policy update',
      'economic_press'
    ),
    true,
    'Must accept genuine macroeconomic news'
  );

  // Headline deduplication
  assert.equal(
    areHeadlinesDuplicate(
      'India merchandise trade deficit narrows to $30.21 billion in September 2026',
      'India merchandise trade deficit narrows to $30.21 billion in September 2026: Commerce Ministry'
    ),
    true,
    'Must detect duplicate syndicated headlines'
  );

  // Malformed RSS/XML parsing resilience
  const sampleFeedCfg: any = {
    id: 'test-rbi-feed',
    name: 'Reserve Bank of India (Test)',
    shortName: 'RBI',
    type: 'official_india',
    officialUrl: 'https://www.rbi.org.in/',
    feedUrl: 'https://www.rbi.org.in/rss.xml',
    format: 'rss',
    defaultCategory: 'india',
    defaultSubTopic: 'india-rbi-monetary',
    isPolicyFeed: true,
    maxItems: 5,
  };

  assert.deepEqual(
    parseRssFeedXmlItems('<rss><channel><unclosed_tag', sampleFeedCfg),
    [],
    'Truncated XML without valid <item> blocks must return empty array without throwing'
  );

  const mixedXml = `
    <rss version="2.0">
      <channel>
        <item>
          <title></title>
          <link>https://www.rbi.org.in/empty-title</link>
        </item>
        <item>
          <title><![CDATA[RBI Monetary Policy Committee retains SDF at 5.25% and Repo Rate at 5.50%]]></title>
          <link>javascript:alert('xss')</link>
          <pubDate>Mon, 26 Oct 2026 10:00:00 GMT</pubDate>
          <description><![CDATA[<p>Official monetary policy press release from Reserve Bank of India.</p>]]></description>
        </item>
      </channel>
    </rss>
  `;
  const parsedItems = parseRssFeedXmlItems(mixedXml, sampleFeedCfg);
  assert.equal(parsedItems.length, 1, 'Must skip empty-title item and parse valid economic item');
  assert.equal(
    parsedItems[0].originalUrl,
    'https://www.rbi.org.in/',
    'Must sanitize javascript: link in RSS item to officialUrl'
  );
  assert.equal(parsedItems[0].provenanceType, 'LIVE_FEED_ITEM');
  assert.ok(!parsedItems[0].conciseSummary.includes('<p>'), 'Must strip HTML tags from RSS summary');

  // Verify RBI timezone-less <pubDate> normalization (prevents +5:30 future timestamp bug)
  const fetchNowMs = Date.parse('2026-10-27T16:54:00Z'); // 22:24 IST
  const rbiNorm = normalizeNewsPublicationTimestamp(
    'Tue, 27 Oct 2026 18:15:00',
    true,
    fetchNowMs
  );
  assert.equal(rbiNorm.timestampStatus, 'ASSUMED_IST_OFFSET');
  assert.equal(rbiNorm.shouldReject, false);
  // 18:15 IST = 12:45 UTC (well before 16:54 UTC fetch time)
  assert.equal(rbiNorm.validDate.toISOString(), '2026-10-27T12:45:00.000Z');
  assert.ok(rbiNorm.validDate.getTime() < fetchNowMs, 'Normalized RBI pubDate must be earlier than fetchNowMs');

  // Verify minor future clock skew (+15m ahead of fetch time) is clamped to fetchNowMs
  const minorFutureNorm = normalizeNewsPublicationTimestamp(
    'Tue, 27 Oct 2026 17:10:00 GMT',
    false,
    fetchNowMs
  );
  assert.equal(minorFutureNorm.timestampStatus, 'FUTURE_TIMESTAMP_CLAMPED');
  assert.equal(minorFutureNorm.shouldReject, false);
  assert.equal(minorFutureNorm.validDate.getTime(), fetchNowMs);

  // Verify implausible future timestamp (>24h ahead of fetch time) is rejected
  const farFutureNorm = normalizeNewsPublicationTimestamp(
    'Sat, 31 Oct 2026 18:00:00 GMT',
    false,
    fetchNowMs
  );
  assert.equal(farFutureNorm.shouldReject, true);
});

test('8. Serverless API handlers, security headers, secret non-leakage, deterministic stale-cache fallback, deduplication, cooldowns, and vercel.json config', async () => {
  // 1. Health endpoint security headers, CSP, HSTS, Permissions-Policy, origin-validated CORS & non-exposure of secrets
  const healthMock = createMockReqRes('GET');
  await healthHandler(healthMock.req, healthMock.res);
  assert.equal(healthMock.getStatusCode(), 200);
  assert.equal(healthMock.getHeaders()['x-content-type-options'], 'nosniff');
  assert.equal(healthMock.getHeaders()['x-frame-options'], 'SAMEORIGIN');
  assert.equal(healthMock.getHeaders()['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.ok(healthMock.getHeaders()['permissions-policy'].includes('camera=()'));
  assert.ok(healthMock.getHeaders()['strict-transport-security'].includes('max-age=63072000'));
  assert.ok(healthMock.getHeaders()['content-security-policy'].includes("default-src 'self'"));
  assert.equal(
    healthMock.getHeaders()['access-control-allow-origin'],
    'https://arthniti-six.vercel.app',
    'Default CORS origin must be restricted to https://arthniti-six.vercel.app instead of wildcard *'
  );
  const healthPayload = getHealthCheckPayload();
  assert.equal(healthPayload.ok, true);
  assert.equal(healthPayload.status, 'healthy');
  const serializedHealth = JSON.stringify(healthPayload);
  assert.ok(!serializedHealth.includes('GEMINI_API_KEY'), 'Health check must never expose secret env keys');

  // 2. Method Not Allowed (POST/PUT/DELETE -> 405) on all API endpoints
  for (const fn of [healthHandler, marketIndicesHandler, economicNewsHandler]) {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const badMethodMock = createMockReqRes(method);
      await fn(badMethodMock.req, badMethodMock.res);
      assert.equal(badMethodMock.getStatusCode(), 405, `${method} requests must be rejected with HTTP 405`);
    }
  }

  // 3. Simulated error isolation on /api/economic-news?simulateError=1
  const simErrMock = createMockReqRes('GET', { simulateError: '1' });
  await economicNewsHandler(simErrMock.req, simErrMock.res);
  assert.equal(simErrMock.getStatusCode(), 503);
  assert.equal(simErrMock.getJson()?.ok, false);
  assert.ok(simErrMock.getJson()?.error.includes('Simulated News Aggregation Failure'));

  // 4. Deterministic mocked upstream tests for /api/market-indices:
  //    - Partial upstream failure (NIFTY IT returns HTTP 503)
  //    - Fallback symbol resolution (NIFTY_MIDCAP_100.NS fails -> ^CRSMID succeeds)
  //    - Concurrent request deduplication & 5-second force-refresh cooldown
  //    - Zero/invalid price rejection
  const originalFetch = globalThis.fetch;
  try {
    resetMarketIndicesCacheForTest();
    let upstreamCallCount = 0;

    globalThis.fetch = async (input: string | URL | Request) => {
      upstreamCallCount += 1;
      const urlStr = String(input);
      // Simulate partial outage: NIFTY IT (%5ECNXIT) returns HTTP 503 on both query1 and query2
      if (urlStr.includes('%5ECNXIT')) {
        return new Response('Upstream unavailable', { status: 503 });
      }
      // Simulate NIFTY_MIDCAP_100.NS failing so fallback ^CRSMID (%5ECRSMID) is tested
      if (urlStr.includes('NIFTY_MIDCAP_100.NS')) {
        return new Response('Primary symbol unavailable', { status: 404 });
      }
      const returnedSym = urlStr.includes('%5ECRSMID')
        ? '^CRSMID'
        : urlStr.includes('%5EBSESN')
        ? '^BSESN'
        : urlStr.includes('%5ENSEBANK')
        ? '^NSEBANK'
        : '^NSEI';
      return new Response(
        JSON.stringify({
          chart: {
            result: [
              {
                meta: {
                  symbol: returnedSym,
                  currency: 'INR',
                  exchangeTimezoneName: 'Asia/Kolkata',
                  regularMarketPrice: 24850.5,
                  chartPreviousClose: 24700.0,
                  regularMarketDayHigh: 24910.0,
                  regularMarketDayLow: 24680.0,
                  regularMarketTime: 1761472800,
                },
                timestamp: [1761469200, 1761472800],
                indicators: {
                  quote: [
                    {
                      open: [24720.0, 24800.0],
                      close: [24750.0, 24850.5],
                    },
                  ],
                },
              },
            ],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    };

    // Fire 2 concurrent requests to /api/market-indices
    const reqA = createMockReqRes('GET');
    const reqB = createMockReqRes('GET');
    await Promise.all([
      marketIndicesHandler(reqA.req, reqA.res),
      marketIndicesHandler(reqB.req, reqB.res),
    ]);

    assert.equal(reqA.getStatusCode(), 200);
    assert.equal(reqB.getStatusCode(), 200);
    // In-flight deduplication: 3 direct symbols (1 call each) + 1 failing symbol (^CNXIT: 2 calls) + 1 fallback symbol (NIFTY_MIDCAP_100.NS 2 calls + ^CRSMID 1 call) = 8 calls total instead of 16
    assert.equal(upstreamCallCount, 8, 'Concurrent market API requests must share a single in-flight fetch');

    const payloadA = reqA.getJson();
    assert.equal(payloadA.ok, true);
    assert.equal(payloadA.indices.length, 5);
    const niftyIt = payloadA.indices.find((i: any) => i.id === 'nifty-it');
    assert.equal(niftyIt.status, 'unavailable', 'Failed single index must be marked unavailable');
    assert.equal(niftyIt.freshnessStatus, 'UNAVAILABLE');
    assert.equal(niftyIt.currentValue, null, 'Failed single index must never have a fabricated price');
    const midcap100 = payloadA.indices.find((i: any) => i.id === 'nifty-midcap-100');
    assert.equal(midcap100.status, 'ok', 'NIFTY MIDCAP 100 must succeed via ^CRSMID fallback when primary fails');
    assert.equal(midcap100.returnedSymbol, '^CRSMID');
    const nifty50 = payloadA.indices.find((i: any) => i.id === 'nifty-50');
    assert.equal(nifty50.status, 'ok');
    assert.equal(nifty50.currentValue, 24850.5);
    assert.equal(nifty50.currency, 'INR');

    // Immediate force-refresh within 5-second cooldown must be served from cache without calling upstream again
    const reqCooldown = createMockReqRes('GET', { refresh: 'true' });
    await marketIndicesHandler(reqCooldown.req, reqCooldown.res);
    assert.equal(reqCooldown.getStatusCode(), 200);
    assert.equal(reqCooldown.getJson().cacheStatus, 'HIT');
    assert.equal(upstreamCallCount, 8, '5-second force-refresh cooldown must prevent upstream abuse');

    // Now test deterministic RSS fetch, partial feed failure, & cooldown on /api/economic-news
    resetEconomicNewsCacheForTest();
    globalThis.fetch = async (input: string | URL | Request) => {
      const urlStr = String(input);
      // Simulate 1 feed returning HTTP 429 rate-limit to verify partial feed failure resilience
      if (urlStr.includes('cnbc.com')) {
        return new Response('Rate Limited', { status: 429 });
      }
      const validRss = `
        <rss version="2.0">
          <channel>
            <item>
              <title>RBI Monetary Policy Report highlights resilient GDP growth and moderating CPI inflation</title>
              <link>https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=99999</link>
              <pubDate>Mon, 26 Oct 2026 09:30:00 GMT</pubDate>
              <description>Reserve Bank of India official macroeconomic assessment.</description>
            </item>
          </channel>
        </rss>
      `;
      return new Response(validRss, {
        status: 200,
        headers: { 'content-type': 'application/rss+xml' },
      });
    };

    const newsFirst = createMockReqRes('GET');
    await economicNewsHandler(newsFirst.req, newsFirst.res);
    assert.equal(newsFirst.getStatusCode(), 200);
    assert.equal(newsFirst.getJson().cacheStatus, 'MISS');
    assert.ok(newsFirst.getJson().articles.length >= 1);
    assert.ok(
      newsFirst.getJson().articles.every((a: any) => a.provenanceType === 'LIVE_FEED_ITEM'),
      'Default /api/economic-news articles must all be LIVE_FEED_ITEM'
    );
    const cnbcStatus = newsFirst
      .getJson()
      .sourcesStatus.find((s: any) => s.id === 'cnbc-economy');
    assert.equal(cnbcStatus.status, 'unavailable');
    assert.equal(cnbcStatus.note, 'HTTP 429');

    // Force-refresh within 5-second cooldown returns HIT
    const newsCooldown = createMockReqRes('GET', { refresh: 'true' });
    await economicNewsHandler(newsCooldown.req, newsCooldown.res);
    assert.equal(newsCooldown.getStatusCode(), 200);
    assert.equal(newsCooldown.getJson().cacheStatus, 'HIT');
  } finally {
    globalThis.fetch = originalFetch;
    resetMarketIndicesCacheForTest();
    resetEconomicNewsCacheForTest();
  }

  // 5. Verify vercel.json exists and configures rewrites and full security headers (CSP, HSTS, Permissions-Policy)
  const vercelJsonPath = path.resolve(process.cwd(), 'vercel.json');
  assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist in repository root');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  assert.equal(vercelConfig.buildCommand, 'npm run build');
  assert.equal(vercelConfig.outputDirectory, 'dist');
  assert.ok(Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.length >= 2);
  assert.ok(Array.isArray(vercelConfig.headers) && vercelConfig.headers.length >= 2);
  const rootHeaderKeys = vercelConfig.headers[0].headers.map((h: any) => h.key);
  assert.ok(rootHeaderKeys.includes('Content-Security-Policy'));
  assert.ok(rootHeaderKeys.includes('Strict-Transport-Security'));
  assert.ok(rootHeaderKeys.includes('Permissions-Policy'));
});

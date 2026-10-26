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
  formatIndianIndexNumber,
  formatPercentChange,
  formatPointChange,
  isRetryableHttpStatus,
} from '../src/services/indianMarketService.ts';
import {
  evaluateIndianMarketSession,
  default as marketIndicesHandler,
} from '../api/market-indices.ts';
import {
  areHeadlinesDuplicate,
  isEconomicallyRelevant,
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
  assert.equal(gdpInd.officialGdpMeta?.realGdpLevelLakhCr, 90.41);
  assert.equal(gdpInd.releaseDate, '31 Aug 2026');

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
  assert.equal(tradeInd.officialTradeMeta?.fyCumulativeExportsUsdBn, 261.62);
  assert.equal(tradeInd.officialTradeMeta?.fyCumulativeImportsUsdBn, 437.69);
  assert.equal(tradeInd.officialTradeMeta?.fyCumulativeDeficitUsdBn, 176.07);

  // Verify every single monthly observation & fiscal-year cumulative identity in tradeInd
  let currentFy = '';
  let runningExp = 0;
  let runningImp = 0;
  for (const obs of tradeInd.observations) {
    const exp = obs.merchandiseExportsUsdBn!;
    const imp = obs.merchandiseImportsUsdBn!;
    const bal = obs.tradeBalanceUsdBn!;
    assert.equal(
      Number((exp - imp).toFixed(2)),
      bal,
      `Row ${obs.date}: Trade Balance (${bal}) must equal Exports (${exp}) - Imports (${imp})`
    );
    if (obs.servicesSurplusEstUsdBn !== undefined && obs.overallTradeBalanceUsdBn !== undefined) {
      assert.equal(
        Number((bal + obs.servicesSurplusEstUsdBn).toFixed(2)),
        obs.overallTradeBalanceUsdBn,
        `Row ${obs.date}: Overall Trade Balance must equal Merchandise Balance + Services Surplus`
      );
    }
    if (obs.financialYear !== currentFy) {
      currentFy = obs.financialYear || '';
      runningExp = 0;
      runningImp = 0;
    }
    runningExp = Number((runningExp + exp).toFixed(2));
    runningImp = Number((runningImp + imp).toFixed(2));
    const runningDef = Number((runningImp - runningExp).toFixed(2));
    assert.equal(
      obs.fyCumulativeExportsUsdBn,
      runningExp,
      `Row ${obs.date}: Cumulative FY Exports must equal running sum`
    );
    assert.equal(
      obs.fyCumulativeImportsUsdBn,
      runningImp,
      `Row ${obs.date}: Cumulative FY Imports must equal running sum`
    );
    assert.equal(
      obs.fyCumulativeDeficitUsdBn,
      runningDef,
      `Row ${obs.date}: Cumulative FY Deficit must equal CumImports - CumExports`
    );
  }

  // 8. Official TRADESTAT Bilateral Partners Matrix
  const bilateralCsv = fs.readFileSync(
    path.join(PUBLIC_DATA_DIR, 'moci_tradestat_bilateral_partners.csv'),
    'utf-8'
  );
  const partners = parseBilateralTradeCsv(bilateralCsv);
  assert.equal(partners.length, 27);
  const verifiedPartners = partners.filter((p) => p.dataStatus === 'verified_official');
  assert.equal(verifiedPartners.length, 24);
  for (const p of verifiedPartners) {
    assert.equal(
      Number((p.exportsUsdBn! + p.importsUsdBn!).toFixed(2)),
      p.totalTradeUsdBn,
      `Total trade for ${p.name} must equal exports + imports`
    );
    assert.equal(
      Number((p.exportsUsdBn! - p.importsUsdBn!).toFixed(2)),
      p.tradeBalanceUsdBn,
      `Trade balance for ${p.name} must equal exports - imports`
    );
    assert.equal(
      Number(((p.totalTradeUsdBn! / INDIA_FY24_TOTAL_TRADE_USD_BN) * 100).toFixed(2)),
      p.shareOfIndiaTradePct,
      `Trade share for ${p.name} must use consistent FY24 total merchandise trade denominator`
    );
  }
});

test('2. Cross-layer consistency between CSV datasets, mockEconomicData.ts, and Structured Source Registry', () => {
  const syncIndicators = getIndicatorsSync();
  const registry = getStructuredIndicatorRegistrySync();

  const gdpSync = syncIndicators.find((i) => i.id === 'gdp-growth')!;
  const cpiSync = syncIndicators.find((i) => i.id === 'cpi-inflation')!;
  const plfsSync = syncIndicators.find((i) => i.id === 'unemployment-rate')!;
  const fxSync = syncIndicators.find((i) => i.id === 'usd-inr')!;
  const crudeSync = syncIndicators.find((i) => i.id === 'crude-oil')!;
  const tradeSync = syncIndicators.find((i) => i.id === 'merchandise-trade')!;
  const repoSync = syncIndicators.find((i) => i.id === 'rbi-repo-rate')!;

  assert.equal(gdpSync.currentValue, 7.8);
  assert.equal(cpiSync.currentValue, 5.54, 'mockEconomicData CPI must match mospi_cpi_official.csv (5.54%)');
  assert.equal(plfsSync.currentValue, 5.0);
  assert.equal(fxSync.currentValue, 94.6986);
  assert.equal(crudeSync.currentValue, 116.09);
  assert.equal(tradeSync.currentValue, -30.21);
  assert.equal(repoSync.currentValue, 5.5);

  const cpiReg = registry.find((r) => r.indicatorId === 'cpi-inflation')!;
  assert.ok(cpiReg.unit.includes('5.54%'));
  assert.ok(cpiReg.referencePeriod.includes('September 2026'));

  const tradeReg = registry.find((r) => r.indicatorId === 'merchandise-trade')!;
  assert.ok(tradeReg.unit.includes('-$30.21B'));
  assert.ok(tradeReg.methodologicalNotes.includes('$261.62B'));
});

test('3. Navigation routes, deep-linking, and Structured Indicator Source Registry completeness', () => {
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

test('6. Market session IST boundaries, retryable status classification, and bounded exponential backoff with jitter', () => {
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

  // 5. Formatting helpers handle null/NaN safely
  assert.equal(formatIndianIndexNumber(null), '—');
  assert.equal(formatIndianIndexNumber(NaN), '—');
  assert.equal(formatPointChange(125.4), '+125.40');
  assert.equal(formatPointChange(-42.1), '-42.10');
  assert.equal(formatPercentChange(1.234), '+1.23%');

  // 6. Retryable vs non-retryable HTTP statuses (permanent 400/404/405 must NOT retry)
  assert.equal(isRetryableHttpStatus(400), false);
  assert.equal(isRetryableHttpStatus(404), false);
  assert.equal(isRetryableHttpStatus(405), false);
  assert.equal(isRetryableHttpStatus(429), true);
  assert.equal(isRetryableHttpStatus(502), true);
  assert.equal(isRetryableHttpStatus(503), true);

  // 7. Bounded exponential backoff with jitter stays within [base, maxDelayMs]
  for (let attempt = 0; attempt < 6; attempt++) {
    const delay = computeBackoffDelayMs(attempt, 200, 2000);
    assert.ok(delay >= 200 && delay <= 2000, `Backoff delay ${delay}ms must be bounded within [200, 2000]`);
  }
});

test('7. External URL sanitization, clickbait filtering, and headline deduplication', () => {
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
});

test('8. Serverless API handlers, security headers, secret non-leakage, cooldowns, and vercel.json config', async () => {
  // 1. Health endpoint security headers & non-exposure of secrets
  const healthMock = createMockReqRes('GET');
  await healthHandler(healthMock.req, healthMock.res);
  assert.equal(healthMock.getStatusCode(), 200);
  assert.equal(healthMock.getHeaders()['x-content-type-options'], 'nosniff');
  assert.equal(healthMock.getHeaders()['x-frame-options'], 'SAMEORIGIN');
  assert.equal(healthMock.getHeaders()['referrer-policy'], 'strict-origin-when-cross-origin');
  const healthPayload = healthMock.getJson();
  assert.equal(healthPayload?.ok, true);
  assert.equal(healthPayload?.status, 'healthy');
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

  // 4. Verify vercel.json exists and configures rewrites and security headers
  const vercelJsonPath = path.resolve(process.cwd(), 'vercel.json');
  assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist in repository root');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
  assert.equal(vercelConfig.buildCommand, 'npm run build');
  assert.equal(vercelConfig.outputDirectory, 'dist');
  assert.ok(Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.length >= 2);
  assert.ok(Array.isArray(vercelConfig.headers) && vercelConfig.headers.length >= 1);
});

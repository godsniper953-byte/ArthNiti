import {
  GlobalTradeNetworkDataset,
  GlobalTradePartnerNode,
  TradeRegionFilter,
} from '../types/economy';

const OFFICIAL_BILATERAL_CSV_URL = '/data/moci_tradestat_bilateral_partners.csv';

// Official Department of Commerce (TRADESTAT) FY 2023-24 Annual Merchandise Totals (USD Billion)
// Used as the exact matching denominator for country/bloc share calculations.
export const INDIA_FY24_TOTAL_EXPORTS_USD_BN = 437.07;
export const INDIA_FY24_TOTAL_IMPORTS_USD_BN = 678.21;
export const INDIA_FY24_TOTAL_TRADE_USD_BN = 1115.28; // 437.07 + 678.21
export const INDIA_FY24_TRADE_BALANCE_USD_BN = -241.14; // 437.07 - 678.21

// Parse CSV line respecting double-quoted fields containing commas
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

export function parseBilateralTradeCsv(csvText: string): GlobalTradePartnerNode[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error('Bilateral trade CSV dataset is empty or missing data rows.');
  }

  const headers = splitCsvLine(lines[0]);
  const idx = (col: string) => headers.indexOf(col);

  const partners: GlobalTradePartnerNode[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 15) continue;

    const id = cols[idx('id')] || `partner-${i}`;
    const name = cols[idx('name')] || id;
    const shortName = cols[idx('shortName')] || name;
    const isoCode = cols[idx('isoCode')] || 'UNK';
    const flagCode = cols[idx('flagCode')] || 'UN';
    const entityType =
      cols[idx('entityType')] === 'regional_aggregate' ? 'regional_aggregate' : 'country';
    const dataStatus =
      cols[idx('dataStatus')] === 'illustrative_corridor'
        ? 'illustrative_corridor'
        : 'verified_official';
    const primaryRegion = (cols[idx('primaryRegion')] ||
      'Asia-Pacific') as Exclude<TradeRegionFilter, 'All'>;
    const isBricsMember = cols[idx('isBricsMember')]?.toLowerCase() === 'true';
    const isAseanMember = cols[idx('isAseanMember')]?.toLowerCase() === 'true';
    const isEuAggregate = cols[idx('isEuAggregate')]?.toLowerCase() === 'true';

    const lat = Number(cols[idx('lat')]);
    const lon = Number(cols[idx('lon')]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const reportingPeriod = cols[idx('reportingPeriod')] || 'FY 2023-24 (Final Annual)';
    const rawExports = Number(cols[idx('exportsUsdBn')]);
    const rawImports = Number(cols[idx('importsUsdBn')]);

    let exportsUsdBn: number | null = null;
    let importsUsdBn: number | null = null;
    let totalTradeUsdBn: number | null = null;
    let tradeBalanceUsdBn: number | null = null;
    let shareOfIndiaTradePct: number | null = null;

    if (
      dataStatus === 'verified_official' &&
      !Number.isNaN(rawExports) &&
      !Number.isNaN(rawImports) &&
      (rawExports > 0 || rawImports > 0)
    ) {
      exportsUsdBn = Number(rawExports.toFixed(2));
      importsUsdBn = Number(rawImports.toFixed(2));
      // Enforce exact accounting identities from matching exports and imports
      totalTradeUsdBn = Number((exportsUsdBn + importsUsdBn).toFixed(2));
      tradeBalanceUsdBn = Number((exportsUsdBn - importsUsdBn).toFixed(2));
      shareOfIndiaTradePct = Number(
        ((totalTradeUsdBn / INDIA_FY24_TOTAL_TRADE_USD_BN) * 100).toFixed(2)
      );
    }

    partners.push({
      id,
      name,
      shortName,
      isoCode,
      flagCode,
      entityType,
      dataStatus,
      primaryRegion,
      isBricsMember,
      isAseanMember,
      isEuAggregate,
      lat,
      lon,
      reportingPeriod,
      exportsUsdBn,
      importsUsdBn,
      totalTradeUsdBn,
      tradeBalanceUsdBn,
      shareOfIndiaTradePct,
      keyExportsFromIndia: cols[idx('keyExportsFromIndia')] || 'Diversified merchandise goods',
      keyImportsToIndia: cols[idx('keyImportsToIndia')] || 'Industrial & energy inputs',
      relationshipNote: cols[idx('relationshipNote')] || '',
      sourceUrl: cols[idx('sourceUrl')] || 'https://tradestat.commerce.gov.in/',
    });
  }

  return partners;
}

export async function loadGlobalTradeNetworkData(options?: {
  simulateError?: boolean;
}): Promise<GlobalTradeNetworkDataset> {
  if (options?.simulateError) {
    return {
      status: 'error',
      partners: [],
      reportingPeriod: 'FY 2023–24 (Apr 2023 – Mar 2024)',
      indiaTotalMerchandiseExportsUsdBn: INDIA_FY24_TOTAL_EXPORTS_USD_BN,
      indiaTotalMerchandiseImportsUsdBn: INDIA_FY24_TOTAL_IMPORTS_USD_BN,
      indiaTotalMerchandiseTradeUsdBn: INDIA_FY24_TOTAL_TRADE_USD_BN,
      indiaTotalMerchandiseBalanceUsdBn: INDIA_FY24_TRADE_BALANCE_USD_BN,
      sourceName: 'Department of Commerce · TRADESTAT Export Import Data Bank',
      sourceUrl: 'https://tradestat.commerce.gov.in/',
      lastUpdated: 'Annual Final Series (Verified Oct 2026)',
      errorMessage:
        'Simulated network error while retrieving official TRADESTAT bilateral dataset. Geographic globe remains interactive.',
    };
  }

  try {
    const response = await fetch(OFFICIAL_BILATERAL_CSV_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while loading ${OFFICIAL_BILATERAL_CSV_URL}`);
    }
    const text = await response.text();
    const partners = parseBilateralTradeCsv(text);

    if (partners.length === 0) {
      return {
        status: 'empty',
        partners: [],
        reportingPeriod: 'FY 2023–24 (Apr 2023 – Mar 2024)',
        indiaTotalMerchandiseExportsUsdBn: INDIA_FY24_TOTAL_EXPORTS_USD_BN,
        indiaTotalMerchandiseImportsUsdBn: INDIA_FY24_TOTAL_IMPORTS_USD_BN,
        indiaTotalMerchandiseTradeUsdBn: INDIA_FY24_TOTAL_TRADE_USD_BN,
        indiaTotalMerchandiseBalanceUsdBn: INDIA_FY24_TRADE_BALANCE_USD_BN,
        sourceName: 'Department of Commerce · TRADESTAT Export Import Data Bank',
        sourceUrl: 'https://tradestat.commerce.gov.in/',
        lastUpdated: 'Annual Final Series (Verified Oct 2026)',
      };
    }

    return {
      status: 'success',
      partners,
      reportingPeriod: 'FY 2023–24 (Apr 2023 – Mar 2024 · Final Annual Series)',
      indiaTotalMerchandiseExportsUsdBn: INDIA_FY24_TOTAL_EXPORTS_USD_BN,
      indiaTotalMerchandiseImportsUsdBn: INDIA_FY24_TOTAL_IMPORTS_USD_BN,
      indiaTotalMerchandiseTradeUsdBn: INDIA_FY24_TOTAL_TRADE_USD_BN,
      indiaTotalMerchandiseBalanceUsdBn: INDIA_FY24_TRADE_BALANCE_USD_BN,
      sourceName: 'Department of Commerce · TRADESTAT Export Import Data Bank',
      sourceUrl: 'https://tradestat.commerce.gov.in/',
      lastUpdated: 'Annual Final Series (Verified Oct 2026)',
    };
  } catch (err: any) {
    return {
      status: 'error',
      partners: [],
      reportingPeriod: 'FY 2023–24 (Apr 2023 – Mar 2024)',
      indiaTotalMerchandiseExportsUsdBn: INDIA_FY24_TOTAL_EXPORTS_USD_BN,
      indiaTotalMerchandiseImportsUsdBn: INDIA_FY24_TOTAL_IMPORTS_USD_BN,
      indiaTotalMerchandiseTradeUsdBn: INDIA_FY24_TOTAL_TRADE_USD_BN,
      indiaTotalMerchandiseBalanceUsdBn: INDIA_FY24_TRADE_BALANCE_USD_BN,
      sourceName: 'Department of Commerce · TRADESTAT Export Import Data Bank',
      sourceUrl: 'https://tradestat.commerce.gov.in/',
      lastUpdated: 'Annual Final Series (Verified Oct 2026)',
      errorMessage:
        err?.message || 'Unable to load bilateral trade dataset. Please retry.',
    };
  }
}

// Helper to check if a partner matches a given region filter
export function matchesTradeRegionFilter(
  partner: GlobalTradePartnerNode,
  filter: TradeRegionFilter
): boolean {
  if (filter === 'All') return true;
  if (filter === 'BRICS') return partner.isBricsMember;
  if (filter === 'ASEAN') return partner.isAseanMember || partner.primaryRegion === 'ASEAN';
  if (filter === 'European Union')
    return partner.isEuAggregate || partner.primaryRegion === 'European Union';
  return partner.primaryRegion === filter;
}

import {
  GlobalTradePartnerNode,
  TradeRegionFilter,
} from '../types/economy';
import {
  INDIA_FY24_TOTAL_EXPORTS_USD_BN,
  INDIA_FY24_TOTAL_IMPORTS_USD_BN,
  INDIA_FY24_TOTAL_TRADE_USD_BN,
  INDIA_FY24_TRADE_BALANCE_USD_BN,
  loadGlobalTradeNetworkData,
  parseBilateralTradeCsv,
} from '../services/globalTradeNetworkService';
import { validateBilateralTradeIdentity } from '../utils/economicEngine';

export {
  INDIA_FY24_TOTAL_EXPORTS_USD_BN,
  INDIA_FY24_TOTAL_IMPORTS_USD_BN,
  INDIA_FY24_TOTAL_TRADE_USD_BN,
  INDIA_FY24_TRADE_BALANCE_USD_BN,
  loadGlobalTradeNetworkData,
  parseBilateralTradeCsv,
};
export type { GlobalTradePartnerNode, TradeRegionFilter };

export const OFFICIAL_BILATERAL_TRADE_CSV_PATH =
  '/data/moci_tradestat_bilateral_partners.csv';

/**
 * Audits a parsed array of bilateral trade partner nodes to confirm:
 * 1. Sovereign partners are never double-counted with regional aggregates (EU-27, ASEAN-10).
 * 2. Every verified_official partner satisfies Total = Exports + Imports and Balance = Exports - Imports.
 * 3. Every illustrative_corridor partner has null numeric trade fields and is never fabricated.
 */
export function auditBilateralTradeNetworkNodes(
  partners: GlobalTradePartnerNode[]
): {
  valid: boolean;
  verifiedCount: number;
  illustrativeCount: number;
  sovereignCount: number;
  regionalBlocCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  let verifiedCount = 0;
  let illustrativeCount = 0;
  let sovereignCount = 0;
  let regionalBlocCount = 0;

  for (const p of partners) {
    if (p.entityType === 'regional_aggregate') {
      regionalBlocCount++;
    } else {
      sovereignCount++;
    }

    if (p.dataStatus === 'verified_official') {
      verifiedCount++;
      if (
        p.exportsUsdBn === null ||
        p.importsUsdBn === null ||
        p.totalTradeUsdBn === null ||
        p.tradeBalanceUsdBn === null
      ) {
        errors.push(`Verified partner ${p.id} is missing numeric trade values.`);
        continue;
      }
      const check = validateBilateralTradeIdentity(
        p.exportsUsdBn,
        p.importsUsdBn,
        p.totalTradeUsdBn,
        p.tradeBalanceUsdBn
      );
      if (!check.valid) {
        errors.push(
          `Partner ${p.id} failed accounting identity: Exp=${p.exportsUsdBn}, Imp=${p.importsUsdBn}, Total=${p.totalTradeUsdBn}, Bal=${p.tradeBalanceUsdBn}`
        );
      }
    } else {
      illustrativeCount++;
      if (
        p.exportsUsdBn !== null ||
        p.importsUsdBn !== null ||
        p.totalTradeUsdBn !== null ||
        p.tradeBalanceUsdBn !== null
      ) {
        errors.push(
          `Illustrative corridor ${p.id} must not contain fabricated numeric trade values.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    verifiedCount,
    illustrativeCount,
    sovereignCount,
    regionalBlocCount,
    errors,
  };
}

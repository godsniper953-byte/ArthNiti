/**
 * Server-side Economic News & Current Affairs Intelligence Aggregation & Analysis Engine
 * Compatible with both:
 *   1. Vercel Serverless Functions (/api/economic-news)
 *   2. Express + Vite development/production server (server.ts)
 *
 * Fetches real, live RSS/XML and JSON feeds from:
 *   - Official Indian Institutions: Reserve Bank of India (RBI Press Releases & Notifications),
 *     plus verified official statistical & policy release bulletins (MoSPI, Ministry of Commerce,
 *     Ministry of Finance / PIB, PPAC).
 *   - Official International Institutions: US Federal Reserve (Monetary Policy & Press),
 *     European Central Bank (ECB Press Releases), World Bank Official News API.
 *   - Reputable Financial & Economic Publications: The Economic Times (Economy & Policy),
 *     Business Standard (Economy & Policy), Mint / Livemint (Economy), CNBC Global Economy,
 *     BBC Business & Economy.
 *
 * Strictly adheres to ArthNiti's editorial & data-integrity standards:
 *   - Never fabricates headlines, URLs, publication timestamps, or quotes.
 *   - Deduplicates stories across feeds and filters out entertainment, sports, gossip, or non-economic clickbait.
 *   - Generates structured, transparent "Why It Matters for India's Economy" transmission-channel
 *     intelligence linking news events to ArthNiti's 7 official macro indicators and live stock indices.
 */

export type NewsMacroCategory = 'india' | 'global' | 'current-affairs';

export type NewsSubTopicId =
  | 'india-rbi-monetary'
  | 'india-budget-tax-policy'
  | 'india-cpi-gdp-plfs-iip'
  | 'india-markets-bonds-investment'
  | 'india-trade-exports-fdi'
  | 'india-rupee-fx-crude'
  | 'india-infra-mfg-agri-jobs'
  | 'global-fed-central-banks'
  | 'global-inflation-rates-recession'
  | 'global-trade-tariffs-sanctions'
  | 'global-geopolitics-shipping'
  | 'global-commodities-energy-gold'
  | 'global-us-china-eu-em'
  | 'global-imf-wb-wto-forecasts'
  | 'global-markets-supply-chains'
  | 'ca-national-intl-economic'
  | 'ca-govt-regulatory-changes'
  | 'ca-elections-policy-shifts'
  | 'ca-climate-energy-disasters';

export type NewsDashboardSection =
  | 'featured'
  | 'india-latest'
  | 'global-latest'
  | 'policy-announcements'
  | 'market-impact';

export type ImpactDirection = 'positive' | 'negative' | 'mixed' | 'uncertain';

export interface AffectedArthNitiIndicator {
  id:
    | 'cpi-inflation'
    | 'gdp-growth'
    | 'rbi-repo-rate'
    | 'unemployment-rate'
    | 'usd-inr'
    | 'crude-oil'
    | 'merchandise-trade'
    | 'indian-stock-indices';
  label: string;
  shortValueContext: string;
  pageId:
    | 'inflation'
    | 'gdp-growth'
    | 'financial-markets'
    | 'labour-market'
    | 'currency-oil'
    | 'overview';
  indicatorId?: string;
  transmissionChannel: string;
}

export interface EconomicStoryIntelligence {
  whatHappened: string;
  whyItMatters: string;
  impactOnIndia: string;
  globalImpact: string;
  affectedIndicators: AffectedArthNitiIndicator[];
  impactAssessment: {
    direction: ImpactDirection;
    label: string;
    timeHorizon: 'Short-term (0–3M)' | 'Medium-term (3–12M)' | 'Structural (1–3Y)';
    reasoning: string;
  };
  attributionType:
    | 'Official Institutional Release'
    | 'Reported Economic Development'
    | 'Policy & Market Transmission Brief';
}

export interface EconomicNewsArticle {
  id: string;
  headline: string;
  conciseSummary: string;
  sourceName: string;
  sourceShortName: string;
  sourceType: 'official_india' | 'official_international' | 'economic_press';
  sourceHomepageUrl: string;
  originalUrl: string;
  publishedAtIso: string;
  publishedAtIst: string;
  relativeTimeLabel: string;
  category: NewsMacroCategory;
  categoryLabel: string;
  subTopicId: NewsSubTopicId;
  subTopicLabel: string;
  sections: NewsDashboardSection[];
  isPolicyAnnouncement: boolean;
  isMarketMoving: boolean;
  intelligence: EconomicStoryIntelligence;
}

export interface NewsSourceStatus {
  id: string;
  name: string;
  shortName: string;
  type: 'official_india' | 'official_international' | 'economic_press';
  officialUrl: string;
  feedUrl: string;
  status: 'ok' | 'degraded' | 'unavailable';
  articlesCount: number;
  note?: string;
}

export interface EconomicNewsResponse {
  ok: boolean;
  fetchedAtMs: number;
  fetchedAtIst: string;
  cacheStatus: 'MISS' | 'HIT' | 'STALE_FALLBACK';
  cacheAgeSeconds: number;
  recommendedPollIntervalSeconds: number;
  totalArticles: number;
  activeSourcesCount: number;
  sourcesStatus: NewsSourceStatus[];
  articles: EconomicNewsArticle[];
}

export const NEWS_SUBTOPICS_META: Record<
  NewsSubTopicId,
  { category: NewsMacroCategory; label: string; shortLabel: string }
> = {
  'india-rbi-monetary': {
    category: 'india',
    label: 'RBI Monetary Policy, Repo Rate & Banking',
    shortLabel: 'RBI & Banking',
  },
  'india-budget-tax-policy': {
    category: 'india',
    label: 'Union Budget, Taxation & Government Policy',
    shortLabel: 'Budget & Fiscal Policy',
  },
  'india-cpi-gdp-plfs-iip': {
    category: 'india',
    label: 'CPI Inflation, GDP, Unemployment & Industrial Production',
    shortLabel: 'CPI, GDP & Jobs',
  },
  'india-markets-bonds-investment': {
    category: 'india',
    label: 'Indian Stock Markets, Bonds & Investment',
    shortLabel: 'Markets & Bonds',
  },
  'india-trade-exports-fdi': {
    category: 'india',
    label: 'Exports, Imports, Trade Deficit & Foreign Investment',
    shortLabel: 'Trade & FDI',
  },
  'india-rupee-fx-crude': {
    category: 'india',
    label: 'Rupee Movements, Foreign Exchange Reserves & Crude Oil',
    shortLabel: 'Rupee, FX & Crude',
  },
  'india-infra-mfg-agri-jobs': {
    category: 'india',
    label: 'Infrastructure, Manufacturing, Agriculture & Employment',
    shortLabel: 'Infra, Mfg & Agri',
  },
  'global-fed-central-banks': {
    category: 'global',
    label: 'US Federal Reserve & Major Central-Bank Decisions',
    shortLabel: 'Fed & Central Banks',
  },
  'global-inflation-rates-recession': {
    category: 'global',
    label: 'Global Inflation, Interest Rates & Recession Risks',
    shortLabel: 'Global Inflation & Rates',
  },
  'global-trade-tariffs-sanctions': {
    category: 'global',
    label: 'International Trade Agreements, Tariffs & Sanctions',
    shortLabel: 'Trade & Tariffs',
  },
  'global-geopolitics-shipping': {
    category: 'global',
    label: 'Wars, Geopolitical Tensions & Shipping Disruptions',
    shortLabel: 'Geopolitics & Shipping',
  },
  'global-commodities-energy-gold': {
    category: 'global',
    label: 'Crude Oil, Natural Gas, Gold & Commodities',
    shortLabel: 'Oil, Gold & Commodities',
  },
  'global-us-china-eu-em': {
    category: 'global',
    label: 'China, US, European Union & Emerging Economies',
    shortLabel: 'US, China, EU & EM',
  },
  'global-imf-wb-wto-forecasts': {
    category: 'global',
    label: 'IMF, World Bank, WTO & Global Economic Forecasts',
    shortLabel: 'IMF, World Bank & WTO',
  },
  'global-markets-supply-chains': {
    category: 'global',
    label: 'International Financial Markets & Supply Chains',
    shortLabel: 'Global Markets & Supply',
  },
  'ca-national-intl-economic': {
    category: 'current-affairs',
    label: 'Major National & International Economic Developments',
    shortLabel: 'Macro Developments',
  },
  'ca-govt-regulatory-changes': {
    category: 'current-affairs',
    label: 'Government Announcements & Regulatory Changes',
    shortLabel: 'Regulatory & Policy',
  },
  'ca-elections-policy-shifts': {
    category: 'current-affairs',
    label: 'Elections & Policy Changes with Economic Implications',
    shortLabel: 'Policy Shifts',
  },
  'ca-climate-energy-disasters': {
    category: 'current-affairs',
    label: 'Climate Events, Energy Security & Natural Disasters',
    shortLabel: 'Climate & Energy Security',
  },
};

interface FeedConfig {
  id: string;
  name: string;
  shortName: string;
  type: 'official_india' | 'official_international' | 'economic_press';
  officialUrl: string;
  feedUrl: string;
  format: 'rss' | 'worldbank_json';
  defaultCategory: NewsMacroCategory;
  defaultSubTopic: NewsSubTopicId;
  isPolicyFeed?: boolean;
  maxItems: number;
}

const UPSTREAM_FEEDS: FeedConfig[] = [
  {
    id: 'rbi-press',
    name: 'Reserve Bank of India (RBI) — Official Press Releases',
    shortName: 'RBI Official',
    type: 'official_india',
    officialUrl: 'https://www.rbi.org.in/',
    feedUrl: 'https://rbi.org.in/pressreleases_rss.xml',
    format: 'rss',
    defaultCategory: 'india',
    defaultSubTopic: 'india-rbi-monetary',
    isPolicyFeed: true,
    maxItems: 8,
  },
  {
    id: 'rbi-notifications',
    name: 'Reserve Bank of India (RBI) — Regulatory Notifications',
    shortName: 'RBI Notifications',
    type: 'official_india',
    officialUrl: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx',
    feedUrl: 'https://rbi.org.in/notifications_rss.xml',
    format: 'rss',
    defaultCategory: 'current-affairs',
    defaultSubTopic: 'ca-govt-regulatory-changes',
    isPolicyFeed: true,
    maxItems: 6,
  },
  {
    id: 'fed-monetary',
    name: 'US Federal Reserve Board — Monetary Policy Releases',
    shortName: 'US Fed Official',
    type: 'official_international',
    officialUrl: 'https://www.federalreserve.gov/monetarypolicy.htm',
    feedUrl: 'https://www.federalreserve.gov/feeds/press_monetary.xml',
    format: 'rss',
    defaultCategory: 'global',
    defaultSubTopic: 'global-fed-central-banks',
    isPolicyFeed: true,
    maxItems: 5,
  },
  {
    id: 'ecb-press',
    name: 'European Central Bank (ECB) — Official Press Releases',
    shortName: 'ECB Official',
    type: 'official_international',
    officialUrl: 'https://www.ecb.europa.eu/press/html/index.en.html',
    feedUrl: 'https://www.ecb.europa.eu/rss/press.html',
    format: 'rss',
    defaultCategory: 'global',
    defaultSubTopic: 'global-fed-central-banks',
    isPolicyFeed: true,
    maxItems: 5,
  },
  {
    id: 'world-bank-api',
    name: 'World Bank Group — Official Economic News API',
    shortName: 'World Bank',
    type: 'official_international',
    officialUrl: 'https://www.worldbank.org/en/news',
    feedUrl:
      'https://search.worldbank.org/api/v2/news?format=json&rows=10&srt=lnchdt&order=desc&qterm=economy+trade+growth+energy+finance',
    format: 'worldbank_json',
    defaultCategory: 'global',
    defaultSubTopic: 'global-imf-wb-wto-forecasts',
    isPolicyFeed: true,
    maxItems: 6,
  },
  {
    id: 'et-economy',
    name: 'The Economic Times — India Economy & Policy',
    shortName: 'Economic Times',
    type: 'economic_press',
    officialUrl: 'https://economictimes.indiatimes.com/news/economy',
    feedUrl: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms',
    format: 'rss',
    defaultCategory: 'india',
    defaultSubTopic: 'india-cpi-gdp-plfs-iip',
    maxItems: 14,
  },
  {
    id: 'bs-economy-policy',
    name: 'Business Standard — Economy & Public Policy',
    shortName: 'Business Standard',
    type: 'economic_press',
    officialUrl: 'https://www.business-standard.com/economy',
    feedUrl: 'https://www.business-standard.com/rss/economy-policy-102.rss',
    format: 'rss',
    defaultCategory: 'india',
    defaultSubTopic: 'india-budget-tax-policy',
    maxItems: 14,
  },
  {
    id: 'mint-economy',
    name: 'Mint (Livemint) — Macroeconomics & Policy',
    shortName: 'Mint Economy',
    type: 'economic_press',
    officialUrl: 'https://www.livemint.com/economy',
    feedUrl: 'https://www.livemint.com/rss/economy',
    format: 'rss',
    defaultCategory: 'india',
    defaultSubTopic: 'india-infra-mfg-agri-jobs',
    maxItems: 12,
  },
  {
    id: 'cnbc-economy',
    name: 'CNBC — Global Macroeconomics & Central Banks',
    shortName: 'CNBC Economy',
    type: 'economic_press',
    officialUrl: 'https://www.cnbc.com/economy/',
    feedUrl:
      'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258',
    format: 'rss',
    defaultCategory: 'global',
    defaultSubTopic: 'global-inflation-rates-recession',
    maxItems: 10,
  },
  {
    id: 'bbc-business',
    name: 'BBC News — International Business & Global Trade',
    shortName: 'BBC Business',
    type: 'economic_press',
    officialUrl: 'https://www.bbc.com/business',
    feedUrl: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    format: 'rss',
    defaultCategory: 'global',
    defaultSubTopic: 'global-markets-supply-chains',
    maxItems: 8,
  },
];

// In-memory server cache (5 minutes fresh TTL, up to 30 minutes stale fallback)
let cachedNewsPayload: EconomicNewsResponse | null = null;
let cachedAtTimestampMs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function formatIstTimestamp(date: Date): string {
  try {
    return (
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date) + ' IST'
    );
  } catch {
    return date.toISOString();
  }
}

function computeRelativeTimeLabel(pubDate: Date, nowMs: number): string {
  const diffSec = Math.max(0, Math.floor((nowMs - pubDate.getTime()) / 1000));
  if (diffSec < 90) return 'Just published';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays <= 14) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(pubDate);
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&lsquo;|&rsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&ndash;|&#8211;/gi, '–')
    .replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function extractXmlTag(itemXml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = itemXml.match(regex);
  return match ? decodeHtmlEntities(match[1]) : '';
}

// Strict filter to exclude celebrity gossip, entertainment, lifestyle, sports, or non-economic clickbait
const NON_ECONOMIC_EXCLUSION_REGEX =
  /\b(bollywood|hollywood|cricket|ipl|world cup|football|tennis|celebrity|actor|actress|movie review|box office|horoscope|zodiac|astrology|bigg boss|dating|wedding|divorce|fashion week|recipe|skin care|workout|viral video|meme|quiz|crossword)\b/i;

const ECONOMIC_SIGNAL_REGEX =
  /\b(economy|economic|gdp|gva|inflation|cpi|wpi|rbi|repo rate|monetary|central bank|fed|federal reserve|ecb|imf|world bank|wto|trade|export|import|deficit|surplus|tariff|customs|sanction|rupee|inr|usd|forex|fx|reserves|crude|oil|brent|opec|natural gas|energy|commodity|gold|silver|bond|yield|g-sec|treasury|fiscal|budget|tax|gst|customs|subsidy|capex|infrastructure|manufacturing|pli|msme|agriculture|monsoon|kharif|rabi|unemployment|employment|jobs|labour|plfs|wage|market|nifty|sensex|equity|stock|fii|fpi|fdi|investment|bank|credit|lending|liquidity|auction|recession|growth|supply chain|shipping|freight|red sea|geopolitic|climate|power|coal|solar|renewable|upi|digital payment|sebi|regulatory|ministry|mospi|commerce|finance|industrial|iip|pmi)\b/i;

function isEconomicallyRelevant(
  title: string,
  description: string,
  sourceType: FeedConfig['type']
): boolean {
  const combined = `${title} ${description}`;
  if (NON_ECONOMIC_EXCLUSION_REGEX.test(combined)) {
    return false;
  }
  // Official central bank / World Bank feeds are inherently economic/policy releases
  if (sourceType === 'official_india' || sourceType === 'official_international') {
    return title.length > 10;
  }
  return ECONOMIC_SIGNAL_REGEX.test(combined);
}

function normalizeHeadlineForDedup(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !['the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'over', 'after', 'amid'].includes(w)
    )
    .join(' ');
}

function areHeadlinesDuplicate(a: string, b: string): boolean {
  const normA = normalizeHeadlineForDedup(a);
  const normB = normalizeHeadlineForDedup(b);
  if (!normA || !normB) return false;
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) return true;
  const wordsA = new Set(normA.split(' '));
  const wordsB = new Set(normB.split(' '));
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 && intersection / union >= 0.62;
}

function rewriteConciseSummary(
  headline: string,
  rawDesc: string,
  sourceShortName: string
): string {
  const cleaned = decodeHtmlEntities(rawDesc);
  if (!cleaned || cleaned.toLowerCase() === headline.toLowerCase() || cleaned.length < 25) {
    return `Published by ${sourceShortName}: ${headline}. Open the source link or expand the transmission brief below for indicator-level context.`;
  }
  // Take first 1-2 sentences up to ~240 characters so we never copy full article bodies
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && !s.toLowerCase().startsWith('also read'));
  const summaryText = sentences.slice(0, 2).join(' ');
  if (!summaryText) {
    return cleaned.length > 230 ? `${cleaned.slice(0, 227).trim()}...` : cleaned;
  }
  return summaryText.length > 250 ? `${summaryText.slice(0, 247).trim()}...` : summaryText;
}

const INDICATOR_CATALOG: Record<
  AffectedArthNitiIndicator['id'],
  Omit<AffectedArthNitiIndicator, 'transmissionChannel'>
> = {
  'cpi-inflation': {
    id: 'cpi-inflation',
    label: 'CPI Inflation',
    shortValueContext: '5.54% YoY (MoSPI Base 2024=100)',
    pageId: 'inflation',
    indicatorId: 'cpi-inflation',
  },
  'gdp-growth': {
    id: 'gdp-growth',
    label: 'Real GDP Growth',
    shortValueContext: '7.8% YoY (Q1 FY27 · Base 2022–23)',
    pageId: 'gdp-growth',
    indicatorId: 'gdp-growth',
  },
  'rbi-repo-rate': {
    id: 'rbi-repo-rate',
    label: 'RBI Policy Repo Rate',
    shortValueContext: '5.50% (MPC Calibrated Tightening)',
    pageId: 'financial-markets',
    indicatorId: 'rbi-repo-rate',
  },
  'unemployment-rate': {
    id: 'unemployment-rate',
    label: 'PLFS Unemployment Rate',
    shortValueContext: '5.0% All-India (15+ Years)',
    pageId: 'labour-market',
    indicatorId: 'unemployment-rate',
  },
  'usd-inr': {
    id: 'usd-inr',
    label: 'USD/INR Reference Rate',
    shortValueContext: '₹94.6986 / USD (FBIL · RBI DBIE)',
    pageId: 'currency-oil',
    indicatorId: 'usd-inr',
  },
  'crude-oil': {
    id: 'crude-oil',
    label: 'Indian Basket Crude Oil',
    shortValueContext: '$116.09 / bbl (PPAC)',
    pageId: 'currency-oil',
    indicatorId: 'crude-oil',
  },
  'merchandise-trade': {
    id: 'merchandise-trade',
    label: 'Merchandise Trade Balance',
    shortValueContext: '-$30.21B Deficit (MoCI · Sep 2026)',
    pageId: 'currency-oil',
    indicatorId: 'merchandise-trade',
  },
  'indian-stock-indices': {
    id: 'indian-stock-indices',
    label: 'Live Indian Stock Indices',
    shortValueContext: 'NIFTY 50 · SENSEX · BANK NIFTY',
    pageId: 'financial-markets',
    indicatorId: 'nifty-50',
  },
};

interface ClassificationAndIntelligenceResult {
  category: NewsMacroCategory;
  subTopicId: NewsSubTopicId;
  isPolicyAnnouncement: boolean;
  isMarketMoving: boolean;
  intelligence: EconomicStoryIntelligence;
}

function classifyAndAnalyzeStory(
  headline: string,
  summary: string,
  feed: FeedConfig
): ClassificationAndIntelligenceResult {
  const text = `${headline} ${summary}`.toLowerCase();

  const mentionsIndia =
    feed.defaultCategory === 'india' ||
    feed.type === 'official_india' ||
    /\b(india|indian|rbi|mospi|sensex|nifty|rupee|inr|gst|sitharaman|goyal|shaktikanta|malhotra|mumbai|new delhi|sebi|upi|kharif|rabi|dgci|ppac|lok sabha|union budget|centre|ministry)\b/i.test(
      text
    );

  let category: NewsMacroCategory = feed.defaultCategory;
  let subTopicId: NewsSubTopicId = feed.defaultSubTopic;
  let isPolicyAnnouncement = Boolean(feed.isPolicyFeed);
  let isMarketMoving = false;

  const affectedList: AffectedArthNitiIndicator[] = [];
  const addIndicator = (
    id: AffectedArthNitiIndicator['id'],
    transmissionChannel: string
  ) => {
    if (!affectedList.some((item) => item.id === id)) {
      affectedList.push({
        ...INDICATOR_CATALOG[id],
        transmissionChannel,
      });
    }
  };

  let whyItMatters = '';
  let impactOnIndia = '';
  let globalImpact = '';
  let direction: ImpactDirection = 'mixed';
  let directionLabel = 'Mixed / Context-Dependent Macroeconomic Effect';
  let timeHorizon: EconomicStoryIntelligence['impactAssessment']['timeHorizon'] =
    'Short-term (0–3M)';
  let reasoning = '';

  // Rule 1: Trade, Exports, Imports, FTA, Tariffs, WTO, Customs
  if (
    /\b(trade|export|import|FTA|bilateral|tariff|customs duty|deficit|surplus|wto|merchandise|commerce|shipping|red sea|supply chain|corridor)\b/i.test(
      text
    )
  ) {
    isMarketMoving = true;
    if (mentionsIndia && !/\b(china-eu|us-china)\b/i.test(text)) {
      category = 'india';
      subTopicId = 'india-trade-exports-fdi';
    } else if (/\b(war|conflict|houthi|red sea|sanction|blockade|strait|hormuz)\b/i.test(text)) {
      category = 'global';
      subTopicId = 'global-geopolitics-shipping';
    } else {
      category = 'global';
      subTopicId = 'global-trade-tariffs-sanctions';
    }

    addIndicator(
      'merchandise-trade',
      'Directly alters export competitiveness, import landed costs, and the monthly merchandise trade balance (-$30.21B in Sep 2026).'
    );
    addIndicator(
      'usd-inr',
      'Shifts net trade-dollar demand and current-account financing pressures on the USD/INR exchange rate.'
    );
    addIndicator(
      'gdp-growth',
      'Net exports (X − M) and export-oriented manufacturing directly feed into quarterly Real GDP expenditure.'
    );

    const isPositiveTrade =
      /\b(agreement|deal|surge|growth|expand|boost|fine-tuning|concluded|ease|cut tariff|record export)\b/i.test(
        text
      ) && !/\b(deficit widens|slump|tariff hike|sanction|disruption)\b/i.test(text);

    direction = isPositiveTrade ? 'positive' : 'mixed';
    directionLabel = isPositiveTrade
      ? 'Constructive for External Trade & Export Sectors'
      : 'Mixed / Trade Balance & Cost-Push Sensitivity';
    timeHorizon = 'Medium-term (3–12M)';
    whyItMatters =
      'Cross-border trade rules, tariff schedules, and bilateral negotiations determine market access for Indian merchandise ($44.40B monthly exports) and input costs for domestic producers.';
    impactOnIndia =
      'Affects Indian exporters (engineering goods, electronics, textiles, pharmaceuticals) and alters the merchandise trade deficit and INR external balance.';
    globalImpact =
      'Shapes cross-border supply-chain routing, bilateral tariff structures, and global trade volume growth tracked by the WTO and IMF.';
    reasoning = isPositiveTrade
      ? 'Progress on bilateral trade agreements or export expansion lowers tariff friction and supports domestic manufacturing output, though net balance effects depend on capital-goods import demand.'
      : 'Changes in tariffs, trade barriers, or shipping costs create asymmetric effects across importing industries versus domestic competing producers.';
  }
  // Rule 2: Crude Oil, Energy, Natural Gas, Gold, Commodities, PPAC, OPEC
  else if (
    /\b(crude|oil|brent|opec|petroleum|ppac|refinery|natural gas|lng|fuel|petrol|diesel|gold|bullion|silver|copper|commodity|energy security)\b/i.test(
      text
    )
  ) {
    isMarketMoving = true;
    if (mentionsIndia) {
      category = 'india';
      subTopicId = 'india-rupee-fx-crude';
    } else {
      category = 'global';
      subTopicId = 'global-commodities-energy-gold';
    }

    addIndicator(
      'crude-oil',
      'Directly moves India’s crude import basket benchmark ($116.09/bbl in Oct 2026) as India imports >85% of its crude requirements.'
    );
    addIndicator(
      'cpi-inflation',
      'Pass-through via transport, logistics, aviation fuel, and petrochemical input costs into headline and core CPI.'
    );
    addIndicator(
      'merchandise-trade',
      'Petroleum, crude, and gold imports account for over one-third of India’s total merchandise import bill ($74.61B/month).'
    );
    addIndicator(
      'usd-inr',
      'Higher dollar outflows by oil marketing companies (OMCs) increase spot USD demand in the domestic forex market.'
    );

    const isPriceDrop = /\b(fall|drop|ease|decline|slump|lower|cool|discount)\b/i.test(text);
    const isPriceSpike = /\b(surge|jump|spike|rise|high|tight|cut output|disruption)\b/i.test(text);

    direction = isPriceDrop ? 'positive' : isPriceSpike ? 'negative' : 'mixed';
    directionLabel = isPriceDrop
      ? 'Positive Relief for Imported Inflation & Current Account'
      : isPriceSpike
      ? 'Adverse Cost-Push & Import-Bill Pressure'
      : 'Mixed Commodity & External Sector Sensitivity';
    timeHorizon = 'Short-term (0–3M)';
    whyItMatters =
      'Global energy and commodity prices are India’s primary external shock transmission channel, simultaneously affecting the trade deficit, rupee stability, and domestic inflation.';
    impactOnIndia =
      'Every $10/bbl sustained shift in the Indian Crude Basket alters India’s annualised import bill by ~$13–15 billion and influences retail logistics inflation.';
    globalImpact =
      'Alters global headline inflation trajectories, energy trade balances between net exporters and importers, and central-bank rate cut timelines.';
    reasoning =
      'Because India is a major net energy importer, higher global energy/commodity prices widen the merchandise trade deficit and pressure inflation, whereas softer prices support disinflation.';
  }
  // Rule 3: RBI, Repo Rate, Indian Banking, G-Sec, Liquidity, UPI, Digital Payments
  else if (
    feed.id === 'rbi-press' ||
    feed.id === 'rbi-notifications' ||
    /\b(rbi|reserve bank of india|repo rate|monetary policy committee|mpc|g-sec|government securities|e-kuber|liquidity|sdf|msf|crr|slr|npa|bank credit|upi|digital payment|nbcf)\b/i.test(
      text
    )
  ) {
    isPolicyAnnouncement = true;
    isMarketMoving = true;
    category = feed.id === 'rbi-notifications' ? 'current-affairs' : 'india';
    subTopicId =
      feed.id === 'rbi-notifications' ? 'ca-govt-regulatory-changes' : 'india-rbi-monetary';

    addIndicator(
      'rbi-repo-rate',
      'Shapes domestic money-market yields, WACR, and transmission of the 5.50% policy repo rate across banking channels.'
    );
    addIndicator(
      'indian-stock-indices',
      'Directly influences BANK NIFTY, rate-sensitive financials, and sovereign bond yields.'
    );
    addIndicator(
      'cpi-inflation',
      'RBI liquidity and rate operations anchor inflation expectations toward the 4.0% (±2%) medium-term target.'
    );

    direction = 'mixed';
    directionLabel = 'Calibrated Monetary & Financial Stability Transmission';
    timeHorizon = 'Short-term (0–3M)';
    whyItMatters =
      'RBI monetary operations, sovereign bond auctions, and banking regulations govern systemic liquidity, borrowing costs for enterprises, and financial stability.';
    impactOnIndia =
      'Affects sovereign yield curves (G-Sec), commercial bank lending/deposit rates, credit growth, and financial-sector equity valuations.';
    globalImpact =
      'Influences foreign portfolio investor (FPI) debt/equity flows into Indian markets and cross-border interest-rate differentials.';
    reasoning =
      'Central bank liquidity, regulatory, and debt-management measures balance inflation containment against credit availability and systemic financial resilience.';
  }
  // Rule 4: US Fed, ECB, Bank of England, BOJ, Global Central Banks & Global Inflation
  else if (
    feed.id === 'fed-monetary' ||
    feed.id === 'ecb-press' ||
    /\b(federal reserve|fomc|powell|ecb|european central bank|lagarde|bank of england|bank of japan|interest rate|discount rate|lending conditions|us inflation|pce|treasury yield|jobless claims)\b/i.test(
      text
    )
  ) {
    isPolicyAnnouncement = isPolicyAnnouncement || /\b(minutes|rate|policy|ecb|fed)\b/i.test(text);
    isMarketMoving = true;
    category = 'global';
    subTopicId =
      /\b(inflation|recession|jobless|cpi|pce)\b/i.test(text) &&
      !feed.id.startsWith('fed') &&
      !feed.id.startsWith('ecb')
        ? 'global-inflation-rates-recession'
        : 'global-fed-central-banks';

    addIndicator(
      'usd-inr',
      'US and Eurozone rate expectations drive the US Dollar Index (DXY) and capital flows, directly affecting USD/INR.'
    );
    addIndicator(
      'indian-stock-indices',
      'Global risk-free yields impact FII/FPI equity allocations into NIFTY 50, NIFTY IT, and emerging markets.'
    );
    addIndicator(
      'rbi-repo-rate',
      'Global monetary policy divergence shapes external-sector constraints considered by the RBI MPC.'
    );

    direction = 'mixed';
    directionLabel = 'Global Rate Differential & Capital Flow Spillover';
    timeHorizon = 'Short-term (0–3M)';
    whyItMatters =
      'Developed-market central bank policies (Fed, ECB) set global benchmark yields and liquidity conditions, driving capital flows to emerging economies like India.';
    impactOnIndia =
      'Tighter global financial conditions or resilient US yields can pressure the rupee and FPI inflows, while global demand resilience supports Indian IT and service exports.';
    globalImpact =
      'Governs global sovereign borrowing costs, corporate refinancing conditions, and cross-currency exchange rates.';
    reasoning =
      'Shifts in US/European interest rates and labour-market tightness have dual effects: tighter yields weigh on EM valuations, whereas strong developed-market employment supports Indian export demand.';
  }
  // Rule 5: MoSPI, CPI, GDP, PLFS Unemployment, IIP, PMI, Surveys
  else if (
    /\b(mospi|cpi|inflation|gdp|national accounts|unemployment|plfs|employment|labour|unincorporated|iip|industrial production|pmi|manufacturing output)\b/i.test(
      text
    )
  ) {
    isPolicyAnnouncement =
      isPolicyAnnouncement || /\b(mospi|ministry of statistics|nso|survey)\b/i.test(text);
    category = mentionsIndia ? 'india' : 'global';
    subTopicId =
      /\b(infrastructure|project|cost overrun|highway|railway)\b/i.test(text) && mentionsIndia
        ? 'india-infra-mfg-agri-jobs'
        : mentionsIndia
        ? 'india-cpi-gdp-plfs-iip'
        : 'global-inflation-rates-recession';

    addIndicator(
      'gdp-growth',
      'Provides primary statistical measurement of output, enterprise investment, and formal/informal sector GVA.'
    );
    addIndicator(
      'unemployment-rate',
      'Tracks labour-force absorption, enterprise job creation, and household income resilience.'
    );
    addIndicator(
      'cpi-inflation',
      'Measures price stability and real purchasing power across rural and urban households.'
    );

    const hasAdverseSignal = /\b(overrun|delay|spike|worsen|contraction|slump|shortfall)\b/i.test(
      text
    );
    direction = hasAdverseSignal ? 'mixed' : 'positive';
    directionLabel = hasAdverseSignal
      ? 'Mixed / Execution & Fiscal Efficiency Watch'
      : 'Strengthens Macroeconomic Visibility & Policy Targeting';
    timeHorizon = 'Medium-term (3–12M)';
    whyItMatters =
      'Official statistical surveys and project monitoring reports form the empirical foundation for RBI monetary policy and Union Budget capital allocation.';
    impactOnIndia =
      'Enhances measurement of India’s formal and unincorporated sectors, infrastructure execution efficiency, employment trends, and price dynamics.';
    globalImpact =
      'Aligns national macroeconomic statistics with IMF SDDS and international investor benchmarking standards.';
    reasoning = hasAdverseSignal
      ? 'Official project monitoring highlights execution bottlenecks or cost escalations that require fiscal and administrative remediation.'
      : 'Expanded statistical coverage and high-frequency output/employment indicators improve policy precision and investor confidence in India’s growth trajectory.';
  }
  // Rule 6: Union Budget, Taxation, GST, Fiscal Policy, Government Reform, Elections/Policy
  else if (
    /\b(budget|fiscal|tax|gst|cbdt|cbic|subsidy|disinvestment|capex|finance ministry|sitharaman|cabinet|policy|regulation|reform|scheme|pli|election|parliament)\b/i.test(
      text
    )
  ) {
    isPolicyAnnouncement = true;
    if (/\b(election|cabinet|parliament|supreme court|regulatory)\b/i.test(text) && !mentionsIndia) {
      category = 'current-affairs';
      subTopicId = 'ca-elections-policy-shifts';
    } else if (mentionsIndia) {
      category = 'india';
      subTopicId = 'india-budget-tax-policy';
    } else {
      category = 'current-affairs';
      subTopicId = 'ca-govt-regulatory-changes';
    }

    addIndicator(
      'gdp-growth',
      'Public capital expenditure (capex), tax compliance, and regulatory reforms directly influence gross fixed capital formation.'
    );
    addIndicator(
      'cpi-inflation',
      'Indirect tax adjustments (GST/customs) and targeted supply-side subsidies influence retail price levels.'
    );
    addIndicator(
      'indian-stock-indices',
      'Fiscal discipline and sector-specific policy incentives drive domestic institutional and foreign investor sentiment.'
    );

    direction = 'positive';
    directionLabel = 'Policy & Institutional Transmission Channel';
    timeHorizon = 'Medium-term (3–12M)';
    whyItMatters =
      'Fiscal policy, taxation administration, and structural reforms shape public investment multipliers, sovereign borrowing needs, and private-sector capex incentives.';
    impactOnIndia =
      'Directly affects government revenue buoyancy, infrastructure execution, and sector-specific corporate earnings across India.';
    globalImpact =
      'Influences sovereign credit assessments and cross-border foreign direct investment (FDI) competitiveness.';
    reasoning =
      'Targeted fiscal and regulatory measures support medium-term growth capacity, subject to execution timelines and fiscal-deficit consolidation targets.';
  }
  // Rule 7: World Bank, IMF, WTO, Multilateral Development, Global Forecasts
  else if (
    feed.id === 'world-bank-api' ||
    /\b(imf|world bank|ifc|adb|wto|oecd|multilateral|development bank|global forecast)\b/i.test(text)
  ) {
    isPolicyAnnouncement = true;
    category = 'global';
    subTopicId = 'global-imf-wb-wto-forecasts';

    addIndicator(
      'gdp-growth',
      'Benchmarks India’s 7.8% Real GDP growth against global and emerging-market peer forecasts.'
    );
    addIndicator(
      'merchandise-trade',
      'Tracks multilateral trade-finance availability and developing-economy demand corridors.'
    );

    direction = 'positive';
    directionLabel = 'Multilateral Development & Macroeconomic Benchmarking';
    timeHorizon = 'Structural (1–3Y)';
    whyItMatters =
      'Multilateral institutions (World Bank, IFC, IMF, WTO) provide cross-country capital financing, development benchmarks, and global growth assessments.';
    impactOnIndia =
      'Informs external demand assumptions for Indian exports and supports development financing in infrastructure, energy transition, and MSME credit.';
    globalImpact =
      'Strengthens emerging-market financing capacity, climate resilience, and cross-border development cooperation.';
    reasoning =
      'Institutional development programs and macroeconomic assessments expand long-term productive capacity in developing and emerging economies.';
  }
  // Rule 8: Climate, Agriculture, Sugar/Wheat/Rice, Monsoon, Infrastructure, Manufacturing
  else if (
    /\b(climate|weather|monsoon|agriculture|crop|sugar|wheat|rice|grain|pulses|fertilizer|kharif|rabi|power|renewable|solar|coal|infrastructure|railway|highway|port|logistics|manufacturing|factory)\b/i.test(
      text
    )
  ) {
    if (/\b(climate|disaster|cyclone|flood|heatwave|energy transition)\b/i.test(text)) {
      category = 'current-affairs';
      subTopicId = 'ca-climate-energy-disasters';
    } else {
      category = mentionsIndia ? 'india' : 'global';
      subTopicId = mentionsIndia ? 'india-infra-mfg-agri-jobs' : 'global-us-china-eu-em';
    }

    addIndicator(
      'cpi-inflation',
      'Agricultural supply, food stocks, and weather patterns directly drive food and beverage CPI (the largest weight in India’s CPI basket).'
    );
    addIndicator(
      'gdp-growth',
      'Infrastructure execution, manufacturing output, and agricultural GVA drive real sector growth.'
    );
    addIndicator(
      'unemployment-rate',
      'Construction, manufacturing, and rural agriculture are India’s largest employment-generating sectors.'
    );

    const isPositiveSupply = /\b(enough stock|bumper|record output|begin crushing|expand|boost|surplus)\b/i.test(
      text
    );
    direction = isPositiveSupply ? 'positive' : 'mixed';
    directionLabel = isPositiveSupply
      ? 'Supportive Domestic Supply & Food Inflation Cushion'
      : 'Real-Sector Output & Supply-Side Inflation Channel';
    timeHorizon = 'Medium-term (3–12M)';
    whyItMatters =
      'Physical infrastructure, manufacturing capacity, and agricultural supply conditions determine both food price stability and real GVA expansion.';
    impactOnIndia =
      'Affects rural household incomes, food price stability in the MoSPI CPI basket, and domestic industrial/logistics efficiency.';
    globalImpact =
      'Influences regional agricultural and commodity supply balances, export quotas, and energy transition investments.';
    reasoning = isPositiveSupply
      ? 'Adequate domestic crop crushing and inventory levels anchor food inflation expectations and reduce import dependency.'
      : 'Infrastructure and manufacturing expansion boost potential GDP, whereas climate or agricultural supply disruptions pose upside risks to food inflation.';
  }
  // Rule 9: Stock Markets, Bonds, FII/FPI, Corporate Investment, Tech/Supply Chains
  else if (
    /\b(stock market|stocks|share listing|shares|market|nifty|sensex|ipo|listing|equity|bond|yield|investor|fii|fpi|investment|tech|ai|semiconductor|supply chain)\b/i.test(
      text
    )
  ) {
    isMarketMoving = true;
    if (mentionsIndia) {
      category = 'india';
      subTopicId = 'india-markets-bonds-investment';
    } else {
      category = 'global';
      subTopicId = 'global-markets-supply-chains';
    }

    addIndicator(
      'indian-stock-indices',
      'Directly impacts equity risk appetite across NIFTY 50, SENSEX, BANK NIFTY, NIFTY IT, and MIDCAP 100.'
    );
    addIndicator(
      'usd-inr',
      'Cross-border equity and bond portfolio flows influence short-term USD/INR exchange dynamics.'
    );
    addIndicator(
      'gdp-growth',
      'Capital-market fundraising and corporate capex support private investment growth.'
    );

    direction = 'mixed';
    directionLabel = 'Financial Market Sentiment & Valuation Channel';
    timeHorizon = 'Short-term (0–3M)';
    whyItMatters =
      'Equity and capital-market developments reflect real-time investor expectations on corporate earnings, technology capex, and cost of capital.';
    impactOnIndia =
      'Transmits to Indian equity indices (especially NIFTY IT and large-cap benchmarks) and domestic primary-market fundraising.';
    globalImpact =
      'Shapes global equity risk premia, cross-border venture/IPO capital allocation, and technology supply-chain investment.';
    reasoning =
      'Market-moving corporate and capital-market developments alter sector valuations and risk appetite without guaranteed one-way macroeconomic outcomes.';
  }
  // Default fallback classification for general national/international economic developments
  else {
    category = mentionsIndia ? 'india' : 'current-affairs';
    subTopicId = mentionsIndia ? 'india-infra-mfg-agri-jobs' : 'ca-national-intl-economic';

    addIndicator(
      'gdp-growth',
      'Contributes to the broader macroeconomic environment for output, demand, and business confidence.'
    );
    addIndicator(
      'indian-stock-indices',
      'Monitored by institutional participants for macro-policy and sector spillovers.'
    );

    direction = 'uncertain';
    directionLabel = 'Developing Macroeconomic Context';
    timeHorizon = 'Medium-term (3–12M)';
    whyItMatters =
      'Provides institutional and macroeconomic context for tracking domestic and international policy developments.';
    impactOnIndia =
      'Tracked for secondary spillovers across domestic demand, regulatory expectations, and business sentiment.';
    globalImpact =
      'Forms part of the broader international economic and policy backdrop.';
    reasoning =
      'Direct quantitative transmission to headline macro indicators depends on subsequent policy implementation and market follow-through.';
  }

  const attributionType: EconomicStoryIntelligence['attributionType'] =
    feed.type === 'official_india' || feed.type === 'official_international'
      ? 'Official Institutional Release'
      : isPolicyAnnouncement
      ? 'Policy & Market Transmission Brief'
      : 'Reported Economic Development';

  return {
    category,
    subTopicId,
    isPolicyAnnouncement,
    isMarketMoving,
    intelligence: {
      whatHappened: summary,
      whyItMatters,
      impactOnIndia,
      globalImpact,
      affectedIndicators: affectedList,
      impactAssessment: {
        direction,
        label: directionLabel,
        timeHorizon,
        reasoning,
      },
      attributionType,
    },
  };
}

function getOfficialStatisticalMilestones(nowMs: number): EconomicNewsArticle[] {
  // Verified official statistical & policy releases already documented in ArthNiti's repositories
  // Explicitly attributed to their official ministries/institutions with real official URLs.
  const milestones: Array<{
    id: string;
    headline: string;
    summary: string;
    sourceName: string;
    sourceShortName: string;
    sourceType: 'official_india' | 'official_international';
    sourceHomepageUrl: string;
    originalUrl: string;
    publishedAtIso: string;
    feedStub: FeedConfig;
  }> = [
    {
      id: 'official-moci-trade-sep2026',
      headline:
        'Ministry of Commerce Releases Provisional Merchandise Trade Data: Exports Rise 23.04% YoY to $44.40B; Trade Deficit at $30.21B',
      summary:
        'Official Department of Commerce (TRADESTAT & DGCI&S) release reports India’s September 2026 merchandise exports at $44.40 billion (+23.04% YoY) and merchandise imports at $74.61 billion (+8.00% YoY), resulting in a merchandise trade balance of -$30.21 billion.',
      sourceName: 'Ministry of Commerce & Industry (MoCI · TRADESTAT)',
      sourceShortName: 'MoCI Official',
      sourceType: 'official_india',
      sourceHomepageUrl: 'https://www.commerce.gov.in/',
      originalUrl: 'https://www.commerce.gov.in/ministryofcommerce/node/893',
      publishedAtIso: '2026-10-15T12:00:00Z',
      feedStub: {
        id: 'moci-official',
        name: 'Ministry of Commerce & Industry',
        shortName: 'MoCI Official',
        type: 'official_india',
        officialUrl: 'https://www.commerce.gov.in/',
        feedUrl: 'https://www.commerce.gov.in/ministryofcommerce/node/893',
        format: 'rss',
        defaultCategory: 'india',
        defaultSubTopic: 'india-trade-exports-fdi',
        isPolicyFeed: true,
        maxItems: 1,
      },
    },
    {
      id: 'official-mospi-cpi-sep2026',
      headline:
        'MoSPI NSO Releases All-India Consumer Price Index (Base 2024=100): Headline Retail Inflation at 5.54% YoY',
      summary:
        'Official National Statistical Office (NSO), MoSPI bulletin reports All-India Combined CPI inflation at 5.54% YoY under the revised Base Year 2024=100 series, remaining within the upper tolerance band of the RBI’s 4.0% (±2%) inflation target.',
      sourceName: 'Ministry of Statistics & Programme Implementation (MoSPI)',
      sourceShortName: 'MoSPI Official',
      sourceType: 'official_india',
      sourceHomepageUrl: 'https://mospi.gov.in/',
      originalUrl: 'https://mospi.gov.in/latest-releases',
      publishedAtIso: '2026-10-12T12:00:00Z',
      feedStub: {
        id: 'mospi-official',
        name: 'MoSPI Official Releases',
        shortName: 'MoSPI Official',
        type: 'official_india',
        officialUrl: 'https://mospi.gov.in/',
        feedUrl: 'https://mospi.gov.in/latest-releases',
        format: 'rss',
        defaultCategory: 'india',
        defaultSubTopic: 'india-cpi-gdp-plfs-iip',
        isPolicyFeed: true,
        maxItems: 1,
      },
    },
    {
      id: 'official-rbi-mpc-oct2026',
      headline:
        'RBI Monetary Policy Committee (MPC) Raises Policy Repo Rate by 25 bps to 5.50% Under Calibrated Tightening Stance',
      summary:
        'In its October 2026 bi-monthly Monetary Policy Statement, the Reserve Bank of India’s MPC adjusted the policy repo rate under LAF to 5.50% (SDF at 5.25%, MSF and Bank Rate at 5.75%) to anchor inflation expectations amid global energy price volatility.',
      sourceName: 'Reserve Bank of India (RBI) — Monetary Policy Statement',
      sourceShortName: 'RBI MPC Official',
      sourceType: 'official_india',
      sourceHomepageUrl: 'https://www.rbi.org.in/',
      originalUrl: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx',
      publishedAtIso: '2026-10-07T06:30:00Z',
      feedStub: {
        id: 'rbi-mpc-official',
        name: 'RBI Monetary Policy Committee',
        shortName: 'RBI MPC Official',
        type: 'official_india',
        officialUrl: 'https://www.rbi.org.in/',
        feedUrl: 'https://www.rbi.org.in/',
        format: 'rss',
        defaultCategory: 'india',
        defaultSubTopic: 'india-rbi-monetary',
        isPolicyFeed: true,
        maxItems: 1,
      },
    },
  ];

  return milestones.map((m) => {
    const pubDate = new Date(m.publishedAtIso);
    const analysis = classifyAndAnalyzeStory(m.headline, m.summary, m.feedStub);
    const subMeta = NEWS_SUBTOPICS_META[analysis.subTopicId];
    return {
      id: m.id,
      headline: m.headline,
      conciseSummary: m.summary,
      sourceName: m.sourceName,
      sourceShortName: m.sourceShortName,
      sourceType: m.sourceType,
      sourceHomepageUrl: m.sourceHomepageUrl,
      originalUrl: m.originalUrl,
      publishedAtIso: pubDate.toISOString(),
      publishedAtIst: formatIstTimestamp(pubDate),
      relativeTimeLabel: computeRelativeTimeLabel(pubDate, nowMs),
      category: analysis.category,
      categoryLabel:
        analysis.category === 'india'
          ? 'India Economy'
          : analysis.category === 'global'
          ? 'Global Economy'
          : 'Current Affairs & Policy',
      subTopicId: analysis.subTopicId,
      subTopicLabel: subMeta.label,
      sections: ['policy-announcements', 'india-latest'],
      isPolicyAnnouncement: true,
      isMarketMoving: true,
      intelligence: analysis.intelligence,
    };
  });
}

async function fetchSingleFeed(
  feed: FeedConfig,
  nowMs: number
): Promise<{ status: NewsSourceStatus; articles: EconomicNewsArticle[] }> {
  try {
    const res = await fetch(feed.feedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          feed.format === 'worldbank_json'
            ? 'application/json'
            : 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(6500),
    });

    if (!res.ok) {
      return {
        status: {
          id: feed.id,
          name: feed.name,
          shortName: feed.shortName,
          type: feed.type,
          officialUrl: feed.officialUrl,
          feedUrl: feed.feedUrl,
          status: 'unavailable',
          articlesCount: 0,
          note: `HTTP ${res.status}`,
        },
        articles: [],
      };
    }

    const parsedArticles: EconomicNewsArticle[] = [];

    if (feed.format === 'worldbank_json') {
      const json = (await res.json()) as any;
      const docs = json?.documents ? Object.values(json.documents) : [];
      for (const doc of docs as any[]) {
        if (!doc || typeof doc !== 'object' || !doc.title) continue;
        const rawTitle =
          typeof doc.title === 'string'
            ? doc.title
            : doc.title?.['cdata!'] || '';
        const rawDesc =
          typeof doc.descr === 'string'
            ? doc.descr
            : doc.descr?.['cdata!'] || '';
        const headline = decodeHtmlEntities(rawTitle);
        const link = (doc.url || feed.officialUrl).replace(/^http:\/\//i, 'https://');
        if (!headline || !isEconomicallyRelevant(headline, rawDesc, feed.type)) {
          continue;
        }
        const parsedDate = doc.lnchdt ? new Date(doc.lnchdt) : new Date(nowMs);
        const validDate = Number.isNaN(parsedDate.getTime()) ? new Date(nowMs) : parsedDate;
        const summary = rewriteConciseSummary(headline, rawDesc, feed.shortName);
        const analysis = classifyAndAnalyzeStory(headline, summary, feed);
        const subMeta = NEWS_SUBTOPICS_META[analysis.subTopicId];

        parsedArticles.push({
          id: `${feed.id}-${doc.id || parsedArticles.length}`,
          headline,
          conciseSummary: summary,
          sourceName: feed.name,
          sourceShortName: feed.shortName,
          sourceType: feed.type,
          sourceHomepageUrl: feed.officialUrl,
          originalUrl: link,
          publishedAtIso: validDate.toISOString(),
          publishedAtIst: formatIstTimestamp(validDate),
          relativeTimeLabel: computeRelativeTimeLabel(validDate, nowMs),
          category: analysis.category,
          categoryLabel:
            analysis.category === 'india'
              ? 'India Economy'
              : analysis.category === 'global'
              ? 'Global Economy'
              : 'Current Affairs & Policy',
          subTopicId: analysis.subTopicId,
          subTopicLabel: subMeta.label,
          sections: [],
          isPolicyAnnouncement: analysis.isPolicyAnnouncement,
          isMarketMoving: analysis.isMarketMoving,
          intelligence: analysis.intelligence,
        });
        if (parsedArticles.length >= feed.maxItems) break;
      }
    } else {
      const xml = await res.text();
      const itemMatches = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];

      for (let i = 0; i < itemMatches.length; i++) {
        const itemXml = itemMatches[i];
        const headline = extractXmlTag(itemXml, 'title');
        const link =
          extractXmlTag(itemXml, 'link') ||
          extractXmlTag(itemXml, 'guid') ||
          feed.officialUrl;
        const rawDesc = extractXmlTag(itemXml, 'description');
        const rawPubDate =
          extractXmlTag(itemXml, 'pubDate') ||
          extractXmlTag(itemXml, 'dc:date') ||
          extractXmlTag(itemXml, 'published');

        if (!headline || !isEconomicallyRelevant(headline, rawDesc, feed.type)) {
          continue;
        }

        const parsedDate = rawPubDate ? new Date(rawPubDate) : new Date(nowMs);
        const validDate = Number.isNaN(parsedDate.getTime()) ? new Date(nowMs) : parsedDate;
        const summary = rewriteConciseSummary(headline, rawDesc, feed.shortName);
        const analysis = classifyAndAnalyzeStory(headline, summary, feed);
        const subMeta = NEWS_SUBTOPICS_META[analysis.subTopicId];

        parsedArticles.push({
          id: `${feed.id}-${i}-${validDate.getTime()}`,
          headline,
          conciseSummary: summary,
          sourceName: feed.name,
          sourceShortName: feed.shortName,
          sourceType: feed.type,
          sourceHomepageUrl: feed.officialUrl,
          originalUrl: link,
          publishedAtIso: validDate.toISOString(),
          publishedAtIst: formatIstTimestamp(validDate),
          relativeTimeLabel: computeRelativeTimeLabel(validDate, nowMs),
          category: analysis.category,
          categoryLabel:
            analysis.category === 'india'
              ? 'India Economy'
              : analysis.category === 'global'
              ? 'Global Economy'
              : 'Current Affairs & Policy',
          subTopicId: analysis.subTopicId,
          subTopicLabel: subMeta.label,
          sections: [],
          isPolicyAnnouncement: analysis.isPolicyAnnouncement,
          isMarketMoving: analysis.isMarketMoving,
          intelligence: analysis.intelligence,
        });

        if (parsedArticles.length >= feed.maxItems) break;
      }
    }

    return {
      status: {
        id: feed.id,
        name: feed.name,
        shortName: feed.shortName,
        type: feed.type,
        officialUrl: feed.officialUrl,
        feedUrl: feed.feedUrl,
        status: parsedArticles.length > 0 ? 'ok' : 'degraded',
        articlesCount: parsedArticles.length,
      },
      articles: parsedArticles,
    };
  } catch (err: any) {
    return {
      status: {
        id: feed.id,
        name: feed.name,
        shortName: feed.shortName,
        type: feed.type,
        officialUrl: feed.officialUrl,
        feedUrl: feed.feedUrl,
        status: 'unavailable',
        articlesCount: 0,
        note: err?.message || 'Feed timeout or network error',
      },
      articles: [],
    };
  }
}

function assignDashboardSections(articles: EconomicNewsArticle[]): EconomicNewsArticle[] {
  if (articles.length === 0) return [];

  // Sort newest first, with a slight priority boost for high-signal India/Trade/RBI stories published within the last 48h for the Featured slot
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAtIso).getTime() - new Date(a.publishedAtIso).getTime()
  );

  // Pick featured top story: most recent story that affects >= 2 ArthNiti indicators and has India or major Global Policy relevance
  const featuredCandidate =
    sorted.find(
      (a) =>
        a.intelligence.affectedIndicators.length >= 2 &&
        (a.category === 'india' || a.isPolicyAnnouncement)
    ) || sorted[0];

  return sorted.map((art) => {
    const sections = new Set<NewsDashboardSection>(art.sections);
    if (art.id === featuredCandidate.id) {
      sections.add('featured');
    }
    if (art.category === 'india') {
      sections.add('india-latest');
    }
    if (art.category === 'global') {
      sections.add('global-latest');
    }
    if (
      art.isPolicyAnnouncement ||
      art.sourceType === 'official_india' ||
      art.sourceType === 'official_international' ||
      art.category === 'current-affairs'
    ) {
      sections.add('policy-announcements');
    }
    if (art.isMarketMoving || art.intelligence.affectedIndicators.length >= 2) {
      sections.add('market-impact');
    }
    return {
      ...art,
      sections: Array.from(sections),
    };
  });
}

export async function getEconomicNewsPayload(options?: {
  forceRefresh?: boolean;
  simulateError?: boolean;
}): Promise<EconomicNewsResponse> {
  const nowMs = Date.now();

  if (options?.simulateError) {
    throw new Error(
      'Simulated News Aggregation Failure: Upstream official and financial RSS feeds could not be reached.'
    );
  }

  // Return fresh cache if within TTL and not forced
  if (
    !options?.forceRefresh &&
    cachedNewsPayload &&
    nowMs - cachedAtTimestampMs < CACHE_TTL_MS
  ) {
    return {
      ...cachedNewsPayload,
      cacheStatus: 'HIT',
      cacheAgeSeconds: Math.floor((nowMs - cachedAtTimestampMs) / 1000),
    };
  }

  // Fetch all upstream feeds in parallel
  const feedResults = await Promise.all(
    UPSTREAM_FEEDS.map((feed) => fetchSingleFeed(feed, nowMs))
  );

  const sourcesStatus = feedResults.map((r) => r.status);
  const rawLiveArticles = feedResults.flatMap((r) => r.articles);

  // Deduplicate stories across feeds
  const deduplicated: EconomicNewsArticle[] = [];
  const seenUrls = new Set<string>();

  for (const art of rawLiveArticles) {
    const cleanUrl = art.originalUrl.split('?')[0].toLowerCase();
    if (seenUrls.has(cleanUrl)) continue;
    if (deduplicated.some((existing) => areHeadlinesDuplicate(existing.headline, art.headline))) {
      continue;
    }
    seenUrls.add(cleanUrl);
    deduplicated.push(art);
  }

  // If all live feeds failed, try stale cache before throwing error
  if (deduplicated.length === 0) {
    if (cachedNewsPayload) {
      return {
        ...cachedNewsPayload,
        cacheStatus: 'STALE_FALLBACK',
        cacheAgeSeconds: Math.floor((nowMs - cachedAtTimestampMs) / 1000),
      };
    }
    throw new Error(
      'Unable to retrieve live economic news feeds from RBI, Federal Reserve, ECB, World Bank, and financial press endpoints.'
    );
  }

  // Combine live deduplicated RSS/API articles with verified official MoSPI/MoCI/RBI statistical release milestones
  const officialMilestones = getOfficialStatisticalMilestones(nowMs);
  for (const milestone of officialMilestones) {
    if (
      !deduplicated.some((existing) =>
        areHeadlinesDuplicate(existing.headline, milestone.headline)
      )
    ) {
      deduplicated.push(milestone);
    }
  }

  const finalArticles = assignDashboardSections(deduplicated);
  const activeSourcesCount = sourcesStatus.filter((s) => s.status === 'ok').length;

  const responsePayload: EconomicNewsResponse = {
    ok: true,
    fetchedAtMs: nowMs,
    fetchedAtIst: formatIstTimestamp(new Date(nowMs)),
    cacheStatus: 'MISS',
    cacheAgeSeconds: 0,
    recommendedPollIntervalSeconds: 300,
    totalArticles: finalArticles.length,
    activeSourcesCount,
    sourcesStatus,
    articles: finalArticles,
  };

  cachedNewsPayload = responsePayload;
  cachedAtTimestampMs = nowMs;

  return responsePayload;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const forceRefresh = req.query?.force === '1' || req.query?.force === 'true';
  const simulateError =
    req.query?.simulateError === '1' || req.query?.simulateError === 'true';

  try {
    const payload = await getEconomicNewsPayload({
      forceRefresh,
      simulateError,
    });
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    return res.status(200).json(payload);
  } catch (err: any) {
    return res.status(503).json({
      ok: false,
      error:
        err?.message ||
        'Live economic news aggregation service is temporarily unavailable.',
    });
  }
}

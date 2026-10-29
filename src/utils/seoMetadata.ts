import { PageId } from '../types/economy';

export interface PageSeoMetadata {
  pageId: PageId;
  title: string;
  description: string;
  canonicalHash: string;
}

export const PRODUCTION_BASE_URL = 'https://arthniti-six.vercel.app';

export const PAGE_SEO_REGISTRY: Record<PageId, PageSeoMetadata> = {
  overview: {
    pageId: 'overview',
    title: 'ArthNiti — Indian Economic Intelligence Platform',
    description:
      'Explore verified Indian macroeconomic indicators (MoSPI GDP, CPI, PLFS, RBI Repo, FBIL USD/INR, PPAC Crude, MoCI Trade), 3D trade globe, and live market indices.',
    canonicalHash: '',
  },
  'gdp-growth': {
    pageId: 'gdp-growth',
    title: 'India GDP Growth & National Accounts | ArthNiti',
    description:
      'Analyze official MoSPI Real and Nominal GDP growth (Base Year 2022–23), quarterly constant-price trajectories, implicit GDP deflator, and sector GVA shares.',
    canonicalHash: '#gdp-growth',
  },
  inflation: {
    pageId: 'inflation',
    title: 'India CPI Inflation & Price Stability | ArthNiti',
    description:
      'Track official MoSPI All-India Combined CPI Headline and Food Inflation (Base 2024=100) alongside RBI MPC 4% ± 2% tolerance band and core inflation.',
    canonicalHash: '#inflation',
  },
  'labour-market': {
    pageId: 'labour-market',
    title: 'India PLFS Unemployment & Labour Market | ArthNiti',
    description:
      'Inspect official MoSPI Periodic Labour Force Survey (PLFS) Current Weekly Status unemployment, LFPR, WPR, and Rural vs. Urban employment trends.',
    canonicalHash: '#labour-market',
  },
  'currency-oil': {
    pageId: 'currency-oil',
    title: 'External Sector: Trade Balance, Crude Oil & USD/INR | ArthNiti',
    description:
      'Examine India’s MoCI Merchandise Trade Balance (-$30.21B), PPAC Indian Basket Crude Oil ($116.09/bbl), and FBIL/RBI USD/INR Reference Exchange Rate.',
    canonicalHash: '#currency-oil',
  },
  'financial-markets': {
    pageId: 'financial-markets',
    title: 'Live Indian Stock Markets & RBI Monetary Policy | ArthNiti',
    description:
      'Monitor NIFTY 50, BSE SENSEX, BANK NIFTY, NIFTY IT, and NIFTY MIDCAP 100 alongside the RBI Policy Repo Rate (5.50%), SDF, and MSF monetary corridor.',
    canonicalHash: '#financial-markets',
  },
  'economic-news': {
    pageId: 'economic-news',
    title: 'Live Economic News & Policy Intelligence | ArthNiti',
    description:
      'Follow real-time institutional releases and macroeconomic news from the RBI, Federal Reserve, ECB, World Bank, and leading Indian financial publications.',
    canonicalHash: '#economic-news',
  },
  'economist-bites': {
    pageId: 'economist-bites',
    title: "Economists' Latest Bites & Verified Research | ArthNiti",
    description:
      'Read source-verified Quick Summaries of the latest speeches, working papers, and policy commentary from prominent Indian and global economists.',
    canonicalHash: '#economist-bites',
  },
  comparisons: {
    pageId: 'comparisons',
    title: 'Multi-Indicator Macroeconomic Comparison Engine | ArthNiti',
    description:
      'Compare Indian economic series across raw units, Z-score normalization, and Base-100 indexing with correlation diagnostics and CSV export.',
    canonicalHash: '#comparisons',
  },
  'data-sources': {
    pageId: 'data-sources',
    title: 'Methodology, Data Sources & Provenance Registry | ArthNiti',
    description:
      'Review ArthNiti’s data collection methodology, official statistical repositories (MoSPI, RBI, FBIL, PPAC, MoCI), update frequencies, and verification rules.',
    canonicalHash: '#data-sources',
  },
  about: {
    pageId: 'about',
    title: 'About ArthNiti — Purpose, Vision & Disclosures | ArthNiti',
    description:
      'Learn about ArthNiti’s mission to make Indian and global economic intelligence accessible, transparent, and verifiable for students and researchers.',
    canonicalHash: '#about',
  },
};

export function getPageSeoMetadata(pageId: PageId): PageSeoMetadata {
  return PAGE_SEO_REGISTRY[pageId] || PAGE_SEO_REGISTRY.overview;
}

export function syncPageSeoMetadata(pageId: PageId): void {
  if (typeof document === 'undefined') return;
  const meta = getPageSeoMetadata(pageId);
  document.title = meta.title;

  const setMetaContent = (selector: string, content: string) => {
    const el = document.querySelector<HTMLMetaElement>(selector);
    if (el) {
      el.setAttribute('content', content);
    }
  };

  const canonicalUrl = `${PRODUCTION_BASE_URL}/${meta.canonicalHash}`;

  setMetaContent('meta[name="description"]', meta.description);
  setMetaContent('meta[property="og:title"]', meta.title);
  setMetaContent('meta[property="og:description"]', meta.description);
  setMetaContent('meta[property="og:url"]', canonicalUrl);
  setMetaContent('meta[name="twitter:title"]', meta.title);
  setMetaContent('meta[name="twitter:description"]', meta.description);

  const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute('href', canonicalUrl);
  }
}

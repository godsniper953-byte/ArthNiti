import React from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Database,
  ExternalLink,
  Globe,
  GraduationCap,
  Layers,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { getServiceStatus } from '../services/economyService';
import { PageId } from '../types/economy';

interface AboutPageProps {
  theme: 'dark' | 'light';
  onSelectPage: (pageId: PageId, indicatorId?: string) => void;
}

const WHAT_WE_COVER_ITEMS: Array<{
  title: string;
  description: string;
  targetPage: PageId;
  linkLabel: string;
}> = [
  {
    title: 'Indian Macroeconomic Indicators & Policy Developments',
    description:
      'National output, price stability, labour force participation, merchandise trade balances, and central bank monetary policy decisions sourced from official Indian statistical releases.',
    targetPage: 'overview',
    linkLabel: 'Explore Macro Overview',
  },
  {
    title: 'Global Economic Trends & International Institutions',
    description:
      'Bilateral trade corridors across 22 sovereign partners and regional blocs, multilateral policy assessments from the IMF, World Bank, BIS, and OECD, and global spillovers to India.',
    targetPage: 'economic-news',
    linkLabel: 'Open Global & India News',
  },
  {
    title: 'Inflation, GDP Growth, Employment, Monetary Policy & Exchange Rates',
    description:
      'Dedicated analytical modules for MoSPI Real & Nominal GDP, CPI Inflation, PLFS Unemployment, RBI Policy Repo Rate corridors, FBIL USD/INR rates, and PPAC Crude Oil prices.',
    targetPage: 'gdp-growth',
    linkLabel: 'Inspect Indicator Modules',
  },
  {
    title: 'Indian & Global Financial Market Indicators',
    description:
      'Live delayed benchmark tracking for NIFTY 50, BSE SENSEX, BANK NIFTY, NIFTY IT, and NIFTY MIDCAP 100 alongside sovereign bond yields and international market context.',
    targetPage: 'financial-markets',
    linkLabel: 'View Financial Markets',
  },
  {
    title: 'Latest Research, Publications & Commentary from Prominent Economists',
    description:
      'Curated and live-discovered perspectives from leading Indian and global economists on growth, inflation, tariffs, fiscal sustainability, AI productivity, and structural reform.',
    targetPage: 'economist-bites',
    linkLabel: "Open Economists' Latest Bites",
  },
  {
    title: 'Concise Summaries Explaining Why Developments Matter',
    description:
      'Structured Quick Summaries (The Big Point, Why It Matters, Key Takeaway) and normalized multi-indicator comparisons that clarify macroeconomic transmission channels.',
    targetPage: 'comparisons',
    linkLabel: 'Open Comparison Workbench',
  },
];

const ARTHNITI_PRINCIPLES: Array<{
  name: string;
  summary: string;
}> = [
  {
    name: 'Accuracy',
    summary:
      'Prioritize verifiable information from official statistical releases, central bank publications, and primary research.',
  },
  {
    name: 'Transparency',
    summary:
      'Identify original sources, base years, units, reference periods, and publication vs. retrieval timestamps on every view.',
  },
  {
    name: 'Clarity',
    summary:
      'Make complex economic developments easier to understand through structured Quick Summaries and clean visual hierarchy.',
  },
  {
    name: 'Objectivity',
    summary:
      'Strictly distinguish observed statistical facts from reported commentary, analytical interpretation, and forecasts.',
  },
  {
    name: 'Accessibility',
    summary:
      'Present economic intelligence in a clear, responsive, keyboard-accessible format without paywalls or jargon barriers.',
  },
  {
    name: 'Continuous Improvement',
    summary:
      'Continuously refine indicator coverage, automated data validation, source verification, and usability over time.',
  },
];

const AUDIENCE_GROUPS: Array<{
  group: string;
  howItHelps: string;
}> = [
  {
    group: 'Students & Learners',
    howItHelps:
      'Connects textbook macroeconomic concepts—such as the GDP deflator, Repo corridor, CPI basket weights, and trade balances—directly to real Indian and global data.',
  },
  {
    group: 'Researchers & Policy Analysts',
    howItHelps:
      'Provides transparent source provenance, base-year documentation, multi-series Z-score/indexed comparisons, and direct links to primary working papers and central bank speeches.',
  },
  {
    group: 'Educators & Academic Seminars',
    howItHelps:
      'Offers ready-to-inspect visual charts, an interactive 3D global trade network, and balanced summaries of contrasting economic debates for classroom discussion.',
  },
  {
    group: 'Economics Enthusiasts & Informed Readers',
    howItHelps:
      'Delivers 5–10 second Quick Summaries on why policy rate shifts, crude oil movements, inflation prints, and global tariffs matter for households and markets.',
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ theme, onSelectPage }) => {
  const serviceStatus = getServiceStatus();

  const cardSurfaceClass =
    theme === 'dark'
      ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
      : 'bg-white border-slate-200 text-slate-900 shadow-xs';

  const subCardClass =
    theme === 'dark'
      ? 'bg-[#060B16]/90 border-slate-800/80 text-slate-200'
      : 'bg-slate-50 border-slate-200/90 text-slate-800';

  return (
    <div className="space-y-8">
      {/* 1. Editorial Hero — About ArthNiti */}
      <section className={`rounded-2xl border p-6 sm:p-8 space-y-5 ${cardSurfaceClass}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-emerald-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>ABOUT US · PURPOSE, VISION &amp; EDITORIAL CHARTER</span>
        </div>

        <div className="space-y-3 max-w-4xl">
          <h1
            className={`font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            About ArthNiti
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
            }`}
          >
            ArthNiti is an economic intelligence platform designed to make economic data, policy developments, financial indicators, and global economic trends easier to understand. It brings together key information on the Indian economy and the wider global economy in one accessible digital experience.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            By organizing important indicators, providing concise summaries, and highlighting research and commentary from economists, ArthNiti aims to help students, researchers, and curious readers explore the forces shaping economic outcomes.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectPage('data-sources')}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Read Methodology &amp; Data Sources</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPage('economist-bites')}
            className="px-4 py-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Explore Economists&apos; Latest Bites</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPage('overview')}
            className={`px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-2 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#060B16] border-slate-700 text-slate-200 hover:border-slate-600'
                : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Return to Overview Dashboard</span>
          </button>
        </div>
      </section>

      {/* 2. Our Mission & Our Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className={`rounded-xl border p-6 space-y-3 ${cardSurfaceClass}`}>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <Target className="w-4 h-4" />
            <span>OUR MISSION</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-semibold">Our Mission</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            To make economic information more accessible, understandable, and useful through clear presentation, transparent sourcing, and evidence-based analysis.
          </p>
        </section>

        <section className={`rounded-xl border p-6 space-y-3 ${cardSurfaceClass}`}>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-amber-400">
            <Globe className="w-4 h-4" />
            <span>OUR VISION</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-semibold">Our Vision</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            To build a reliable and accessible platform that encourages informed economic thinking and strengthens public understanding of India&apos;s economy and its relationship with the global economic system.
          </p>
        </section>
      </div>

      {/* 3. What We Cover */}
      <section className={`rounded-xl border p-6 space-y-5 ${cardSurfaceClass}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-cyan-400">
            <Layers className="w-4 h-4" />
            <span>SCOPE OF COVERAGE</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-semibold">What We Cover</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            ArthNiti integrates six core pillars of Indian and global economic intelligence:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {WHAT_WE_COVER_ITEMS.map((item) => (
            <div
              key={item.title}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${subCardClass}`}
            >
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectPage(item.targetPage)}
                className="inline-flex items-center gap-1 text-xs font-mono-tabular text-emerald-400 hover:text-emerald-300 self-start cursor-pointer"
              >
                <span>{item.linkLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Our Principles */}
      <section className={`rounded-xl border p-6 space-y-5 ${cardSurfaceClass}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>CORE VALUES &amp; STANDARDS</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-semibold">Our Principles</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Six foundational commitments guide how every dataset, chart, and summary is built on ArthNiti:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ARTHNITI_PRINCIPLES.map((principle) => (
            <div
              key={principle.name}
              className={`p-4 rounded-xl border space-y-1.5 ${subCardClass}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <h3 className="text-sm font-semibold text-white">{principle.name}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{principle.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Who Is ArthNiti For? & Documentation Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className={`lg:col-span-7 rounded-xl border p-6 space-y-4 ${cardSurfaceClass}`}>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-amber-400">
            <Users className="w-4 h-4" />
            <span>READERSHIP &amp; EDUCATIONAL VALUE</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-semibold">
            Who Is ArthNiti For?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Students, economics enthusiasts, researchers, educators, and readers seeking a clearer understanding of Indian and global economic developments.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {AUDIENCE_GROUPS.map((aud) => (
              <div key={aud.group} className={`p-3.5 rounded-lg border space-y-1 ${subCardClass}`}>
                <div className="text-xs font-semibold text-emerald-400">{aud.group}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{aud.howItHelps}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Primary Institutional Documentation & Architecture Links */}
        <section className={`lg:col-span-5 rounded-xl border p-6 flex flex-col justify-between space-y-4 ${cardSurfaceClass}`}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-cyan-400">
              <Database className="w-4 h-4" />
              <span>VERIFIED ARCHITECTURE &amp; OFFICIAL REPOSITORIES</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold">
              Direct Links to Original Statistical Repositories
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              ArthNiti encourages readers to consult primary institutional releases alongside platform visualizations. Current service mode:{' '}
              <span className="font-mono-tabular text-emerald-400">
                {serviceStatus.mode === 'live_api'
                  ? 'External API Connected'
                  : '7 Official Macro CSVs + 3 Live Server Endpoints'}
              </span>
              .
            </p>

            <div className={`p-3.5 rounded-lg border space-y-2 text-xs ${subCardClass}`}>
              <a
                href="https://mospi.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <span>MoSPI &amp; National Statistical Office (NSO)</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <a
                href="https://dbie.rbihub.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <span>Reserve Bank of India — DBIE Data Warehouse</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <a
                href="https://tradestat.commerce.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <span>Ministry of Commerce — TRADESTAT Portal</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <a
                href="https://ppac.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <span>Petroleum Planning &amp; Analysis Cell (PPAC)</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <a
                href="https://www.imf.org/en/Publications/WEO"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <span>IMF World Economic Outlook &amp; Research</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <a
                href="https://www.worldbank.org/en/research"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-slate-300 hover:text-emerald-400 transition-colors"
              >
                <span>World Bank Development Economics Research</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectPage('data-sources')}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Inspect Full Methodology &amp; Indicator Registry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </div>

      {/* 6. Legal, Privacy, Third-Party Services & Financial-Information Disclosures */}
      <section
        aria-label="Legal, Privacy, and Financial Information Disclosures"
        className={`rounded-xl border p-6 space-y-5 ${cardSurfaceClass}`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>TRUST, PRIVACY &amp; REGULATORY TRANSPARENCY</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-semibold">
            Data Governance, Privacy &amp; Financial-Information Limitations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Transparent disclosure of how ArthNiti handles public statistical sources, third-party feeds, browser storage, and analytical content:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className={`p-4 rounded-xl border space-y-1.5 ${subCardClass}`}>
            <h3 className="text-sm font-semibold text-white">1. Data Sources &amp; Attribution</h3>
            <p className="text-slate-400">
              Core Indian macroeconomic indicators are compiled from official public releases by the Ministry of Statistics and Programme Implementation (MoSPI / NSO), Reserve Bank of India (RBI DBIE), Financial Benchmarks India Pvt. Ltd. (FBIL), Petroleum Planning &amp; Analysis Cell (PPAC), and Ministry of Commerce &amp; Industry (TRADESTAT). Research bites link directly to original speeches, working papers, and institutional reports (RBI, IMF, World Bank, BIS, Federal Reserve, NBER, PIIE, Bruegel). ArthNiti is an independent educational platform and is not affiliated with or endorsed by these institutions.
            </p>
          </div>

          <div className={`p-4 rounded-xl border space-y-1.5 ${subCardClass}`}>
            <h3 className="text-sm font-semibold text-white">2. Third-Party Services &amp; Exchange Feeds</h3>
            <p className="text-slate-400">
              Indian equity benchmark indices (NIFTY 50, BSE SENSEX, BANK NIFTY, NIFTY IT, NIFTY MIDCAP 100), live economic news headlines, and economist RSS feeds are fetched via ArthNiti&apos;s server-side proxy endpoints (<span className="font-mono-tabular">/api/market-indices</span>, <span className="font-mono-tabular">/api/economic-news</span>, <span className="font-mono-tabular">/api/economist-bites</span>). Upstream market quotes are retrieved from public exchange feed aggregators (Yahoo Finance v8 / optional Twelve Data) and carry an inherent 1–5 minute exchange dissemination delay.
            </p>
          </div>

          <div className={`p-4 rounded-xl border space-y-1.5 ${subCardClass}`}>
            <h3 className="text-sm font-semibold text-white">3. Privacy, Cookies &amp; Local Browser Storage</h3>
            <p className="text-slate-400">
              ArthNiti does <strong>not</strong> require user registration, does <strong>not</strong> collect personal information, and sets <strong>zero</strong> third-party advertising or behavioral tracking cookies. The application uses standard browser <span className="font-mono-tabular">localStorage</span> solely on your device to remember your display theme (<span className="font-mono-tabular">arthniti_theme</span>), sidebar layout (<span className="font-mono-tabular">arthniti_sidebar_collapsed</span>, <span className="font-mono-tabular">arthniti_sidebar_groups</span>), and any optional custom CSV datasets you upload locally for inspection.
            </p>
          </div>

          <div className={`p-4 rounded-xl border space-y-1.5 ${subCardClass}`}>
            <h3 className="text-sm font-semibold text-white">4. Financial-Information &amp; Non-Advisory Notice</h3>
            <p className="text-slate-400">
              All data, charts, Quick Summaries, and Economist Bites on ArthNiti are provided strictly for academic, educational, and informational purposes. Nothing on this website constitutes financial, investment, trading, legal, or tax advice. Users should verify primary institutional publications before making financial or policy decisions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

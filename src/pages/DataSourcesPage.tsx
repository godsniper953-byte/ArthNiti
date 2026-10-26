import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { DataSourceMetadata } from '../types/economy';
import { getStructuredIndicatorRegistrySync } from '../services/economyService';

interface DataSourcesPageProps {
  sources: DataSourceMetadata[];
  theme: 'dark' | 'light';
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({ sources, theme }) => {
  const [filterText, setFilterText] = useState<string>('');
  const indicatorRegistry = useMemo(() => getStructuredIndicatorRegistrySync(), []);

  const filteredSources = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(filterText.toLowerCase()) ||
      s.shortName.toLowerCase().includes(filterText.toLowerCase()) ||
      s.primaryIndicators.some((ind) => ind.toLowerCase().includes(filterText.toLowerCase()))
  );

  const filteredRegistry = indicatorRegistry.filter((entry) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      entry.indicatorId.toLowerCase().includes(q) ||
      entry.displayName.toLowerCase().includes(q) ||
      entry.provider.toLowerCase().includes(q) ||
      entry.unit.toLowerCase().includes(q) ||
      entry.referencePeriod.toLowerCase().includes(q) ||
      entry.methodologicalNotes.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            <span>Data Provenance &amp; Statistical Standards</span>
          </div>
          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            Official Data Sources &amp; Methodology
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Complete directory of institutional data repositories, indicator-level provenance registry, reporting frequencies, base years, release lags, and known statistical limitations governing Indian macroeconomic data.
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter sources or indicators..."
            aria-label="Filter data sources"
            className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border focus:outline-2 focus:outline-emerald-500 ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-800 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Provenance Disclosure Banner */}
      <div
        className={`rounded-xl border p-5 ${
          theme === 'dark'
            ? 'bg-emerald-950/15 border-emerald-500/30 text-slate-200'
            : 'bg-emerald-50 border-emerald-200 text-slate-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <div className="font-semibold text-sm text-emerald-400">
              Data Provenance Disclosure — 7 Official Macro Datasets + Live Market &amp; News Intelligence
            </div>
            <p>
              <strong>Real GDP Growth (MoSPI Base 2022–23)</strong>, <strong>All-India Combined CPI Inflation (MoSPI Base 2024 = 100)</strong>, <strong>All-India Unemployment Rate (MoSPI Monthly PLFS, CWS Age 15+: 5.0%)</strong>, <strong>India Merchandise Trade Balance (MoCI / DGCI&amp;S &amp; RBI DBIE: Exports $44.40B, Imports $74.61B, Signed Balance -$30.21B / Deficit $30.21B in Sep 2026)</strong>, <strong>USD/INR Official Reference Rate (FBIL / RBI DBIE: ₹94.6986 per 1 USD)</strong>, <strong>Indian Basket Crude Oil Price (PPAC: $116.09/bbl Sep 2026 Completed Avg; $119.99/bbl on 22 Oct 2026)</strong>, and the <strong>RBI Policy Repo Rate (Official MPC: 5.50%)</strong> are powered by verified official datasets with zero-code browser CSV updaters. Live NSE/BSE market indices (<code className="font-mono-tabular">/api/market-indices</code>) and 10-feed Economic News (<code className="font-mono-tabular">/api/economic-news</code>) are retrieved via server-side proxies with strict stale-cache labelling.
            </p>
          </div>
        </div>
      </div>

      {/* Structured Indicator Source Registry Table (Academic & Departmental Audit View) */}
      <section
        aria-label="Structured Indicator Source Registry"
        className={`rounded-xl border overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="p-5 sm:p-6 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Indicator-Level Provenance &amp; Freshness Audit Matrix</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold mt-0.5">
              Structured Indicator Source Registry ({filteredRegistry.length} / {indicatorRegistry.length} Domains)
            </h2>
          </div>
          <span className="text-xs font-mono-tabular text-slate-400">
            Publication Time ≠ Retrieval Time Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className={`border-b font-mono-tabular text-[11px] uppercase tracking-wider ${
                  theme === 'dark'
                    ? 'bg-[#060B16] border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <th className="py-3 px-4">Indicator &amp; ID</th>
                <th className="py-3 px-4">Provider &amp; Retrieval</th>
                <th className="py-3 px-4">Unit &amp; Definition</th>
                <th className="py-3 px-4">Ref Period &amp; Pub Date</th>
                <th className="py-3 px-4">Frequency &amp; Threshold</th>
                <th className="py-3 px-4">Methodological Safeguards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRegistry.map((row) => (
                <tr
                  key={row.indicatorId}
                  className={
                    theme === 'dark' ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/80'
                  }
                >
                  <td className="py-3.5 px-4 align-top min-w-[190px]">
                    <div className="font-semibold text-emerald-400">{row.displayName}</div>
                    <div className="font-mono-tabular text-[11px] text-slate-400 mt-0.5">
                      ID: {row.indicatorId}
                    </div>
                    <div className="mt-1">
                      <span className="inline-block font-mono-tabular text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                        {row.dataStatus === 'verified_official_csv'
                          ? 'Verified Official CSV'
                          : row.dataStatus === 'live_exchange_api_proxy'
                          ? 'Live Server Exchange Proxy'
                          : 'Live Server RSS/JSON Engine'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top min-w-[210px]">
                    <div className="font-medium">{row.provider}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{row.retrievalMethod}</div>
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono-tabular text-amber-400 hover:underline mt-1"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3.5 px-4 align-top font-mono-tabular min-w-[180px]">
                    {row.unit}
                  </td>
                  <td className="py-3.5 px-4 align-top min-w-[175px]">
                    <div className="font-mono-tabular font-medium text-cyan-400">
                      {row.referencePeriod}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Published: {row.publicationTimestamp}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top min-w-[165px]">
                    <div className="font-mono-tabular">{row.expectedUpdateFrequency}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Freshness: {row.freshnessThreshold}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top text-slate-400 leading-relaxed min-w-[260px]">
                    {row.methodologicalNotes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Source Cards Directory */}
      {filteredSources.length === 0 ? (
        <div
          className={`rounded-xl border p-8 text-center space-y-3 ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800 text-slate-300'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <div className="text-sm font-semibold">
            No Data Sources Matching &ldquo;{filterText}&rdquo;
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try searching for MoSPI, MoCI, TRADESTAT, RBI, PLFS, PPAC, NSE, GDP, or CPI.
          </p>
          <button
            type="button"
            onClick={() => setFilterText('')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredSources.map((src) => (
            <article
              key={src.id}
              className={`rounded-xl border p-5 sm:p-6 transition-colors ${
                theme === 'dark'
                  ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
                <div>
                  <div className="flex items-center gap-2 text-xs text-emerald-500 font-mono-tabular">
                    <span>{src.shortName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{src.ministryOrBody}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold mt-0.5">{src.name}</h2>
                </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <a
                  href={src.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-amber-500 hover:text-amber-400"
                >
                  <span>{src.officialUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {src.secondaryUrl && (
                  <a
                    href={src.secondaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-emerald-500 hover:text-emerald-400"
                  >
                    <span>
                      {src.id === 'rbi-dbie'
                        ? 'RBI DBIE Portal'
                        : src.id === 'moci-tradestat'
                        ? 'TRADESTAT Portal'
                        : src.id === 'ppac-mopng'
                        ? 'PPAC Main Portal'
                        : 'eSankhyiki Catalogue'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {src.id === 'moci-tradestat' && (
                  <a
                    href="https://dbie.rbihub.in/external?table=external_sector.r18_foreign_trade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                  >
                    <span>RBI DBIE Foreign Trade (Table r18)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {src.id === 'mospi-nso' && (
                  <a
                    href="https://mospi.gov.in/faq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                  >
                    <span>MoSPI Methodology FAQ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {src.id === 'rbi-dbie' && (
                  <>
                    <a
                      href="https://www.fbil.org.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-emerald-400 hover:text-emerald-300"
                    >
                      <span>FBIL Official (fbil.org.in)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="https://www.rbi.org.in/Scripts/MPView.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                    >
                      <span>RBI MPC Statements</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
                {src.id === 'plfs-mospi' && (
                  <a
                    href="https://mospi.gov.in/latest-releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                  >
                    <span>MoSPI Latest Releases</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-xs">
                <div
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-slate-400 text-[11px]">Units &amp; Base Year</div>
                  <div className="font-mono-tabular font-medium mt-1">{src.unitsAndBaseYear}</div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-slate-400 text-[11px]">Reporting Frequency &amp; Lag</div>
                  <div className="font-mono-tabular font-medium mt-1">
                    {src.frequency} ({src.dataFreshnessLag})
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-500" />
                    <span>Coverage Window</span>
                  </div>
                  <div className="font-mono-tabular font-medium text-cyan-500 mt-1">
                    {src.coverageDates}
                  </div>
                </div>
              </div>

              {/* Methodology & Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs pt-2">
                <div className="lg:col-span-7 space-y-2">
                  <div className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    Methodology &amp; Compilation
                  </div>
                  <p className="text-slate-400 leading-relaxed">{src.methodologySummary}</p>

                  <div className="pt-2">
                    <span className="text-slate-400">Primary Indicators Covered: </span>
                    <span className="font-mono-tabular text-emerald-500">
                      {src.primaryIndicators.join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-2">
                  <div className="font-semibold text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Known Statistical Limitations</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-400 leading-relaxed">
                    {src.knownLimitations.map((lim, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

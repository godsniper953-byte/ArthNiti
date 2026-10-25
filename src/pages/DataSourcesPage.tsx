import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Search,
} from 'lucide-react';
import { DataSourceMetadata } from '../types/economy';

interface DataSourcesPageProps {
  sources: DataSourceMetadata[];
  theme: 'dark' | 'light';
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({ sources, theme }) => {
  const [filterText, setFilterText] = useState<string>('');

  const filteredSources = sources.filter(
    (s) =>
      s.name.toLowerCase().includes(filterText.toLowerCase()) ||
      s.shortName.toLowerCase().includes(filterText.toLowerCase()) ||
      s.primaryIndicators.some((ind) => ind.toLowerCase().includes(filterText.toLowerCase()))
  );

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
            Complete directory of institutional data repositories, reporting frequencies, base years, release lags, and known statistical limitations governing Indian macroeconomic data.
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

      {/* Illustrative Development Data Notice */}
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
              Data Provenance Disclosure — Official MoSPI GDP, CPI &amp; PLFS + Official RBI Repo Rate
            </div>
            <p>
              <strong>Real GDP Growth (MoSPI Base 2022–23)</strong>, <strong>All-India Combined CPI Inflation (MoSPI Base 2024 = 100)</strong>, <strong>All-India Unemployment Rate (MoSPI Monthly PLFS, CWS Age 15+: 5.0% in Sep 2026)</strong>, and the <strong>RBI Policy Repo Rate (Official MPC: 5.50%, effective 07 Oct 2026)</strong> are powered by verified official datasets (<code className="font-mono-tabular">/data/mospi_gdp_official.csv</code>, <code className="font-mono-tabular">/data/mospi_cpi_official.csv</code>, <code className="font-mono-tabular">/data/mospi_plfs_official.csv</code>, and <code className="font-mono-tabular">/data/rbi_repo_official.csv</code>) with zero-code browser CSV updaters. The remaining 3 indicators use clearly labelled illustrative series.
            </p>
          </div>
        </div>
      </div>

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
            Try searching for MoSPI, RBI, PLFS, PPAC, NSE, GDP, or CPI.
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
                    <span>{src.id === 'rbi-dbie' ? 'RBI DBIE Portal' : 'eSankhyiki Catalogue'}</span>
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
                  <a
                    href="https://www.rbi.org.in/Scripts/MPView.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-cyan-400 hover:text-cyan-300"
                  >
                    <span>RBI MPC Statements</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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

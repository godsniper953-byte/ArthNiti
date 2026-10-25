import React, { useState } from 'react';
import { BookOpen, Briefcase, CheckCircle2, Info, Users } from 'lucide-react';
import { EconomicIndicator } from '../types/economy';
import { AnalyticalChartPanel } from '../components/charts/AnalyticalChartPanel';

interface LabourMarketPageProps {
  indicator: EconomicIndicator;
  theme: 'dark' | 'light';
}

export const LabourMarketPage: React.FC<LabourMarketPageProps> = ({ indicator, theme }) => {
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'ur' | 'lfpr'>('all');
  const latest = indicator.observations[indicator.observations.length - 1];

  const seriesConfig =
    selectedMetric === 'ur'
      ? [{ key: 'value' as const, name: 'Unemployment Rate (%)', color: '#10b981' }]
      : selectedMetric === 'lfpr'
      ? [
          { key: 'secondaryValue' as const, name: 'Labour Force Participation Rate LFPR (%)', color: '#f59e0b' },
          { key: 'tertiaryValue' as const, name: 'Worker Population Ratio WPR (%)', color: '#06b6d4' },
        ]
      : [
          { key: 'value' as const, name: 'Unemployment Rate (%)', color: '#10b981' },
          { key: 'secondaryValue' as const, name: 'LFPR (%)', color: '#f59e0b' },
          { key: 'tertiaryValue' as const, name: 'WPR (%)', color: '#06b6d4' },
        ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <span>Periodic Labour Force Survey (PLFS)</span>
            <span aria-hidden="true">·</span>
            <span>NSSO · MoSPI</span>
            <span aria-hidden="true">·</span>
            <span>Age 15+ Cohort</span>
          </div>
          <h1
            className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-950'
            }`}
          >
            Labour Market &amp; Workforce Participation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Examine India&apos;s Unemployment Rate (UR), Labour Force Participation Rate (LFPR), and Worker Population Ratio (WPR) alongside official NSSO survey definitions.
          </p>
        </div>

        {/* Metric Focus Filter */}
        <div
          className={`flex items-center p-1 rounded-lg border self-start md:self-auto ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {[
            { id: 'all', label: 'All PLFS Series' },
            { id: 'ur', label: 'Unemployment Only' },
            { id: 'lfpr', label: 'LFPR & WPR' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMetric(m.id as 'all' | 'ur' | 'lfpr')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedMetric === m.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Headline PLFS Trio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Unemployment Rate (UR · {latest.label})</div>
          <div className="font-mono-tabular text-2xl font-semibold text-emerald-400 mt-1">
            {latest.value.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Share of active labour force seeking work
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Labour Force Participation (LFPR)</div>
          <div className="font-mono-tabular text-2xl font-semibold text-amber-400 mt-1">
            {(latest.secondaryValue || 60.4).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Working or actively seeking work (Age 15+)
          </div>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="text-xs text-slate-400">Worker Population Ratio (WPR)</div>
          <div className="font-mono-tabular text-2xl font-semibold text-cyan-400 mt-1">
            {(latest.tertiaryValue || 58.1).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Employed persons per 100 population (Age 15+)
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <AnalyticalChartPanel
        title="PLFS Labour Force Indicators (2017–2026)"
        subtitle="Quarterly trajectory of Unemployment Rate, Labour Force Participation Rate (LFPR), and Worker Population Ratio (WPR)"
        unit="%"
        sourceLabel="PLFS · NSSO (MoSPI)"
        frequencyLabel="Quarterly"
        observations={indicator.observations}
        seriesConfig={seriesConfig}
        defaultChartType="line"
        defaultRange="10Y"
        theme={theme}
      />

      {/* Survey Definitions, Coverage & Methodology Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Survey Definitions: Usual Status vs CWS (7 cols) */}
        <div
          className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
            <Users className="w-4 h-4" />
            <span>Survey Definitions &amp; Measurement Frameworks</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            Usual Status (ps+ss) vs. Current Weekly Status (CWS)
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Interpreting Indian employment data requires distinguishing between the reference time windows used by the National Sample Survey Office (NSSO):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div
              className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-emerald-400 mb-1.5">
                1. Usual Status (Principal + Subsidiary)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses a <strong>365-day reference period</strong> preceding the survey date. A person is classified as working if they engaged in economic activity for a majority of the year (Principal Status) or for at least 30 days during the year (Subsidiary Status).
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-amber-400 mb-1.5">
                2. Current Weekly Status (CWS)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses a shorter <strong>7-day reference window</strong> prior to the interview. A person is considered employed if they worked for at least <strong>1 hour on any day</strong> during the reference week. CWS captures high-frequency urban and seasonal fluctuations.
              </p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-lg border text-xs ${
              theme === 'dark' ? 'bg-[#060B16]/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="font-semibold text-cyan-400 mb-1">
              Why must Unemployment Rate always be read alongside LFPR?
            </div>
            <p className="text-slate-400 leading-relaxed">
              A falling Unemployment Rate can occur either because more people found jobs (rising WPR and LFPR) or because discouraged workers exited the labour force altogether (falling LFPR). In the 2022–2026 period, falling unemployment coincided with rising LFPR (from 54.1% to 60.4%), confirming genuine workforce absorption.
            </p>
          </div>
        </div>

        {/* Coverage & Known Analytical Nuances (5 cols) */}
        <div
          className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 flex flex-col justify-between space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
              <Briefcase className="w-4 h-4" />
              <span>Coverage &amp; Structural Nuances</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold">
              Methodological Scope &amp; Limitations
            </h2>

            <ul className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                    Age Cohort Standardization:
                  </strong>{' '}
                  All ArthNiti series report the 15-years-and-above cohort, aligning with international ILO comparability standards.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                    Self-Employment &amp; Unpaid Family Work:
                  </strong>{' '}
                  PLFS counts self-employed workers and helpers in household enterprises as employed. Analysts also track formal payroll additions (EPFO) to assess salaried job quality.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                    Female LFPR Expansion:
                  </strong>{' '}
                  Rural female labour force participation has been the primary contributor to India&apos;s aggregate LFPR rise since 2019.
                </span>
              </li>
            </ul>
          </div>

          <div
            className={`pt-4 border-t text-xs text-slate-400 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Source Reference</span>
            </div>
            <p className="leading-relaxed">
              National Sample Survey Office (NSSO), Ministry of Statistics and Programme Implementation (MoSPI), Quarterly Bulletins &amp; Annual PLFS Reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

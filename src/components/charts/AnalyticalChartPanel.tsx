import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Download,
  Inbox,
  LineChart as LineChartIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  ChartDisplayType,
  DateRangeFilter,
  ObservationPoint,
} from '../../types/economy';
import {
  computeSeriesStats,
  exportObservationsToCsv,
  filterObservationsByRange,
} from '../../services/economyService';

interface SeriesConfig {
  key:
    | 'value'
    | 'secondaryValue'
    | 'tertiaryValue'
    | 'ruralUrPct'
    | 'urbanUrPct'
    | 'lfprCwsPct'
    | 'wprCwsPct'
    | 'merchandiseExportsUsdBn'
    | 'merchandiseImportsUsdBn'
    | 'tradeBalanceUsdBn'
    | 'tradeDeficitMagnitudeUsdBn'
    | 'exportsYoYPct'
    | 'importsYoYPct';
  name: string;
  color: string;
  unit?: string;
}

interface AnalyticalChartPanelProps {
  title: string;
  subtitle: string;
  unit: string;
  sourceLabel: string;
  frequencyLabel: string;
  observations: ObservationPoint[];
  seriesConfig?: SeriesConfig[];
  defaultChartType?: ChartDisplayType;
  defaultRange?: DateRangeFilter;
  referenceBand?: {
    y1: number;
    y2: number;
    label: string;
  };
  zeroReferenceLine?: boolean;
  theme: 'dark' | 'light';
}

type SimulatedViewState = 'populated' | 'loading' | 'empty' | 'error';

export const AnalyticalChartPanel: React.FC<AnalyticalChartPanelProps> = ({
  title,
  subtitle,
  unit,
  sourceLabel,
  frequencyLabel,
  observations,
  seriesConfig = [{ key: 'value', name: title, color: '#10b981' }],
  defaultChartType = 'area',
  defaultRange = '10Y',
  referenceBand,
  zeroReferenceLine = false,
  theme,
}) => {
  const [dateRange, setDateRange] = useState<DateRangeFilter>(defaultRange);
  const [chartType, setChartType] = useState<ChartDisplayType>(defaultChartType);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [exportConfirmed, setExportConfirmed] = useState<boolean>(false);
  const [viewState, setViewState] = useState<SimulatedViewState>('populated');

  // Close fullscreen modal on Escape key
  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);

  const filteredData = useMemo(
    () => filterObservationsByRange(observations, dateRange),
    [observations, dateRange]
  );

  const stats = useMemo(() => computeSeriesStats(filteredData), [filteredData]);

  const handleExportCsv = () => {
    exportObservationsToCsv(
      title,
      unit,
      sourceLabel,
      filteredData,
      seriesConfig[1]?.name,
      seriesConfig[2]?.name
    );
    setExportConfirmed(true);
    window.setTimeout(() => setExportConfirmed(false), 2200);
  };

  const gridStroke = theme === 'dark' ? '#1e293b' : '#e2e8f0';
  const axisTickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload || !payload.length) return null;
    const point: ObservationPoint = payload[0].payload;
    return (
      <div
        className={`rounded-lg p-3 border shadow-xl text-xs max-w-xs ${
          theme === 'dark'
            ? 'bg-[#060B16]/95 border-slate-700 text-slate-100'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-4 pb-1.5 mb-1.5 border-b border-slate-700/50">
          <span className="font-mono-tabular font-semibold">{point.label}</span>
          <span className="text-[11px] text-slate-400">{point.status}</span>
        </div>
        <div className="space-y-1">
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-mono-tabular font-semibold" style={{ color: entry.color }}>
                {Number(entry.value).toLocaleString('en-IN')} {unit}
              </span>
            </div>
          ))}
        </div>
        {point.note && (
          <p className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] text-amber-400 leading-snug">
            {point.note}
          </p>
        )}
        <div className="mt-1.5 text-[10px] text-slate-400">
          Source: {sourceLabel} · {frequencyLabel}
        </div>
      </div>
    );
  };

  const renderChartBody = (heightPx: number) => {
    if (viewState === 'loading') {
      return (
        <div
          style={{ height: heightPx }}
          className="w-full flex flex-col justify-between p-4 rounded-lg border border-dashed border-slate-800 animate-pulse"
          role="status"
          aria-label="Loading economic time series"
        >
          <div className="h-4 w-48 bg-slate-800 rounded" />
          <div className="flex items-end gap-3 h-48">
            {[45, 62, 58, 75, 40, 68, 82, 74, 88, 79, 91, 85].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 bg-slate-800/70 rounded-t"
              />
            ))}
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
          </div>
        </div>
      );
    }

    if (viewState === 'error') {
      return (
        <div
          style={{ height: heightPx }}
          className="w-full flex flex-col items-center justify-center text-center p-6 rounded-lg border border-red-500/30 bg-red-950/10"
          role="alert"
        >
          <AlertTriangle className="w-7 h-7 text-red-400 mb-2" />
          <h4 className="text-sm font-semibold text-slate-200">
            Unable to Retrieve Upstream Time-Series
          </h4>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            The configured FastAPI endpoint did not respond within the timeout window. You can restore the verified local illustrative dataset immediately.
          </p>
          <button
            type="button"
            onClick={() => setViewState('populated')}
            className="mt-3 px-3.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore Illustrative Dataset</span>
          </button>
        </div>
      );
    }

    if (viewState === 'empty' || filteredData.length === 0) {
      return (
        <div
          style={{ height: heightPx }}
          className="w-full flex flex-col items-center justify-center text-center p-6 rounded-lg border border-slate-800"
        >
          <Inbox className="w-7 h-7 text-slate-400 mb-2" />
          <h4 className="text-sm font-semibold text-slate-200">
            No Observations in Selected Window
          </h4>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            No official observations match the current filter criteria. Reset the historical window to 10Y to inspect the complete macroeconomic series.
          </p>
          <button
            type="button"
            onClick={() => {
              setDateRange('10Y');
              setViewState('populated');
            }}
            className="mt-3 px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors cursor-pointer"
          >
            Reset to 10-Year Series
          </button>
        </div>
      );
    }

    return (
      <div style={{ height: heightPx }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={filteredData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                {seriesConfig.map((s) => (
                  <linearGradient key={s.key} id={`grad-${s.key}-${title.length}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeDasharray: '3 3' }} />
              {seriesConfig.length > 1 && (
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              )}
              {referenceBand && (
                <ReferenceArea
                  y1={referenceBand.y1}
                  y2={referenceBand.y2}
                  fill="#10b981"
                  fillOpacity={0.07}
                  stroke="#10b981"
                  strokeOpacity={0.25}
                  strokeDasharray="3 3"
                />
              )}
              {zeroReferenceLine && (
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              )}
              {seriesConfig.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.key}-${title.length})`}
                  animationDuration={350}
                />
              ))}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={filteredData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeDasharray: '3 3' }} />
              {seriesConfig.length > 1 && (
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              )}
              {referenceBand && (
                <ReferenceArea
                  y1={referenceBand.y1}
                  y2={referenceBand.y2}
                  fill="#10b981"
                  fillOpacity={0.07}
                  stroke="#10b981"
                  strokeOpacity={0.25}
                  strokeDasharray="3 3"
                />
              )}
              {zeroReferenceLine && (
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              )}
              {seriesConfig.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2.2}
                  dot={{ r: 2.5, fill: s.color }}
                  activeDot={{ r: 5 }}
                  animationDuration={350}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={filteredData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: axisTickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              {seriesConfig.length > 1 && (
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              )}
              {zeroReferenceLine && (
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              )}
              {seriesConfig.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={s.color}
                  radius={[3, 3, 0, 0]}
                  animationDuration={350}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const panelContent = (isModal: boolean) => (
    <div
      className={`rounded-xl border p-5 sm:p-6 transition-colors ${
        theme === 'dark'
          ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      } ${isModal ? 'w-full max-w-6xl mx-auto my-auto' : ''}`}
    >
      {/* Header + Chart Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-emerald-400">{sourceLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{frequencyLabel}</span>
            <span aria-hidden="true">·</span>
            <span>Unit: {unit}</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mt-1 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Interactive Chart Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Filter */}
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
            role="group"
            aria-label="Historical period selection"
          >
            {(['1Y', '3Y', '5Y', '10Y', 'MAX'] as DateRangeFilter[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 text-xs font-mono-tabular font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  dateRange === r
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart Type Switcher */}
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
            role="group"
            aria-label="Chart visualization type"
          >
            <button
              type="button"
              onClick={() => setChartType('area')}
              title="Area chart"
              className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                chartType === 'area' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              title="Line chart"
              className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                chartType === 'line' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Line</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Bar chart"
              className={`px-2 py-1 text-xs rounded-md flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                chartType === 'bar' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bar</span>
            </button>
          </div>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              exportConfirmed
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                : theme === 'dark'
                ? 'bg-[#060B16] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {exportConfirmed ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV Saved</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </>
            )}
          </button>

          {/* Expand / Collapse Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isModal ? 'Exit expanded view' : 'Expand chart view'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#060B16] border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isModal ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Period Summary Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs">
        <div className={theme === 'dark' ? 'bg-[#060B16]/70 p-2.5 rounded-lg border border-slate-800/80' : 'bg-slate-50 p-2.5 rounded-lg border border-slate-200/80'}>
          <div className="text-slate-400 text-[11px]">Latest Observation</div>
          <div className="font-mono-tabular font-semibold text-sm mt-0.5">
            {stats.latest} <span className="text-xs font-normal text-slate-400">{unit}</span>
          </div>
        </div>
        <div className={theme === 'dark' ? 'bg-[#060B16]/70 p-2.5 rounded-lg border border-slate-800/80' : 'bg-slate-50 p-2.5 rounded-lg border border-slate-200/80'}>
          <div className="text-slate-400 text-[11px]">Period Average ({dateRange})</div>
          <div className="font-mono-tabular font-semibold text-sm mt-0.5">
            {stats.mean} <span className="text-xs font-normal text-slate-400">{unit}</span>
          </div>
        </div>
        <div className={theme === 'dark' ? 'bg-[#060B16]/70 p-2.5 rounded-lg border border-slate-800/80' : 'bg-slate-50 p-2.5 rounded-lg border border-slate-200/80'}>
          <div className="text-slate-400 text-[11px]">Period Range (Low – High)</div>
          <div className="font-mono-tabular font-semibold text-sm mt-0.5">
            {stats.min} – {stats.max}
          </div>
        </div>
        <div className={theme === 'dark' ? 'bg-[#060B16]/70 p-2.5 rounded-lg border border-slate-800/80' : 'bg-slate-50 p-2.5 rounded-lg border border-slate-200/80'}>
          <div className="text-slate-400 text-[11px]">Net Window Change</div>
          <div className="font-mono-tabular font-semibold text-sm mt-0.5 text-emerald-400">
            {stats.netChange > 0 ? `+${stats.netChange}` : stats.netChange} ({stats.percentChange > 0 ? `+${stats.percentChange}%` : `${stats.percentChange}%`})
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {renderChartBody(isModal ? 440 : 300)}

      {/* Footer Metadata + UI State Simulator (for testing Loading, Empty, and Error resilience) */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div>
          <span>Illustrative development series · {filteredData.length} observations shown</span>
          {referenceBand && (
            <span className="ml-2 text-emerald-400">· Shaded: {referenceBand.label}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span>State Check:</span>
          {(['populated', 'loading', 'empty', 'error'] as SimulatedViewState[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setViewState(st)}
              className={`px-1.5 py-0.5 rounded capitalize cursor-pointer ${
                viewState === st
                  ? 'bg-slate-800 text-emerald-400 font-medium'
                  : 'hover:text-slate-200'
              }`}
            >
              {st === 'populated' ? 'Data' : st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {panelContent(false)}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded chart view for ${title}`}
        >
          {panelContent(true)}
        </div>
      )}
    </>
  );
};

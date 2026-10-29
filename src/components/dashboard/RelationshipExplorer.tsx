import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowLeftRight, Check, Download, Info, Scale, ShieldAlert } from 'lucide-react';
import { DateRangeFilter, EconomicIndicator, PageId } from '../../types/economy';
import { alignIndicatorsForComparison } from '../../services/economyService';

interface RelationshipExplorerProps {
  indicators: EconomicIndicator[];
  defaultIndicatorAId?: string;
  defaultIndicatorBId?: string;
  onPairChange?: (indicatorAId: string, indicatorBId: string) => void;
  theme: 'dark' | 'light';
  onSelectPage?: (pageId: PageId) => void;
  compact?: boolean;
}

type NormalizationMode = 'indexed_100' | 'delta_percent' | 'dual_axis';

export const RelationshipExplorer: React.FC<RelationshipExplorerProps> = ({
  indicators,
  defaultIndicatorAId = 'cpi-inflation',
  defaultIndicatorBId = 'rbi-repo-rate',
  onPairChange,
  theme,
  onSelectPage,
  compact = false,
}) => {
  const [indAId, setIndAId] = useState<string>(defaultIndicatorAId);
  const [indBId, setIndBId] = useState<string>(defaultIndicatorBId);
  const [range, setRange] = useState<DateRangeFilter>('10Y');
  const [normMode, setNormMode] = useState<NormalizationMode>('indexed_100');
  const [csvExported, setCsvExported] = useState<boolean>(false);

  // Sync internal state when parent preset or search selection updates props
  useEffect(() => {
    setIndAId(defaultIndicatorAId);
  }, [defaultIndicatorAId]);

  useEffect(() => {
    setIndBId(defaultIndicatorBId);
  }, [defaultIndicatorBId]);

  const indicatorA = useMemo(
    () => indicators.find((i) => i.id === indAId) || indicators[0],
    [indicators, indAId]
  );

  const indicatorB = useMemo(
    () => indicators.find((i) => i.id === indBId) || indicators[1],
    [indicators, indBId]
  );

  const { points, pearsonR, compatibleNativeUnits } = useMemo(
    () => alignIndicatorsForComparison(indicatorA, indicatorB, range),
    [indicatorA, indicatorB, range]
  );

  const handleChangeA = (newA: string) => {
    setIndAId(newA);
    onPairChange?.(newA, indBId);
  };

  const handleChangeB = (newB: string) => {
    setIndBId(newB);
    onPairChange?.(indAId, newB);
  };

  const handleSwap = () => {
    const nextA = indBId;
    const nextB = indAId;
    setIndAId(nextA);
    setIndBId(nextB);
    onPairChange?.(nextA, nextB);
  };

  const handleExportComparisonCsv = () => {
    const header = [
      `# ArthNiti — Indian Economic Intelligence Platform (Illustrative Sample Dataset)`,
      `# Comparison: ${indicatorA.name} (${indicatorA.unit}) vs. ${indicatorB.name} (${indicatorB.unit})`,
      `# Historical Window: ${range} | Sample Pearson Correlation (r): ${pearsonR}`,
      `# Note: Illustrative sample data for educational & analytical demonstration. Correlation does not imply causation.`,
      '',
      `Period_Label,${indicatorA.shortName}_Raw (${indicatorA.unit}),${indicatorB.shortName}_Raw (${indicatorB.unit}),${indicatorA.shortName}_Base100,${indicatorB.shortName}_Base100,${indicatorA.shortName}_PctChange,${indicatorB.shortName}_PctChange`,
    ];

    const rows = points.map((pt) =>
      [
        `"${pt.label}"`,
        pt.rawA,
        pt.rawB,
        pt.indexedA,
        pt.indexedB,
        pt.deltaPercentA,
        pt.deltaPercentB,
      ].join(',')
    );

    const csv = [...header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `arthniti-comparison-${indicatorA.id}-vs-${indicatorB.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvExported(true);
    window.setTimeout(() => setCsvExported(false), 2200);
  };

  // Transparent, factual interpretation of the selected pair without fabricating opinions
  const relationshipNote = useMemo(() => {
    const absR = Math.abs(pearsonR);
    const strength =
      absR >= 0.65 ? 'strong' : absR >= 0.35 ? 'moderate' : 'weak or non-linear';
    const direction = pearsonR >= 0 ? 'positive co-movement' : 'inverse co-movement';

    return `Across the ${points.length} aligned sample observations (${range} window), ${indicatorA.shortName} (${indicatorA.unit}) and ${indicatorB.shortName} (${indicatorB.unit}) exhibit a sample Pearson correlation of r = ${pearsonR > 0 ? `+${pearsonR}` : pearsonR} (${strength} ${direction}). Because macroeconomic variables respond to shared external shocks, policy lags, and structural shifts, statistical correlation never establishes direct causation.`;
  }, [indicatorA, indicatorB, pearsonR, points.length, range]);

  const gridStroke = theme === 'dark' ? '#1e293b' : '#cbd5e1';
  const tickColor = theme === 'dark' ? '#94a3b8' : '#475569';

  return (
    <div
      className={`rounded-xl border p-5 sm:p-6 ${
        theme === 'dark'
          ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${
          theme === 'dark' ? 'border-slate-800/60' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span className={theme === 'dark' ? 'text-amber-400 font-medium' : 'text-amber-700 font-medium'}>
              Multi-Series Relationship Explorer
            </span>
            <span aria-hidden="true">·</span>
            <span>Normalized Co-Movement Analysis (Sample Data)</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold mt-1 tracking-tight">
            Compare Historical Movements Across Indicators
          </h3>
        </div>

        {/* Period, Normalization Mode & CSV Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
            role="group"
            aria-label="Normalization method"
          >
            {(
              [
                { id: 'indexed_100', label: 'Base 100 Index' },
                { id: 'delta_percent', label: '% Change' },
                { id: 'dual_axis', label: compatibleNativeUnits ? 'Native Units' : 'Dual Scale' },
              ] as { id: NormalizationMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setNormMode(m.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  normMode === m.id
                    ? 'bg-emerald-600 text-white'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center p-0.5 rounded-lg border ${
              theme === 'dark' ? 'bg-[#060B16] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
            role="group"
            aria-label="Comparison timeframe"
          >
            {(['3Y', '5Y', '10Y'] as DateRangeFilter[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs font-mono-tabular font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  range === r
                    ? theme === 'dark'
                      ? 'bg-slate-800 text-amber-400'
                      : 'bg-white border border-[#CBD5E1] text-[#0F172A] shadow-2xs'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportComparisonCsv}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              csvExported
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                : theme === 'dark'
                ? 'bg-[#060B16] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {csvExported ? (
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
        </div>
      </div>

      {/* Indicator Selector Row */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center my-4">
        <div className="md:col-span-5">
          <label
            htmlFor="select-ind-a"
            className={`block text-[11px] font-medium mb-1 ${
              theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
            }`}
          >
            Primary Series (Emerald Line)
          </label>
          <select
            id="select-ind-a"
            value={indAId}
            onChange={(e) => handleChangeA(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-xs font-medium focus:outline-2 focus:outline-emerald-500 ${
              theme === 'dark'
                ? 'bg-[#060B16] border-slate-700 text-slate-100'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            {indicators.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name} ({ind.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 flex justify-center pt-2 md:pt-5">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap primary and secondary indicators"
            aria-label="Swap primary and secondary indicators"
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#060B16] border-slate-800 hover:border-slate-600 text-slate-300'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        <div className="md:col-span-5">
          <label
            htmlFor="select-ind-b"
            className={`block text-[11px] font-medium mb-1 ${
              theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            Comparison Series (Gold Line)
          </label>
          <select
            id="select-ind-b"
            value={indBId}
            onChange={(e) => handleChangeB(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-xs font-medium focus:outline-2 focus:outline-amber-500 ${
              theme === 'dark'
                ? 'bg-[#060B16] border-slate-700 text-slate-100'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            {indicators.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name} ({ind.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Incompatible Unit Guard Notice */}
      {!compatibleNativeUnits && (
        <div
          className={`mb-4 p-3 rounded-lg border flex items-start gap-2.5 text-xs ${
            theme === 'dark'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200/90'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Unit Compatibility Safeguard: </span>
            <span>
              {indicatorA.shortName} is measured in <strong className="font-mono-tabular">{indicatorA.unit}</strong> while{' '}
              {indicatorB.shortName} is measured in <strong className="font-mono-tabular">{indicatorB.unit}</strong>.{' '}
              {normMode === 'indexed_100'
                ? 'Both series are re-indexed to Base 100 at the start of the period to prevent scale distortion.'
                : normMode === 'delta_percent'
                ? 'Both series are expressed as cumulative percentage changes from the initial observation.'
                : 'Separate Left (Emerald) and Right (Gold) vertical axes are active because raw units differ.'}
            </span>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div style={{ height: compact ? 280 : 340 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: tickColor, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
              minTickGap={24}
            />
            <YAxis
              yAxisId="left"
              tick={{
                fill: theme === 'dark' ? '#10b981' : '#047857',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
              }}
              tickLine={false}
              axisLine={false}
              width={48}
              domain={['auto', 'auto']}
            />
            {normMode === 'dual_axis' && !compatibleNativeUnits && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{
                  fill: theme === 'dark' ? '#f59e0b' : '#b45309',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                tickLine={false}
                axisLine={false}
                width={52}
                domain={['auto', 'auto']}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload;
                return (
                  <div
                    className={`rounded-lg p-3 border shadow-xl text-xs ${
                      theme === 'dark'
                        ? 'bg-[#060B16]/95 border-slate-700 text-slate-100'
                        : 'bg-white/95 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="font-mono-tabular font-semibold pb-1.5 mb-1.5 border-b border-slate-700/50">
                      {pt.label} (Illustrative Sample)
                    </div>
                    <div className="space-y-1 font-mono-tabular">
                      <div className="flex items-center justify-between gap-4 text-emerald-500">
                        <span>{indicatorA.shortName}:</span>
                        <span>
                          {pt.rawA} {indicatorA.unit} (Idx: {pt.indexedA})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-amber-500">
                        <span>{indicatorB.shortName}:</span>
                        <span>
                          {pt.rawB} {indicatorB.unit} (Idx: {pt.indexedB})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            {normMode === 'indexed_100' && (
              <ReferenceLine yAxisId="left" y={100} stroke="#64748b" strokeDasharray="3 3" />
            )}
            {normMode === 'delta_percent' && (
              <ReferenceLine yAxisId="left" y={0} stroke="#64748b" strokeDasharray="3 3" />
            )}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={
                normMode === 'indexed_100'
                  ? 'indexedA'
                  : normMode === 'delta_percent'
                  ? 'deltaPercentA'
                  : 'rawA'
              }
              name={`${indicatorA.shortName} (${
                normMode === 'indexed_100'
                  ? 'Base 100'
                  : normMode === 'delta_percent'
                  ? '% Δ'
                  : indicatorA.unit
              })`}
              stroke="#10b981"
              strokeWidth={2.25}
              dot={{ r: 2.5, fill: '#10b981' }}
              animationDuration={350}
            />
            <Line
              yAxisId={normMode === 'dual_axis' && !compatibleNativeUnits ? 'right' : 'left'}
              type="monotone"
              dataKey={
                normMode === 'indexed_100'
                  ? 'indexedB'
                  : normMode === 'delta_percent'
                  ? 'deltaPercentB'
                  : 'rawB'
              }
              name={`${indicatorB.shortName} (${
                normMode === 'indexed_100'
                  ? 'Base 100'
                  : normMode === 'delta_percent'
                  ? '% Δ'
                  : indicatorB.unit
              })`}
              stroke="#f59e0b"
              strokeWidth={2.25}
              dot={{ r: 2.5, fill: '#f59e0b' }}
              animationDuration={350}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Correlation vs. Causation Methodological Guard */}
      <div
        className={`mt-4 pt-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          theme === 'dark' ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-start gap-2.5 max-w-3xl">
          <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-xs">
            <strong className="font-semibold">Econometric Note (Correlation ≠ Causation): </strong>
            {relationshipNote}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-mono-tabular">
            <div className="text-[10px] text-slate-400">Sample Correlation (r)</div>
            <div className="text-sm font-semibold text-cyan-500">
              {pearsonR > 0 ? `+${pearsonR.toFixed(2)}` : pearsonR.toFixed(2)}
            </div>
          </div>
          {onSelectPage && (
            <button
              type="button"
              onClick={() => onSelectPage('data-sources')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                theme === 'dark'
                  ? 'border-slate-700 hover:border-emerald-500/50 text-emerald-400'
                  : 'border-slate-300 hover:border-emerald-600 text-emerald-700'
              }`}
            >
              Methodology
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

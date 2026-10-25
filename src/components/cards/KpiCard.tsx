import React, { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, ExternalLink } from 'lucide-react';
import { EconomicIndicator, PageId } from '../../types/economy';

interface KpiCardProps {
  indicator: EconomicIndicator;
  onSelectPage: (pageId: PageId, indicatorId?: string) => void;
  theme: 'dark' | 'light';
}

export const KpiCard: React.FC<KpiCardProps> = ({ indicator, onSelectPage, theme }) => {
  const [displayedValue, setDisplayedValue] = useState<number>(indicator.currentValue);

  // Smoothly interpolate numeric value only when the underlying value changes
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || displayedValue === indicator.currentValue) {
      setDisplayedValue(indicator.currentValue);
      return;
    }

    const startValue = displayedValue;
    const endValue = indicator.currentValue;
    const duration = 260;
    const startTime = performance.now();
    let rafId = 0;

    const animateValue = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      setDisplayedValue(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(animateValue);
      }
    };

    rafId = requestAnimationFrame(animateValue);
    return () => cancelAnimationFrame(rafId);
  }, [indicator.currentValue]);

  // Determine meaningful economic semantic tone (not assuming every increase is positive)
  const getSemanticAssessment = () => {
    const delta = indicator.changeValue;
    if (Math.abs(delta) < 0.001) {
      return {
        tone: 'neutral' as const,
        label: 'Policy Hold',
        colorClass: theme === 'dark' ? 'text-slate-300' : 'text-slate-600',
        strokeHex: '#64748b',
      };
    }

    if (indicator.semanticPolarity === 'higher_is_favorable') {
      const isFavorable = delta > 0;
      return {
        tone: isFavorable ? ('favorable' as const) : ('adverse' as const),
        label: isFavorable ? 'Expansionary' : 'Moderating',
        colorClass: isFavorable
          ? theme === 'dark'
            ? 'text-emerald-400'
            : 'text-emerald-700'
          : theme === 'dark'
          ? 'text-red-400'
          : 'text-red-600',
        strokeHex: isFavorable ? '#10b981' : '#ef4444',
      };
    }

    if (indicator.semanticPolarity === 'lower_is_favorable') {
      // For Unemployment, Crude Oil import cost, and USD/INR rate, a decrease is macroeconomically favorable
      const isFavorable = delta < 0;
      return {
        tone: isFavorable ? ('favorable' as const) : ('adverse' as const),
        label: isFavorable ? 'Favorable Easing' : 'Upward Pressure',
        colorClass: isFavorable
          ? theme === 'dark'
            ? 'text-emerald-400'
            : 'text-emerald-700'
          : theme === 'dark'
          ? 'text-red-400'
          : 'text-red-600',
        strokeHex: isFavorable ? '#10b981' : '#ef4444',
      };
    }

    if (indicator.semanticPolarity === 'target_band' && indicator.targetBand) {
      const withinBand =
        indicator.currentValue >= indicator.targetBand.min &&
        indicator.currentValue <= indicator.targetBand.max;
      const movingTowardMidpoint =
        Math.abs(indicator.currentValue - indicator.targetBand.midpoint) <=
        Math.abs(indicator.previousValue - indicator.targetBand.midpoint);
      const isFavorable = withinBand && movingTowardMidpoint;
      return {
        tone: isFavorable ? ('favorable' as const) : ('caution' as const),
        label: withinBand ? 'Within 2–6% Target' : 'Above Target Band',
        colorClass: isFavorable
          ? theme === 'dark'
            ? 'text-emerald-400'
            : 'text-emerald-700'
          : theme === 'dark'
          ? 'text-amber-400'
          : 'text-amber-700',
        strokeHex: isFavorable ? '#10b981' : '#f59e0b',
      };
    }

    return {
      tone: 'neutral' as const,
      label: 'Neutral',
      colorClass: theme === 'dark' ? 'text-slate-300' : 'text-slate-600',
      strokeHex: '#06b6d4',
    };
  };

  const semantic = getSemanticAssessment();

  // Build SVG Sparkline path from last 12 observations
  const recentObs = indicator.observations.slice(-12);
  const sparkPoints = (() => {
    if (recentObs.length < 2) return '';
    const vals = recentObs.map((o) => o.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const width = 108;
    const height = 32;
    return vals
      .map((v, i) => {
        const x = (i / (vals.length - 1)) * width;
        const y = height - ((v - min) / span) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  })();

  const formattedNumber = (() => {
    if (indicator.unitGroup === 'equity_index') {
      return Math.round(displayedValue).toLocaleString('en-IN');
    }
    if (indicator.id === 'usd-inr' || indicator.id === 'cpi-inflation' || indicator.id === 'rbi-repo-rate') {
      return displayedValue.toFixed(2);
    }
    return displayedValue.toFixed(1);
  })();

  return (
    <button
      type="button"
      onClick={() => onSelectPage(indicator.pageId, indicator.id)}
      className={`group text-left w-full rounded-xl p-5 border transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 ${
        theme === 'dark'
          ? 'bg-[#0B1325] border-slate-800/90 hover:border-emerald-500/45 hover:-translate-y-0.5'
          : 'bg-white border-slate-200 hover:border-emerald-600/50 hover:-translate-y-0.5 shadow-xs'
      }`}
    >
      {/* Top Unboxed Metadata Kicker (Zero-Pill Discipline) */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <span className={theme === 'dark' ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
            {indicator.sourceShortName}
          </span>
          <span aria-hidden="true">·</span>
          <span>{indicator.frequency}</span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 shrink-0" />
      </div>

      {/* Indicator Title */}
      <h3
        className={`mt-1.5 text-sm font-semibold tracking-tight ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}
      >
        {indicator.shortName}
      </h3>

      {/* Main Value + Sparkline */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-mono-tabular text-2xl sm:text-[26px] font-semibold tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              {indicator.id === 'usd-inr' ? `₹${formattedNumber}` : indicator.id === 'crude-oil' ? `$${formattedNumber}` : formattedNumber}
            </span>
            <span className="text-xs font-mono-tabular text-slate-400">{indicator.unit}</span>
          </div>

          {/* Movement Comparison */}
          <div className={`mt-1.5 flex items-center gap-1 text-xs font-mono-tabular ${semantic.colorClass}`}>
            {indicator.changeValue > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            ) : indicator.changeValue < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{indicator.changeLabel}</span>
          </div>
        </div>

        {/* Mini Sparkline */}
        <div className="shrink-0 pb-0.5" aria-hidden="true">
          <svg width="108" height="32" className="overflow-visible">
            <polyline
              fill="none"
              stroke={semantic.strokeHex}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkPoints}
            />
          </svg>
        </div>
      </div>

      {/* Footer Reporting Date & Semantic Context */}
      <div
        className={`mt-3.5 pt-2.5 border-t flex items-center justify-between text-[11px] ${
          theme === 'dark' ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
        }`}
      >
        <span className="font-mono-tabular">{indicator.reportingPeriod}</span>
        <span className={semantic.colorClass}>{semantic.label}</span>
      </div>
    </button>
  );
};

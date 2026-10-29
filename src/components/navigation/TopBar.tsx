import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CornerDownLeft,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { EconomicIndicator, IndicatorCategory, PageId } from '../../types/economy';
import { ARTHNITI_NAV_ITEMS } from './Sidebar';

interface TopBarProps {
  activePage: PageId;
  onSelectPage: (pageId: PageId, indicatorId?: string) => void;
  onOpenMobileMenu: () => void;
  indicators: EconomicIndicator[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const CATEGORY_LABELS: Record<IndicatorCategory | 'all', string> = {
  all: 'All',
  gdp: 'GDP & Output',
  inflation: 'Inflation',
  labour: 'Labour',
  currency_oil: 'Trade, FX & Crude',
  markets: 'Markets',
  policy: 'RBI Policy',
};

const PAGE_LABELS: Record<PageId, string> = {
  overview: 'Overview',
  'gdp-growth': 'GDP & Growth',
  inflation: 'Inflation',
  'labour-market': 'Labour Market',
  'currency-oil': 'Currency, Oil & Trade',
  'financial-markets': 'Financial Markets',
  'economic-news': 'Economic News & Current Affairs',
  'economist-bites': "Economists' Latest Bites",
  comparisons: 'Economic Comparisons',
  'data-sources': 'Methodology & Data Sources',
  about: 'About Us',
};

// Highlight matching substring cleanly without dangerouslySetInnerHTML
function renderHighlightedText(text: string, highlight: string, isDark: boolean) {
  const trimmed = highlight.trim();
  if (!trimmed) return <>{text}</>;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark
            key={i}
            className={`rounded px-0.5 font-semibold ${
              isDark
                ? 'bg-emerald-500/25 text-emerald-300'
                : 'bg-emerald-500/20 text-emerald-900'
            }`}
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export const TopBar: React.FC<TopBarProps> = ({
  activePage,
  onSelectPage,
  onOpenMobileMenu,
  indicators,
  theme,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategory | 'all'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentNav = useMemo(
    () => ARTHNITI_NAV_ITEMS.find((item) => item.id === activePage) || ARTHNITI_NAV_ITEMS[0],
    [activePage]
  );

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Global keyboard shortcut (Ctrl+K or Cmd+K) to focus indicator search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Real-time filtered suggestions across indicators and pages
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchingIndicators = indicators.filter((ind) => {
      if (selectedCategory !== 'all' && ind.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;

      const searchableText = [
        ind.name,
        ind.shortName,
        ind.id,
        ind.unit,
        ind.sourceShortName,
        ind.frequency,
        ind.summary,
        CATEGORY_LABELS[ind.category],
        PAGE_LABELS[ind.pageId],
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(q);
    });

    const matchingPages = q
      ? ARTHNITI_NAV_ITEMS.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.shortDesc.toLowerCase().includes(q)
        )
      : [];

    return { matchingIndicators, matchingPages };
  }, [indicators, query, selectedCategory]);

  // Combined selectable items for keyboard navigation
  const navigableItems = useMemo(() => {
    const items: Array<
      | { type: 'indicator'; indicator: EconomicIndicator }
      | { type: 'page'; pageId: PageId; label: string; shortDesc: string }
    > = [];

    searchResults.matchingIndicators.forEach((indicator) => {
      items.push({ type: 'indicator', indicator });
    });

    searchResults.matchingPages.forEach((pg) => {
      items.push({
        type: 'page',
        pageId: pg.id,
        label: pg.label,
        shortDesc: pg.shortDesc,
      });
    });

    return items;
  }, [searchResults]);

  // Reset active highlight index when query or category changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query, selectedCategory]);

  const handleSelectItem = (index: number) => {
    const item = navigableItems[index];
    if (!item) return;

    if (item.type === 'indicator') {
      // Route RBI Repo Rate to Financial Markets where its full corridor chart lives, or indicator's pageId
      const targetPage: PageId =
        item.indicator.id === 'rbi-repo-rate' && activePage === 'overview'
          ? 'financial-markets'
          : item.indicator.pageId;
      onSelectPage(targetPage, item.indicator.id);
    } else {
      onSelectPage(item.pageId);
    }

    setIsSearchOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsSearchOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (navigableItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % navigableItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (navigableItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + navigableItems.length) % navigableItems.length);
      }
    } else if (e.key === 'Enter') {
      if (isSearchOpen && navigableItems.length > 0) {
        e.preventDefault();
        handleSelectItem(activeIndex);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header
      className={`sticky top-0 z-20 h-16 px-4 sm:px-6 border-b flex items-center justify-between gap-4 transition-colors ${
        theme === 'dark'
          ? 'bg-[#060B16]/95 border-slate-800/90 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      {/* Zone 1: Mobile Menu Trigger + Breadcrumb & Current Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className={`lg:hidden p-2 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 ${
            theme === 'dark'
              ? 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60'
              : 'border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-sm truncate">
          <button
            type="button"
            onClick={() => onSelectPage('overview')}
            className="text-slate-400 hover:text-emerald-400 transition-colors font-medium hidden sm:inline cursor-pointer whitespace-nowrap shrink-0"
          >
            ArthNiti Terminal
          </button>
          <span className="text-slate-600 hidden md:inline" aria-hidden="true">
            /
          </span>
          <span className="text-xs text-slate-400 hidden md:inline whitespace-nowrap shrink-0">
            {currentNav.groupTitle}
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <span className="font-semibold tracking-tight truncate whitespace-nowrap">
            {currentNav.label}
          </span>
        </div>
      </div>

      {/* Zone 2: Real-Time Indicator Search & Suggestion Dropdown */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-lg">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={isSearchOpen}
            aria-controls="arthniti-search-listbox"
            aria-autocomplete="list"
            value={query}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleInputKeyDown}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Search indicators (GDP, CPI, Repo, USD/INR, Crude, NIFTY)..."
            aria-label="Search economic indicators and navigate to detail pages"
            className={`w-full pl-8 pr-16 py-1.5 text-xs rounded-lg border transition-colors focus:outline-2 focus:outline-emerald-500 ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-800 text-slate-100 placeholder:text-slate-500'
                : 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="absolute right-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd
              className={`hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono-tabular rounded border pointer-events-none ${
                theme === 'dark'
                  ? 'bg-[#060B16] border-slate-800 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              Ctrl K
            </kbd>
          )}
        </div>

        {/* Real-Time Suggestion Dropdown */}
        {isSearchOpen && (
          <div
            id="arthniti-search-listbox"
            role="listbox"
            aria-label="Economic indicator suggestions"
            className={`absolute left-0 right-0 mt-1.5 rounded-xl border shadow-2xl overflow-hidden z-50 ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-700/90 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Category Quick Filter Bar inside Dropdown */}
            <div
              className={`px-2.5 py-2 border-b flex items-center gap-1 overflow-x-auto ${
                theme === 'dark' ? 'border-slate-800 bg-[#080F1E]' : 'border-slate-100 bg-slate-50'
              }`}
            >
              {(Object.keys(CATEGORY_LABELS) as Array<IndicatorCategory | 'all'>).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Suggestions List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-medium text-slate-400">
                <span>
                  {query.trim()
                    ? `Matching Indicators (${searchResults.matchingIndicators.length})`
                    : 'Economic Indicators — Select to Open Detail View'}
                </span>
                <span className="font-mono-tabular">↑↓ Navigate · Enter</span>
              </div>

              {navigableItems.length === 0 ? (
                <div className="p-5 text-center space-y-2">
                  <div className="text-xs text-slate-400">
                    No economic indicators matching <strong className="text-slate-200">&ldquo;{query}&rdquo;</strong>
                    {selectedCategory !== 'all' ? ` in ${CATEGORY_LABELS[selectedCategory]}` : ''}.
                  </div>
                  {selectedCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="text-xs text-emerald-400 hover:underline cursor-pointer"
                    >
                      Search across all categories
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {searchResults.matchingIndicators.map((ind, idx) => {
                    const isHighlighted = activeIndex === idx;
                    const destinationPageId: PageId =
                      ind.id === 'rbi-repo-rate' && activePage === 'overview'
                        ? 'financial-markets'
                        : ind.pageId;

                    // Mini 6-point sparkline for suggestion row
                    const recentVals = ind.observations.slice(-8).map((o) => o.value);
                    const minV = Math.min(...recentVals);
                    const maxV = Math.max(...recentVals);
                    const spanV = maxV - minV || 1;
                    const sparkPts = recentVals
                      .map((v, i) => {
                        const x = (i / (recentVals.length - 1)) * 44;
                        const y = 16 - ((v - minV) / spanV) * 12 - 2;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');

                    return (
                      <button
                        key={ind.id}
                        type="button"
                        role="option"
                        aria-selected={isHighlighted}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handleSelectItem(idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isHighlighted
                            ? theme === 'dark'
                              ? 'bg-emerald-500/15 border border-emerald-500/40'
                              : 'bg-emerald-50 border border-emerald-200'
                            : 'border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">
                              {renderHighlightedText(ind.name, query, theme === 'dark')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                            <span className="text-emerald-400 font-medium">
                              {PAGE_LABELS[destinationPageId]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{renderHighlightedText(ind.sourceShortName, query, theme === 'dark')}</span>
                            <span aria-hidden="true">·</span>
                            <span>{ind.frequency}</span>
                          </div>
                        </div>

                        {/* Sparkline + Value + Destination Action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <svg width="44" height="16" className="hidden sm:block overflow-visible" aria-hidden="true">
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="1.5"
                              points={sparkPts}
                            />
                          </svg>

                          <div className="text-right font-mono-tabular">
                            <div className="font-semibold text-emerald-400">
                              {ind.id === 'usd-inr'
                                ? `₹${ind.currentValue}`
                                : ind.id === 'crude-oil'
                                ? `$${ind.currentValue}`
                                : ind.id === 'merchandise-trade'
                                ? `${ind.currentValue < 0 ? '-$' : '+$'}${Math.abs(ind.currentValue).toFixed(2)}B`
                                : ind.currentValue.toLocaleString('en-IN')}{' '}
                              <span className="text-[10px] font-normal text-slate-400">
                                {ind.id === 'merchandise-trade' ? 'Signed Balance' : ind.unit}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-end gap-0.5">
                              {ind.changeValue > 0 ? (
                                <ArrowUpRight className="w-2.5 h-2.5 text-emerald-400" />
                              ) : ind.changeValue < 0 ? (
                                <ArrowDownRight className="w-2.5 h-2.5 text-amber-400" />
                              ) : (
                                <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                              )}
                              <span>{ind.reportingPeriod}</span>
                            </div>
                          </div>

                          <CornerDownLeft
                            className={`w-3.5 h-3.5 transition-opacity ${
                              isHighlighted ? 'opacity-100 text-emerald-400' : 'opacity-0'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}

                  {/* Matching Dedicated Pages */}
                  {searchResults.matchingPages.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-slate-800/60">
                      <div className="px-2 py-1 text-[10px] font-medium text-slate-400">
                        Matching Dashboard Modules
                      </div>
                      {searchResults.matchingPages.map((pg, pIdx) => {
                        const itemIndex = searchResults.matchingIndicators.length + pIdx;
                        const isHighlighted = activeIndex === itemIndex;
                        return (
                          <button
                            key={pg.id}
                            type="button"
                            role="option"
                            aria-selected={isHighlighted}
                            onMouseEnter={() => setActiveIndex(itemIndex)}
                            onClick={() => handleSelectItem(itemIndex)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isHighlighted
                                ? theme === 'dark'
                                  ? 'bg-emerald-500/15 border border-emerald-500/40'
                                  : 'bg-emerald-50 border border-emerald-200'
                                : 'border border-transparent'
                            }`}
                          >
                            <div>
                              <div className="font-medium">
                                {renderHighlightedText(pg.label, query, theme === 'dark')}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {renderHighlightedText(pg.shortDesc, query, theme === 'dark')}
                              </div>
                            </div>
                            <span className="text-[11px] text-amber-400 font-mono-tabular shrink-0">
                              Open Module →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Zone 3: Official Data Provenance Status + Theme Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onSelectPage('data-sources')}
          title="Inspect official indicator provenance registry and methodology"
          className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono-tabular cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>7 Official Macro Series</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400">MoSPI · RBI · MoCI · Live</span>
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === 'dark'
              ? 'Switch to Editorial Light mode'
              : 'Switch to Midnight Navy Dark mode'
          }
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800 text-slate-200 hover:border-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
          }`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Midnight Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

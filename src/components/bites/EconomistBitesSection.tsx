import React, { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  Filter,
  ArrowUpRight,
  Clock,
  Users,
  Globe,
  FileText,
  X,
} from 'lucide-react';
import type {
  EconomistBite,
  EconomistBitesResponse,
  EconomistGeography,
  EconomistBiteTopicId,
  BiteKeyFigure,
  BiteLinkedIndicator,
  BiteSourceFeedStatus,
  BiteVerificationStatus,
} from '../../services/economistBitesService';
import { ECONOMIST_BITE_TOPICS_META } from '../../services/economistBitesService';
import type { PageId } from '../../types/economy';

interface EconomistBitesSectionProps {
  data: EconomistBitesResponse | null;
  loading: boolean;
  error: string | null;
  isStaleCache?: boolean;
  onRefresh: (force?: boolean) => void;
  onSimulateError?: (simulate: boolean) => void;
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
  mode?: 'full' | 'overview-preview';
  onNavigate?: (page: PageId, indicatorId?: string) => void;
}

const VERIFICATION_STATUS_LABELS: Record<BiteVerificationStatus, string> = {
  VERIFIED_PRIMARY_SOURCE: 'VERIFIED PRIMARY SOURCE',
  VERIFIED_REPORTED_ATTRIBUTION: 'VERIFIED REPORTED ATTRIBUTION',
  VERIFIED_INSTITUTIONAL_OUTLOOK: 'VERIFIED INSTITUTIONAL OUTLOOK',
  AI_ASSISTED_VERIFIED: 'AI-ASSISTED · SOURCE-VERIFIED',
};

const TOPIC_ENTRIES = Object.entries(ECONOMIST_BITE_TOPICS_META) as Array<
  [EconomistBiteTopicId, { label: string; shortLabel: string; description: string }]
>;

export const EconomistBitesSection: React.FC<EconomistBitesSectionProps> = ({
  data,
  loading,
  error,
  isStaleCache = false,
  onRefresh,
  onSimulateError,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
  mode = 'full',
  onNavigate,
}) => {
  const [selectedGeography, setSelectedGeography] = useState<'ALL' | EconomistGeography>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<'all' | EconomistBiteTopicId>('all');
  const [selectedEconomist, setSelectedEconomist] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedBiteIds, setExpandedBiteIds] = useState<Record<string, boolean>>({});
  const [showSourceDirectory, setShowSourceDirectory] = useState<boolean>(false);
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const pageSize = mode === 'overview-preview' ? 4 : 6;
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);

  const bites = useMemo(() => data?.bites ?? [], [data]);
  const economistsDirectory = useMemo(() => data?.economistsDirectory ?? [], [data]);
  const feedStatuses: BiteSourceFeedStatus[] = useMemo(() => data?.sourcesStatus ?? [], [data]);

  const activeEconomistsInFeed = useMemo(() => {
    const map = new Map<string, { name: string; count: number; geographyScope: string }>();
    for (const bite of bites) {
      const existing = map.get(bite.economist_name);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(bite.economist_name, {
          name: bite.economist_name,
          count: 1,
          geographyScope: bite.geography,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    );
  }, [bites]);

  const filteredBites = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return bites
      .filter((bite) => {
        if (selectedGeography !== 'ALL' && bite.geography !== selectedGeography) {
          return false;
        }
        if (selectedTopic !== 'all' && bite.topic !== selectedTopic) {
          return false;
        }
        if (
          selectedEconomist !== 'all' &&
          !bite.economist_name.toLowerCase().includes(selectedEconomist.toLowerCase())
        ) {
          return false;
        }
        if (normalizedSearch.length > 0) {
          const haystack = [
            bite.headline,
            bite.economist_name,
            bite.economist_designation,
            bite.institution,
            bite.topic_label,
            bite.publisher,
            bite.summary_big_point,
            bite.summary_why_it_matters,
            bite.summary_key_takeaway,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalizedSearch);
        }
        return true;
      })
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  }, [bites, selectedGeography, selectedTopic, selectedEconomist, searchQuery]);

  const visibleBites = useMemo(
    () => filteredBites.slice(0, visibleCount),
    [filteredBites, visibleCount]
  );

  const indiaCount = useMemo(
    () => bites.filter((b) => b.geography === 'INDIA').length,
    [bites]
  );
  const globalCount = useMemo(
    () => bites.filter((b) => b.geography === 'GLOBAL').length,
    [bites]
  );

  const toggleExpandBite = (id: string) => {
    setExpandedBiteIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetFilters = () => {
    setSelectedGeography('ALL');
    setSelectedTopic('all');
    setSelectedEconomist('all');
    setSearchQuery('');
    setVisibleCount(pageSize);
  };

  const hasActiveFilters =
    selectedGeography !== 'ALL' ||
    selectedTopic !== 'all' ||
    selectedEconomist !== 'all' ||
    searchQuery.trim().length > 0;

  const effectiveError = simulatedError
    ? 'Simulated upstream feed timeout triggered for diagnostic verification. Cached or retry controls remain operational.'
    : error;

  return (
    <section
      aria-labelledby="economist-bites-heading"
      className="bg-[#0B0F19]/90 border border-slate-800/80 rounded-xl p-5 sm:p-6 shadow-2xl"
    >
      {/* Top Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-amber-400/90">
            <span>RESEARCH &amp; POLICY COMMENTARY</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">INDIA &amp; GLOBAL MACRO</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400/90">
              {data?.aiSummarizationAvailable
                ? 'AI-ASSISTED + SOURCE-VERIFIED'
                : 'DETERMINISTIC SOURCE-VERIFIED'}
            </span>
          </div>
          <h2
            id="economist-bites-heading"
            className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight"
          >
            Economists&apos; Latest Bites
          </h2>
          <p className="text-sm text-amber-300/90 font-medium">
            Expert perspectives. Economic signals. Informed decisions.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed pt-0.5">
            Concise, source-verified briefings on Indian and global macroeconomic policy, growth, inflation, trade, and structural reforms. Every summary paraphrases verified research or speeches without inventing verbatim quotes, and links directly to the underlying source.
          </p>
        </div>

        {/* Action & Refresh Toolbar */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          {data?.fetchedAtIst && (
            <div className="text-[11px] font-mono text-slate-400 mr-1">
              <span>Checked: {data.fetchedAtIst}</span>
            </div>
          )}

          {onToggleAutoRefresh && (
            <button
              type="button"
              onClick={onToggleAutoRefresh}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                autoRefreshEnabled
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-slate-900/80 border-slate-700/70 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle 5-minute background verification refresh"
            >
              Auto-Sync: {autoRefreshEnabled ? 'ON (5m)' : 'OFF'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSourceDirectory((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors"
            aria-expanded={showSourceDirectory}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Economist &amp; Source Directory ({economistsDirectory.length || 18})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSimulatedError(false);
              if (onSimulateError) onSimulateError(false);
              onRefresh(true);
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Bites'}</span>
          </button>

          {mode === 'overview-preview' && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('economist-bites')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
            >
              <span>All Bites ({bites.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Economist & Feed Verification Directory */}
      {showSourceDirectory && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Verified Economist &amp; Institutional Feed Registry
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All designations and institutional affiliations are cross-checked against official institutional biographies. Historical titles (e.g., Former RBI Governor, Former Chief Economic Adviser) are explicitly distinguished from current academic posts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSourceDirectory(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
              aria-label="Close Economist Directory"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {economistsDirectory.map((econ) => (
              <div
                key={econ.id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between gap-1.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{econ.name}</span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {econ.primaryGeography}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-300/90 leading-snug mt-0.5">
                    {econ.designation}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-snug">{econ.institution}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEconomist(econ.name);
                      setShowSourceDirectory(false);
                    }}
                    className="text-amber-400 hover:underline"
                  >
                    Filter bites by {econ.name.split(' ')[0]}
                  </button>
                  <a
                    href={econ.officialProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-slate-300 hover:text-white"
                  >
                    <span>Profile</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {feedStatuses.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Live Discovery Feed Telemetry ({feedStatuses.filter((f) => f.status === 'ok').length}/{feedStatuses.length} Operational)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {feedStatuses.map((feed) => (
                  <div
                    key={feed.id}
                    className="px-2.5 py-1.5 rounded bg-slate-950/80 border border-slate-800/70 text-[11px] flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-300 truncate" title={feed.name}>
                      {feed.shortName}
                    </span>
                    <span
                      className={`font-mono uppercase text-[10px] ${
                        feed.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {feed.status === 'ok' ? `OK (${feed.discoveredCount})` : 'CORPUS'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stale Cache / Error Banner */}
      {(isStaleCache || effectiveError) && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 p-3.5 rounded-lg bg-amber-950/40 border border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 space-y-0.5">
              <p className="font-semibold text-amber-300">
                {effectiveError
                  ? 'Live Discovery Feed Notice — Displaying Verified Research Corpus'
                  : 'Displaying Last Known Verified Snapshot (Stale Cache)'}
              </p>
              <p className="text-amber-200/80">
                {effectiveError ||
                  'Upstream feed refresh experienced transient latency. All displayed economist bites remain source-verified with intact primary links.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSimulatedError(false);
                if (onSimulateError) onSimulateError(false);
                onRefresh(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors"
            >
              Retry Live Sync
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Controls */}
      <div className="mt-5 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Geography Toggle: All | India | Global */}
          <div
            role="group"
            aria-label="Filter by Geography"
            className="inline-flex items-center p-1 rounded-lg bg-slate-900/95 border border-slate-800 self-start"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedGeography('ALL');
                setVisibleCount(pageSize);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                selectedGeography === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              ALL ({bites.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedGeography('INDIA');
                setVisibleCount(pageSize);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                selectedGeography === 'INDIA'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              INDIA ({indiaCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedGeography('GLOBAL');
                setVisibleCount(pageSize);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                selectedGeography === 'GLOBAL'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              GLOBAL ({globalCount})
            </button>
          </div>

          {/* Economist Dropdown + Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
            <div className="relative sm:w-64">
              <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Filter by Economist"
                value={selectedEconomist}
                onChange={(e) => {
                  setSelectedEconomist(e.target.value);
                  setVisibleCount(pageSize);
                }}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="all">All Economists ({activeEconomistsInFeed.length})</option>
                {activeEconomistsInFeed.map((econ) => (
                  <option key={econ.name} value={econ.name}>
                    {econ.name} ({econ.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search economist bites by headline, economist, or topic"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(pageSize);
                }}
                placeholder="Search economist, headline, policy rate, tariff, AI, inflation..."
                className="w-full pl-8 pr-8 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Topic Filter Bar */}
        {mode === 'full' && (
          <div
            role="group"
            aria-label="Filter by Economic Topic"
            className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin"
          >
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 mr-1 shrink-0">
              <Filter className="w-3 h-3 text-amber-400" />
              <span>Topic:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedTopic('all');
                setVisibleCount(pageSize);
              }}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors border ${
                selectedTopic === 'all'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-medium'
                  : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              All Topics
            </button>
            {TOPIC_ENTRIES.map(([topicId, meta]) => {
              const isSelected = selectedTopic === topicId;
              return (
                <button
                  key={topicId}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(topicId);
                    setVisibleCount(pageSize);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-medium'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {meta.shortLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* Active Filter Status & Sort Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing <strong className="text-slate-200">{visibleBites.length}</strong> of{' '}
              <strong className="text-slate-200">{filteredBites.length}</strong> verified bites
            </span>
            <span className="text-slate-600">·</span>
            <span>Sorted: Newest First (Original Publication Date)</span>
            {hasActiveFilters && (
              <>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-amber-400 hover:underline"
                >
                  Reset Active Filters
                </button>
              </>
            )}
          </div>

          <div className="text-slate-400">
            <span>
              Non-endorsement: Paraphrased arguments reflect cited economists, not ArthNiti policy advice.
            </span>
          </div>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading && bites.length === 0 && (
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse space-y-4"
            >
              <div className="h-3 w-2/3 bg-slate-800 rounded" />
              <div className="h-5 w-5/6 bg-slate-800 rounded" />
              <div className="h-4 w-1/2 bg-slate-800/80 rounded" />
              <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/60 space-y-2.5">
                <div className="h-3 w-full bg-slate-800 rounded" />
                <div className="h-3 w-11/12 bg-slate-800 rounded" />
                <div className="h-3 w-3/4 bg-slate-800 rounded" />
              </div>
              <div className="flex justify-between pt-2">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-4 w-28 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Filter State */}
      {!loading && filteredBites.length === 0 && (
        <div className="mt-5 p-8 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              No Economist Bites Match Your Current Filters
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try clearing your search query or switching the geography, topic, or economist filter to inspect all verified research briefs.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Bite Cards Grid */}
      {filteredBites.length > 0 && (
        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
          {visibleBites.map((bite) => {
            const isExpanded = Boolean(expandedBiteIds[bite.id]);

            return (
              <article
                key={bite.id}
                className="flex flex-col justify-between rounded-xl bg-slate-900/75 border border-slate-800/90 hover:border-slate-700/90 transition-colors p-5 space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Metadata Line — Unboxed Inline Typography (Zero-Pill Discipline) */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono tracking-wider uppercase">
                    <span
                      className={
                        bite.geography === 'INDIA'
                          ? 'text-amber-400 font-semibold'
                          : 'text-sky-400 font-semibold'
                      }
                    >
                      {bite.geography}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300">{bite.topic_label}</span>
                    <span className="text-slate-600">·</span>
                    <span
                      className="text-slate-400"
                      title={`Original Publication Date: ${bite.published_at_ist}`}
                    >
                      {bite.published_at_ist}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-emerald-400/90">
                      {VERIFICATION_STATUS_LABELS[bite.verification_status]}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-base sm:text-lg font-display font-bold text-white leading-snug">
                    {bite.headline}
                  </h3>

                  {/* Economist Attribution Block */}
                  <div className="flex items-start justify-between gap-3 pt-0.5 pb-1 border-b border-slate-800/70">
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-semibold text-amber-300">
                        {bite.economist_name}
                      </div>
                      <div className="text-xs text-slate-300 leading-snug">
                        {bite.economist_designation}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {bite.institution} · <span className="text-slate-300">Source: {bite.publisher}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Quick Summary Box — Always Visible Without Clicking */}
                  <div
                    aria-label="Quick Summary"
                    className="rounded-lg bg-slate-950/90 border border-slate-800/90 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-amber-400/90">
                      <span>QUICK SUMMARY (PARAPHRASED · SOURCE-VERIFIED)</span>
                      <span>
                        {bite.provenance_mode === 'LIVE_DISCOVERED_FEED'
                          ? 'LIVE FEED'
                          : 'PRIMARY RESEARCH'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
                      <p className="text-slate-200">
                        <strong className="text-white font-semibold">The Big Point: </strong>
                        {bite.summary_big_point}
                      </p>
                      <p className="text-slate-300">
                        <strong className="text-amber-300 font-semibold">Why It Matters: </strong>
                        {bite.summary_why_it_matters}
                      </p>
                      <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap items-baseline gap-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                          Key Takeaway:
                        </span>
                        <span className="text-xs sm:text-[13px] font-semibold text-white">
                          {bite.summary_key_takeaway}
                        </span>
                      </div>
                    </div>

                    {/* Optional Verified Key Figures */}
                    {bite.key_figures && bite.key_figures.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {bite.key_figures.map((fig: BiteKeyFigure, figIdx: number) => (
                          <div
                            key={`${bite.id}-fig-${figIdx}`}
                            className="px-3 py-2 rounded bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400 uppercase">
                              <span className="truncate">{fig.label}</span>
                              <span className="text-amber-400 shrink-0">{fig.figureType}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-sm font-mono font-bold text-white tabular-nums">
                                {fig.value}
                              </span>
                              {fig.unit && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  {fig.unit}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between gap-1">
                              <span>Period: {fig.period}</span>
                              <span className="truncate text-slate-500" title={fig.sourceRef}>
                                {fig.sourceRef}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expandable Full Analysis Drawer */}
                  {isExpanded && bite.detailed_analysis && (
                    <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-4 space-y-3 text-xs leading-relaxed">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                        Detailed Attribution &amp; Macroeconomic Transmission
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-slate-200">
                          What {bite.economist_name} Argued (Paraphrased):
                        </div>
                        <p className="text-slate-300">
                          {bite.detailed_analysis.whatEconomistSaid}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-slate-200">
                          What the Primary Source Reports ({bite.publisher}):
                        </div>
                        <p className="text-slate-300">
                          {bite.detailed_analysis.whatSourceReports}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold text-amber-300">
                          ArthNiti Macroeconomic Context &amp; Indicator Transmission:
                        </div>
                        <p className="text-slate-300">
                          {bite.detailed_analysis.arthnitiContextAndImplications}
                        </p>
                      </div>

                      {bite.detailed_analysis.contrastingViews && (
                        <div className="space-y-1">
                          <div className="font-semibold text-sky-300">
                            Contrasting &amp; Alternative Economic Perspectives:
                          </div>
                          <p className="text-slate-300">
                            {bite.detailed_analysis.contrastingViews}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="font-semibold text-slate-200">
                          Methodology &amp; Source Caveats:
                        </div>
                        <p className="text-slate-400">
                          {bite.detailed_analysis.methodologyAndCaveats}
                        </p>
                      </div>

                      {/* Linked ArthNiti Indicators */}
                      {onNavigate &&
                        bite.detailed_analysis.linkedIndicators &&
                        bite.detailed_analysis.linkedIndicators.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono uppercase text-slate-400">
                              Inspect Related ArthNiti Modules:
                            </span>
                            {bite.detailed_analysis.linkedIndicators.map(
                              (ind: BiteLinkedIndicator) => (
                                <button
                                  key={`${bite.id}-ind-${ind.id}`}
                                  type="button"
                                  onClick={() => onNavigate(ind.pageId, ind.indicatorId)}
                                  title={ind.transmissionChannel}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700/80 text-[11px] font-mono transition-colors"
                                >
                                  <span>{ind.label}</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                              )
                            )}
                          </div>
                        )}

                      {/* Separated Provenance Timestamps */}
                      <div className="pt-2.5 border-t border-slate-800/80 space-y-1 text-[10px] font-mono text-slate-400">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Published: {bite.published_at_ist}</span>
                          <span>·</span>
                          <span>Discovered: {bite.discovered_at_ist}</span>
                          <span>·</span>
                          <span>Last Verified: {bite.last_checked_at_ist}</span>
                        </div>
                        <div className="truncate text-slate-500" title={bite.canonical_url}>
                          Canonical URL: {bite.canonical_url}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Read Original Source Link + Expand/Collapse Toggle */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={bite.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Read Original Source ({bite.publisher})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => toggleExpandBite(bite.id)}
                    aria-expanded={isExpanded}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Full Analysis' : 'View Full Analysis'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination / Load More Controls */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            Source verification enforces strict canonical URLs, non-fabricated paraphrases, and separated publication vs. check timestamps.
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {visibleCount < filteredBites.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + pageSize)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Load More Bites ({filteredBites.length - visibleCount} remaining)
            </button>
          )}

          {mode === 'overview-preview' && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('economist-bites')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Open Full Economists&apos; Bites Intelligence Module</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

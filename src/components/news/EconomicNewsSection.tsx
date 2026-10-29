import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Filter,
  Globe,
  Info,
  Landmark,
  Newspaper,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import { PageId } from '../../types/economy';
import {
  AffectedArthNitiIndicator,
  EconomicNewsArticle,
  EconomicNewsResponse,
  ImpactDirection,
  NEWS_SUBTOPICS_META,
  NewsDashboardSection,
  NewsMacroCategory,
  NewsSubTopicId,
} from '../../services/economicNewsService';

interface EconomicNewsSectionProps {
  newsData: EconomicNewsResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  isStaleCache: boolean;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onRefreshNow: () => void;
  onSimulateError: (simulate: boolean) => void;
  onSelectPage: (pageId: PageId, indicatorId?: string) => void;
  theme: 'dark' | 'light';
  mode?: 'full' | 'overview-preview';
}

const DIRECTION_STYLES: Record<
  ImpactDirection,
  { text: string; border: string; bg: string; label: string }
> = {
  positive: {
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    label: 'Constructive / Positive Impact',
  },
  negative: {
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    label: 'Adverse / Cost-Push Risk',
  },
  mixed: {
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    label: 'Mixed / Two-Way Transmission',
  },
  uncertain: {
    text: 'text-slate-300',
    border: 'border-slate-600/40',
    bg: 'bg-slate-800/50',
    label: 'Uncertain / Developing Impact',
  },
};

export const EconomicNewsSection: React.FC<EconomicNewsSectionProps> = ({
  newsData,
  isLoading,
  errorMessage,
  isStaleCache,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onRefreshNow,
  onSimulateError,
  onSelectPage,
  theme,
  mode = 'full',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | NewsMacroCategory>('all');
  const [selectedSubTopic, setSelectedSubTopic] = useState<'all' | NewsSubTopicId>('all');
  const [selectedSectionTab, setSelectedSectionTab] = useState<'all' | NewsDashboardSection>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedArticleIds, setExpandedArticleIds] = useState<Record<string, boolean>>({});
  const [showSourceDirectory, setShowSourceDirectory] = useState<boolean>(false);

  const articles = useMemo(() => newsData?.articles || [], [newsData]);

  const toggleArticleIntelligence = (id: string) => {
    setExpandedArticleIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Sub-topics available for current category
  const visibleSubTopics = useMemo(() => {
    const entries = Object.entries(NEWS_SUBTOPICS_META) as Array<
      [NewsSubTopicId, { category: NewsMacroCategory; label: string; shortLabel: string }]
    >;
    if (selectedCategory === 'all') return entries;
    return entries.filter(([, meta]) => meta.category === selectedCategory);
  }, [selectedCategory]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((art) => {
      if (selectedCategory !== 'all' && art.category !== selectedCategory) {
        return false;
      }
      if (selectedSubTopic !== 'all' && art.subTopicId !== selectedSubTopic) {
        return false;
      }
      if (selectedSectionTab !== 'all' && !art.sections.includes(selectedSectionTab)) {
        return false;
      }
      if (q) {
        const haystack = [
          art.headline,
          art.conciseSummary,
          art.sourceName,
          art.sourceShortName,
          art.subTopicLabel,
          art.intelligence.whyItMatters,
          art.intelligence.impactOnIndia,
          ...art.intelligence.affectedIndicators.map((ind) => ind.label),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [articles, selectedCategory, selectedSubTopic, selectedSectionTab, searchQuery]);

  const featuredArticle = useMemo(() => {
    if (filteredArticles.length === 0) return null;
    return (
      filteredArticles.find((a) => a.sections.includes('featured')) || filteredArticles[0]
    );
  }, [filteredArticles]);

  const remainingArticles = useMemo(() => {
    if (!featuredArticle) return [];
    return filteredArticles.filter((a) => a.id !== featuredArticle.id);
  }, [filteredArticles, featuredArticle]);

  const policyAnnouncements = useMemo(
    () =>
      articles
        .filter((a) => a.sections.includes('policy-announcements'))
        .slice(0, 5),
    [articles]
  );

  const marketImpactStories = useMemo(
    () =>
      articles
        .filter((a) => a.sections.includes('market-impact'))
        .slice(0, 5),
    [articles]
  );

  const timelineStories = useMemo(() => articles.slice(0, 9), [articles]);

  const categoryCounts = useMemo(() => {
    return {
      all: articles.length,
      india: articles.filter((a) => a.category === 'india').length,
      global: articles.filter((a) => a.category === 'global').length,
      'current-affairs': articles.filter((a) => a.category === 'current-affairs').length,
    };
  }, [articles]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubTopic('all');
    setSelectedSectionTab('all');
    setSearchQuery('');
  };

  const handleIndicatorJump = (ind: AffectedArthNitiIndicator) => {
    onSelectPage(ind.pageId, ind.indicatorId);
  };

  const renderIntelligencePanel = (art: EconomicNewsArticle) => {
    const { intelligence } = art;
    const dirStyle = DIRECTION_STYLES[intelligence.impactAssessment.direction];

    return (
      <div
        className={`mt-4 pt-4 border-t space-y-4 text-xs ${
          theme === 'dark' ? 'border-slate-800/90' : 'border-slate-200'
        }`}
      >
        {/* Header Bar of Intelligence Panel */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 font-mono-tabular">
            <span className="text-emerald-400 font-semibold tracking-wide">
              WHY IT MATTERS FOR INDIA&apos;S ECONOMY
            </span>
            <span className="text-slate-500" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-400">
              Attribution: <strong className="text-slate-200">{intelligence.attributionType}</strong>
            </span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-md border font-mono-tabular text-[11px] ${dirStyle.bg} ${dirStyle.border} ${dirStyle.text}`}
          >
            <span>Assessment: {intelligence.impactAssessment.direction.toUpperCase()}</span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            <span>{intelligence.impactAssessment.timeHorizon}</span>
          </div>
        </div>

        {/* 4-Column Structured Analytical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className={`p-3.5 rounded-lg border ${
              theme === 'dark'
                ? 'bg-[#060B16]/90 border-slate-800/80'
                : 'bg-slate-50 border-slate-200/90'
            }`}
          >
            <div className="font-mono-tabular text-[11px] text-slate-400 mb-1">
              01 · WHAT HAPPENED ({art.sourceShortName})
            </div>
            <p
              className={`leading-relaxed ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {intelligence.whatHappened}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-lg border ${
              theme === 'dark'
                ? 'bg-[#060B16]/90 border-slate-800/80'
                : 'bg-slate-50 border-slate-200/90'
            }`}
          >
            <div className="font-mono-tabular text-[11px] text-emerald-400 mb-1">
              02 · WHY IT MATTERS (MACRO SIGNIFICANCE)
            </div>
            <p
              className={`leading-relaxed ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {intelligence.whyItMatters}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-lg border ${
              theme === 'dark'
                ? 'bg-[#060B16]/90 border-slate-800/80'
                : 'bg-slate-50 border-slate-200/90'
            }`}
          >
            <div className="font-mono-tabular text-[11px] text-amber-400 mb-1">
              03 · IMPACT ON INDIA (DOMESTIC TRANSMISSION)
            </div>
            <p
              className={`leading-relaxed ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {intelligence.impactOnIndia}
            </p>
          </div>

          <div
            className={`p-3.5 rounded-lg border ${
              theme === 'dark'
                ? 'bg-[#060B16]/90 border-slate-800/80'
                : 'bg-slate-50 border-slate-200/90'
            }`}
          >
            <div className="font-mono-tabular text-[11px] text-cyan-400 mb-1">
              04 · GLOBAL IMPACT &amp; SPILLOVERS
            </div>
            <p
              className={`leading-relaxed ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              {intelligence.globalImpact}
            </p>
          </div>
        </div>

        {/* Impact Assessment Reasoning & Affected ArthNiti Indicators */}
        <div
          className={`p-3.5 rounded-lg border space-y-3 ${
            theme === 'dark'
              ? 'bg-[#081020] border-slate-800/90'
              : 'bg-slate-100/70 border-slate-200'
          }`}
        >
          <div>
            <span className="font-mono-tabular text-[11px] text-slate-400">
              EVIDENCE-BASED IMPACT ASSESSMENT ({intelligence.impactAssessment.label}):{' '}
            </span>
            <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
              {intelligence.impactAssessment.reasoning}
            </span>
          </div>

          {/* Clickable Affected Indicators linking directly to ArthNiti modules */}
          <div className="space-y-1.5">
            <div className="font-mono-tabular text-[11px] text-slate-400">
              AFFECTED ARTHNITI INDICATORS (CLICK TO OPEN LIVE INDICATOR MODULE):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {intelligence.affectedIndicators.map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => handleIndicatorJump(ind)}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer group flex flex-col justify-between gap-1 ${
                    theme === 'dark'
                      ? 'bg-[#060B16] border-slate-800 hover:border-emerald-500/50'
                      : 'bg-white border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-emerald-400 group-hover:underline">
                      {ind.label}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                  </div>
                  <div className="font-mono-tabular text-[11px] text-slate-400">
                    Current: {ind.shortValueContext}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    {ind.transmissionChannel}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Source & Timestamp Provenance Footer */}
          <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono-tabular">
            <div>
              <span>Original Publisher: </span>
              <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                {art.sourceName}
              </strong>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>Published: {art.publishedAtIst}</span>
            </div>
            <a
              href={art.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-sans font-medium"
            >
              <span>Read Original Source Release</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  const renderArticleCard = (art: EconomicNewsArticle, isCompact = false) => {
    const isExpanded = Boolean(expandedArticleIds[art.id]);
    const dirStyle = DIRECTION_STYLES[art.intelligence.impactAssessment.direction];

    return (
      <article
        key={art.id}
        className={`rounded-xl border p-4 sm:p-5 transition-colors flex flex-col justify-between ${
          theme === 'dark'
            ? 'bg-[#0B1325] border-slate-800/90 hover:border-slate-700'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
        }`}
      >
        <div className="space-y-2.5">
          {/* Zero-Pill Static Metadata Line separated by middle dots */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular text-slate-400">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={
                  art.sourceType === 'official_india'
                    ? 'text-emerald-400 font-semibold'
                    : art.sourceType === 'official_international'
                    ? 'text-cyan-400 font-semibold'
                    : 'text-amber-400 font-semibold'
                }
              >
                {art.sourceShortName}
              </span>
              <span aria-hidden="true">·</span>
              <span>{art.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">
                {NEWS_SUBTOPICS_META[art.subTopicId]?.shortLabel || art.subTopicLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span title={art.publishedAtIst}>{art.relativeTimeLabel}</span>
            </div>
          </div>

          {/* Headline */}
          <h3
            className={`font-display font-semibold tracking-tight leading-snug ${
              isCompact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
            } ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}
          >
            <a
              href={art.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              {art.headline}
            </a>
          </h3>

          {/* Concise Summary */}
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {art.conciseSummary}
          </p>

          {/* Compact Preview of Affected Indicators & Impact Direction */}
          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono-tabular text-[11px] text-slate-400">
              Impact:{' '}
              <strong className={dirStyle.text}>
                {art.intelligence.impactAssessment.direction.toUpperCase()}
              </strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-tabular text-[11px] text-slate-400">
              Linked Indicators:
            </span>
            {art.intelligence.affectedIndicators.map((ind) => (
              <button
                key={ind.id}
                type="button"
                onClick={() => handleIndicatorJump(ind)}
                className={`px-2 py-0.5 rounded border text-[11px] font-mono-tabular transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  theme === 'dark'
                    ? 'bg-[#060B16] border-slate-800 text-emerald-400 hover:border-emerald-500/50'
                    : 'bg-slate-50 border-slate-200 text-emerald-700 hover:border-emerald-500'
                }`}
              >
                <span>{ind.label}</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions: Toggle "Why It Matters" Intelligence + Original Link */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => toggleArticleIntelligence(art.id)}
            className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {isExpanded
                ? 'Hide "Why It Matters for India" Analysis'
                : 'Why It Matters for India’s Economy'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="flex items-center gap-3 font-mono-tabular text-[11px] text-slate-400">
            <span className="hidden sm:inline">{art.publishedAtIst}</span>
            <a
              href={art.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 font-sans font-medium hover:underline ${
                theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700'
              }`}
            >
              <span>Original Article</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {isExpanded && renderIntelligencePanel(art)}
      </article>
    );
  };

  // Overview Preview Mode (compact high-impact section for OverviewPage.tsx)
  if (mode === 'overview-preview') {
    const previewStories = articles.slice(0, 4);
    return (
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-xs font-mono-tabular text-emerald-400">
              04. Live Economic News &amp; Current Affairs Intelligence
            </div>
            <h2
              className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              India &amp; Global Policy, Trade, and Market Transmission
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onRefreshNow}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#0B1325] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Feed</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectPage('economic-news')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Full News Intelligence Terminal ({articles.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Live News Aggregation Alert</div>
                <p className="text-amber-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefreshNow}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-medium cursor-pointer shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {isLoading && articles.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-5 h-44 animate-pulse ${
                  theme === 'dark'
                    ? 'bg-[#0B1325] border-slate-800/80'
                    : 'bg-slate-100 border-slate-200'
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {previewStories.map((art) => renderArticleCard(art, true))}
          </div>
        )}
      </section>
    );
  }

  // Full Editorial Intelligence Terminal Mode
  return (
    <div className="space-y-8">
      {/* 1. Executive Header & Controls */}
      <section
        className={`rounded-2xl border p-6 sm:p-8 relative overflow-hidden space-y-6 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#0B1325] via-[#080F1E] to-[#060B16] border-slate-800/90'
            : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-slate-400">
              <span className="text-emerald-400 font-semibold tracking-wide">
                ECONOMIC NEWS &amp; CURRENT AFFAIRS INTELLIGENCE
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Official Releases (RBI · MoSPI · MoCI · Fed · ECB · World Bank) &amp; Economic Press
              </span>
            </div>

            <h1
              className={`font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              Policy Decisions, Global Shocks &amp; Why They Matter for India.
            </h1>

            <p
              className={`text-xs sm:text-sm leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Every story is filtered for macroeconomic relevance, deduplicated across official and financial feeds, and paired with an evidence-based transmission analysis linking current events directly to India&apos;s CPI inflation, Real GDP, RBI repo rate, USD/INR, crude oil basket, merchandise trade balance, and stock indices.
            </p>
          </div>

          {/* Right Controls: Refresh, Auto-Refresh, Source Status, Error Test */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onRefreshNow}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing Feeds...' : 'Refresh Live News'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleAutoRefresh}
              className={`px-3 py-2 rounded-lg border text-xs font-mono-tabular transition-colors cursor-pointer ${
                autoRefreshEnabled
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : theme === 'dark'
                  ? 'border-slate-800 bg-[#060B16] text-slate-400'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              Auto-Refresh (5m): {autoRefreshEnabled ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => setShowSourceDirectory((prev) => !prev)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#060B16] border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Sources ({newsData?.activeSourcesCount || 0}/
                {newsData?.sourcesStatus?.length || 10} Active)
              </span>
            </button>
          </div>
        </div>

        {/* Metadata Telemetry Bar */}
        <div
          className={`pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular ${
            theme === 'dark' ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Last Aggregated:{' '}
              <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                {newsData?.fetchedAtIst || 'Loading...'}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Verified Stories:{' '}
              <strong className="text-emerald-400">{articles.length}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Cache State:{' '}
              <strong className={isStaleCache ? 'text-amber-400' : 'text-cyan-400'}>
                {isStaleCache ? 'STALE_FALLBACK' : newsData?.cacheStatus || 'LIVE'}
              </strong>
            </span>
          </div>
          <div>
            Strict Anti-Clickbait Filter: Excludes entertainment, celebrity, sports &amp; non-economic noise
          </div>
        </div>

        {/* Collapsible Live Feed & Official Portal Provenance Directory */}
        {showSourceDirectory && (
          <div
            className={`p-4 rounded-xl border space-y-4 text-xs ${
              theme === 'dark'
                ? 'bg-[#060B16]/95 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-emerald-400 font-mono-tabular">
                VERIFIED OFFICIAL &amp; FINANCIAL NEWS SOURCES DIRECTORY
              </div>
              <button
                type="button"
                onClick={() => setShowSourceDirectory(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(newsData?.sourcesStatus || []).map((src) => (
                <div
                  key={src.id}
                  className={`p-3 rounded-lg border flex flex-col justify-between gap-1.5 ${
                    theme === 'dark'
                      ? 'bg-[#0B1325] border-slate-800/80'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{src.shortName}</span>
                    <span
                      className={`font-mono-tabular text-[11px] ${
                        src.status === 'ok'
                          ? 'text-emerald-400'
                          : src.status === 'degraded'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {src.status.toUpperCase()} ({src.articlesCount})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{src.name}</div>
                  <a
                    href={src.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>

            {/* Direct Official Indian & International Reference Portals */}
            <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Direct Official Portals:</span>
              <a
                href="https://pib.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 underline"
              >
                PIB India
              </a>
              <a
                href="https://www.rbi.org.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 underline"
              >
                Reserve Bank of India
              </a>
              <a
                href="https://mospi.gov.in/latest-releases"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 underline"
              >
                MoSPI Latest Releases
              </a>
              <a
                href="https://www.finmin.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 underline"
              >
                Ministry of Finance
              </a>
              <a
                href="https://www.commerce.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 underline"
              >
                Ministry of Commerce
              </a>
              <a
                href="https://www.imf.org/en/News"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 underline"
              >
                IMF News
              </a>
              <a
                href="https://www.worldbank.org/en/news"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 underline"
              >
                World Bank News
              </a>
              <a
                href="https://www.wto.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 underline"
              >
                WTO
              </a>
              <a
                href="https://www.bis.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 underline"
              >
                BIS Central Bank Hub
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Error or Stale Cache Banner */}
      {errorMessage && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-950/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-sm text-amber-300">
                Upstream News Feed Connection Interrupted
              </div>
              <p className="text-amber-200/90 leading-relaxed">{errorMessage}</p>
              {articles.length > 0 && (
                <p className="font-mono-tabular text-[11px] text-amber-300">
                  Displaying last verified cached stories ({newsData?.fetchedAtIst}). ArthNiti never fabricates or substitutes fake headlines.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSimulateError(false);
              onRefreshNow();
            }}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold cursor-pointer shrink-0"
          >
            Reconnect Live Feeds
          </button>
        </div>
      )}

      {/* 2. Filter & Search Workbench */}
      <section
        className={`rounded-xl border p-4 sm:p-5 space-y-4 ${
          theme === 'dark'
            ? 'bg-[#0B1325] border-slate-800/90'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Primary Macro Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'All Intelligence', count: categoryCounts.all, icon: Newspaper },
                { id: 'india', label: 'India Economy', count: categoryCounts.india, icon: Landmark },
                { id: 'global', label: 'Global Economy', count: categoryCounts.global, icon: Globe },
                {
                  id: 'current-affairs',
                  label: 'Current Affairs & Policy',
                  count: categoryCounts['current-affairs'],
                  icon: ShieldCheck,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setSelectedSubTopic('all');
                  }}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : theme === 'dark'
                      ? 'bg-[#060B16] border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`font-mono-tabular text-[11px] ${
                      active ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RBI, CPI, trade, crude, Fed, GDP..."
              className={`w-full pl-9 pr-8 py-2 rounded-lg border text-xs focus:outline-none focus:border-emerald-500 ${
                theme === 'dark'
                  ? 'bg-[#060B16] border-slate-800 text-slate-100 placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-Topic Filter Bar (19 granular sub-topics across India, Global, and Current Affairs) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] font-mono-tabular text-slate-400">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-emerald-400" />
              <span>FILTER BY ECONOMIC SUB-TOPIC ({visibleSubTopics.length} TOPICS):</span>
            </span>
            {(selectedCategory !== 'all' ||
              selectedSubTopic !== 'all' ||
              selectedSectionTab !== 'all' ||
              searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedSubTopic('all')}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
                selectedSubTopic === 'all'
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-medium'
                  : theme === 'dark'
                  ? 'border-slate-800 bg-[#060B16] text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Sub-Topics
            </button>
            {visibleSubTopics.map(([subId, meta]) => {
              const active = selectedSubTopic === subId;
              return (
                <button
                  key={subId}
                  type="button"
                  onClick={() => setSelectedSubTopic(subId)}
                  title={meta.label}
                  className={`px-2.5 py-1 rounded-md border text-xs transition-colors cursor-pointer ${
                    active
                      ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-medium'
                      : theme === 'dark'
                      ? 'border-slate-800 bg-[#060B16] text-slate-400 hover:text-slate-200'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {meta.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed Stream Section Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tabular text-[11px] text-slate-400">STREAM FOCUS:</span>
            {(
              [
                { id: 'all', label: 'All Streams' },
                { id: 'india-latest', label: 'Latest India News' },
                { id: 'global-latest', label: 'Latest Global Economic News' },
                { id: 'policy-announcements', label: 'Major Policy Announcements' },
                { id: 'market-impact', label: 'Market-Impact Feed' },
              ] as const
            ).map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSectionTab(sec.id)}
                className={`px-2.5 py-1 rounded border text-xs transition-colors cursor-pointer ${
                  selectedSectionTab === sec.id
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 font-medium'
                    : theme === 'dark'
                    ? 'border-slate-800 bg-[#060B16]/70 text-slate-400 hover:text-slate-200'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          <div className="font-mono-tabular text-xs text-slate-400">
            Showing <strong className="text-emerald-400">{filteredArticles.length}</strong> of{' '}
            {articles.length} stories
          </div>
        </div>
      </section>

      {/* 3. Loading Skeleton State */}
      {isLoading && articles.length === 0 && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-6 h-64 animate-pulse ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                className={`rounded-xl border p-5 h-48 animate-pulse ${
                  theme === 'dark'
                    ? 'bg-[#0B1325] border-slate-800'
                    : 'bg-slate-100 border-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. Empty Filter State */}
      {!isLoading && filteredArticles.length === 0 && (
        <div
          className={`rounded-2xl border p-10 text-center space-y-3 ${
            theme === 'dark'
              ? 'bg-[#0B1325] border-slate-800 text-slate-300'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <Newspaper className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="font-display text-lg font-semibold">
            No Economic Stories Match Your Current Filter Selection
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try clearing your search query or switching from a granular sub-topic back to &ldquo;All Sub-Topics&rdquo; to inspect the full live stream.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters &amp; Show All Stories
          </button>
        </div>
      )}

      {/* 5. Featured Top Economic Story + Latest-News Timeline Grid */}
      {featuredArticle && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Featured Top Economic Story (8 columns) */}
          <div
            className={`lg:col-span-8 rounded-2xl border p-6 sm:p-7 space-y-4 ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-[#0D1830] via-[#0B1325] to-[#080F1E] border-emerald-500/35'
                : 'bg-white border-emerald-300 shadow-xs'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-emerald-400 font-semibold tracking-wide">
                  FEATURED TOP ECONOMIC STORY
                </span>
                <span className="text-slate-500" aria-hidden="true">
                  ·
                </span>
                <span className="text-amber-400 font-semibold">
                  {featuredArticle.sourceShortName}
                </span>
                <span className="text-slate-500" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-300">{featuredArticle.subTopicLabel}</span>
              </div>
              <span className="text-slate-400">{featuredArticle.publishedAtIst}</span>
            </div>

            <h2
              className={`font-display text-xl sm:text-2xl lg:text-[26px] font-semibold tracking-tight leading-snug ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
            >
              <a
                href={featuredArticle.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                {featuredArticle.headline}
              </a>
            </h2>

            <p
              className={`text-sm sm:text-base leading-relaxed ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              {featuredArticle.conciseSummary}
            </p>

            {/* Always render the full "Why It Matters for India's Economy" Intelligence Panel on the Featured Top Story */}
            {renderIntelligencePanel(featuredArticle)}
          </div>

          {/* Right 4 Columns: Latest-News Chronological Timeline */}
          <div
            className={`lg:col-span-4 rounded-2xl border p-5 sm:p-6 space-y-4 ${
              theme === 'dark'
                ? 'bg-[#0B1325] border-slate-800/90'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <div>
                <div className="text-[11px] font-mono-tabular text-cyan-400">
                  CHRONOLOGICAL DISPATCH
                </div>
                <h3 className="font-display text-base font-semibold mt-0.5">
                  Latest-News Timeline (IST)
                </h3>
              </div>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="divide-y divide-slate-800/60">
              {timelineStories.map((item) => (
                <div key={`timeline-${item.id}`} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular text-slate-400">
                    <span className="text-emerald-400 font-medium">{item.sourceShortName}</span>
                    <span>{item.relativeTimeLabel}</span>
                  </div>
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-xs font-medium leading-snug hover:text-emerald-400 transition-colors ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {item.headline}
                  </a>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {item.intelligence.affectedIndicators.slice(0, 2).map((ind) => (
                      <button
                        key={`tl-${item.id}-${ind.id}`}
                        type="button"
                        onClick={() => handleIndicatorJump(ind)}
                        className="text-[10px] font-mono-tabular text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                      >
                        #{ind.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Major Economic Policy Announcements & Market-Impact Highlights Row */}
      {selectedCategory === 'all' &&
        selectedSubTopic === 'all' &&
        selectedSectionTab === 'all' &&
        !searchQuery &&
        articles.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Major Economic Policy Announcements */}
            <div
              className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
                theme === 'dark'
                  ? 'bg-[#0B1325] border-slate-800/90'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div>
                  <div className="text-[11px] font-mono-tabular text-amber-400">
                    CENTRAL BANKS, MINISTRIES &amp; MULTILATERALS
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-semibold mt-0.5">
                    Major Economic Policy Announcements
                  </h3>
                </div>
                <Landmark className="w-4 h-4 text-amber-400" />
              </div>

              <div className="divide-y divide-slate-800/60">
                {policyAnnouncements.map((pol) => (
                  <div key={`policy-${pol.id}`} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono-tabular text-slate-400">
                      <span className="text-amber-400 font-semibold">{pol.sourceShortName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{pol.intelligence.attributionType}</span>
                      <span aria-hidden="true">·</span>
                      <span>{pol.publishedAtIst}</span>
                    </div>
                    <a
                      href={pol.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-xs sm:text-sm font-semibold hover:text-emerald-400 transition-colors ${
                        theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {pol.headline}
                    </a>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {pol.intelligence.whyItMatters}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Market-Impact News Feed */}
            <div
              className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
                theme === 'dark'
                  ? 'bg-[#0B1325] border-slate-800/90'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div>
                  <div className="text-[11px] font-mono-tabular text-emerald-400">
                    EQUITIES, BONDS, RUPEE &amp; COMMODITIES
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-semibold mt-0.5">
                    Market-Impact News Feed
                  </h3>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="divide-y divide-slate-800/60">
                {marketImpactStories.map((mkt) => {
                  const dir = DIRECTION_STYLES[mkt.intelligence.impactAssessment.direction];
                  return (
                    <div key={`mkt-${mkt.id}`} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span className="text-emerald-400 font-semibold">
                            {mkt.sourceShortName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{NEWS_SUBTOPICS_META[mkt.subTopicId]?.shortLabel}</span>
                        </div>
                        <span className={dir.text}>
                          Impact: {mkt.intelligence.impactAssessment.direction.toUpperCase()}
                        </span>
                      </div>
                      <a
                        href={mkt.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block text-xs sm:text-sm font-semibold hover:text-emerald-400 transition-colors ${
                          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                        }`}
                      >
                        {mkt.headline}
                      </a>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {mkt.intelligence.impactOnIndia}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

      {/* 7. Main Categorized Article Cards Grid (Latest India News, Global News & Current Affairs) */}
      {remainingArticles.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-xs font-mono-tabular text-emerald-400">
                COMPLETE VERIFIED FEED &amp; INDICATOR TRANSMISSION CARDS
              </div>
              <h2
                className={`font-display text-xl sm:text-2xl font-semibold tracking-tight mt-0.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-950'
                }`}
              >
                {selectedCategory === 'india'
                  ? 'Latest India Economic & Policy Intelligence'
                  : selectedCategory === 'global'
                  ? 'Latest Global Macroeconomic & Central-Bank News'
                  : selectedCategory === 'current-affairs'
                  ? 'Current Affairs, Regulatory & Structural Developments'
                  : 'All India & Global Economic Dispatches'}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Click &ldquo;Why It Matters for India&rsquo;s Economy&rdquo; on any card to inspect full transmission channels.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {remainingArticles.map((art) => renderArticleCard(art, false))}
          </div>
        </section>
      )}
    </div>
  );
};

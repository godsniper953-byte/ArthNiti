import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  BarChart2,
  BookOpen,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Droplets,
  GitCompare,
  GraduationCap,
  Info,
  Landmark,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  X,
} from 'lucide-react';
import { PageId } from '../../types/economy';

export type NavGroupId = 'overview' | 'economy' | 'markets' | 'research' | 'platform';

export const SIDEBAR_EXPANDED_WIDTH_PX = 264;
export const SIDEBAR_COLLAPSED_WIDTH_PX = 72;

export interface NavItemConfig {
  id: PageId;
  groupId: NavGroupId;
  groupTitle: string;
  label: string;
  shortDesc: string;
  icon: React.FC<{ className?: string }>;
}

export interface NavGroupConfig {
  id: NavGroupId;
  title: string;
  collapsible: boolean;
  items: NavItemConfig[];
}

export const ARTHNITI_NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'overview',
    title: 'Overview',
    collapsible: false,
    items: [
      {
        id: 'overview',
        groupId: 'overview',
        groupTitle: 'Overview',
        label: 'Dashboard Overview',
        shortDesc: 'Macro Pulse & 3D Trade Network',
        icon: Activity,
      },
    ],
  },
  {
    id: 'economy',
    title: 'Economy',
    collapsible: true,
    items: [
      {
        id: 'gdp-growth',
        groupId: 'economy',
        groupTitle: 'Economy',
        label: 'GDP & Growth',
        shortDesc: 'National Accounts & Sector GVA',
        icon: TrendingUp,
      },
      {
        id: 'inflation',
        groupId: 'economy',
        groupTitle: 'Economy',
        label: 'Inflation & Prices',
        shortDesc: 'CPI Basket & RBI Target Band',
        icon: BarChart2,
      },
      {
        id: 'labour-market',
        groupId: 'economy',
        groupTitle: 'Economy',
        label: 'Labour & Employment',
        shortDesc: 'PLFS Unemployment & LFPR',
        icon: Briefcase,
      },
      {
        id: 'comparisons',
        groupId: 'economy',
        groupTitle: 'Economy',
        label: 'Economic Comparisons',
        shortDesc: 'Normalized Dual-Series Explorer',
        icon: GitCompare,
      },
    ],
  },
  {
    id: 'markets',
    title: 'Markets & Trade',
    collapsible: true,
    items: [
      {
        id: 'financial-markets',
        groupId: 'markets',
        groupTitle: 'Markets & Trade',
        label: 'Indian Markets & Policy',
        shortDesc: 'NSE/BSE Indices & RBI Repo Rate',
        icon: Landmark,
      },
      {
        id: 'currency-oil',
        groupId: 'markets',
        groupTitle: 'Markets & Trade',
        label: 'FX, Crude Oil & Trade',
        shortDesc: 'USD/INR, Indian Basket & Exports',
        icon: Droplets,
      },
    ],
  },
  {
    id: 'research',
    title: 'Research & Insights',
    collapsible: true,
    items: [
      {
        id: 'economist-bites',
        groupId: 'research',
        groupTitle: 'Research & Insights',
        label: "Economists' Bites",
        shortDesc: 'Verified Views & Quick Summaries',
        icon: GraduationCap,
      },
      {
        id: 'economic-news',
        groupId: 'research',
        groupTitle: 'Research & Insights',
        label: 'Economic News',
        shortDesc: 'India & Global Policy Intelligence',
        icon: Newspaper,
      },
      {
        id: 'data-sources',
        groupId: 'research',
        groupTitle: 'Research & Insights',
        label: 'Methodology & Sources',
        shortDesc: 'Provenance, Standards & QA',
        icon: Database,
      },
    ],
  },
  {
    id: 'platform',
    title: 'Platform',
    collapsible: false,
    items: [
      {
        id: 'about',
        groupId: 'platform',
        groupTitle: 'Platform',
        label: 'About ArthNiti',
        shortDesc: 'Mission, Vision & Principles',
        icon: BookOpen,
      },
    ],
  },
];

// Flattened list of all 11 verified navigation routes for TopBar search and route audits
export const ARTHNITI_NAV_ITEMS: NavItemConfig[] = ARTHNITI_NAV_GROUPS.flatMap(
  (group) => group.items
);

export const DEFAULT_EXPANDED_NAV_GROUPS: Record<NavGroupId, boolean> = {
  overview: true,
  economy: true,
  markets: true,
  research: true,
  platform: true,
};

/**
 * Resolve which navigation category contains a given PageId.
 */
export function getNavGroupForPage(pageId: PageId): NavGroupId {
  const found = ARTHNITI_NAV_ITEMS.find((item) => item.id === pageId);
  return found ? found.groupId : 'overview';
}

/**
 * Pure helper to toggle a collapsible navigation category independently of the main sidebar collapse state.
 */
export function toggleNavGroupExpansion(
  current: Record<NavGroupId, boolean>,
  groupId: NavGroupId
): Record<NavGroupId, boolean> {
  const groupConfig = ARTHNITI_NAV_GROUPS.find((g) => g.id === groupId);
  if (!groupConfig || !groupConfig.collapsible) {
    return current;
  }
  return {
    ...current,
    [groupId]: !current[groupId],
  };
}

interface ActiveTooltipState {
  id: string;
  label: string;
  shortDesc: string;
  groupTitle: string;
  top: number;
}

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  theme: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  theme,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Independent collapsible category state for expanded sidebar mode
  const [expandedGroups, setExpandedGroups] = useState<Record<NavGroupId, boolean>>(
    DEFAULT_EXPANDED_NAV_GROUPS
  );

  // Fixed-position unclipped tooltip state for collapsed icon-rail mode
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltipState | null>(null);

  // Ensure the category containing the active page is expanded when activePage changes
  useEffect(() => {
    const activeGroupId = getNavGroupForPage(activePage);
    setExpandedGroups((prev) =>
      prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }
    );
  }, [activePage]);

  // Clear floating tooltip whenever sidebar expands or activePage changes
  useEffect(() => {
    setActiveTooltip(null);
  }, [collapsed, activePage, mobileOpen]);

  // Lock background document scroll when the mobile navigation drawer is open
  // and support Escape key / desktop resize dismissal
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        onCloseMobile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileOpen, onCloseMobile]);

  const handleSelect = (id: PageId) => {
    setActiveTooltip(null);
    onSelectPage(id);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const handleToggleGroup = (groupId: NavGroupId) => {
    setExpandedGroups((prev) => toggleNavGroupExpansion(prev, groupId));
  };

  const showCollapsedTooltip = (
    el: HTMLElement,
    info: { id: string; label: string; shortDesc: string; groupTitle: string }
  ) => {
    const rect = el.getBoundingClientRect();
    const centerY = Math.min(Math.max(rect.top + rect.height / 2, 36), window.innerHeight - 36);
    setActiveTooltip({
      ...info,
      top: centerY,
    });
  };

  const renderSidebarPanel = (isMobileDrawer: boolean) => {
    const isNarrow = collapsed && !isMobileDrawer;
    const isDark = theme === 'dark';

    return (
      <div
        className={`h-full flex flex-col select-none ${
          shouldReduceMotion ? '' : 'transition-[width] duration-200 ease-out'
        } ${
          isDark
            ? 'bg-[#080F1E] border-r border-slate-800/90 text-slate-200'
            : 'bg-white border-r border-slate-200 text-slate-800'
        } ${isNarrow ? 'w-[72px]' : 'w-[264px]'}`}
      >
        {/* 1. Pinned Top Header: Brand Identity + Quick Collapse/Close Control */}
        <div
          className={`h-16 shrink-0 flex items-center border-b ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          } ${isNarrow ? 'justify-center px-2' : 'justify-between px-3.5'}`}
        >
          <button
            type="button"
            onClick={() => handleSelect('overview')}
            onMouseEnter={(e) => {
              if (isNarrow) {
                showCollapsedTooltip(e.currentTarget, {
                  id: 'brand-home',
                  label: 'ArthNiti Terminal',
                  shortDesc: 'Return to Dashboard Overview',
                  groupTitle: 'Platform',
                });
              }
            }}
            onMouseLeave={() => {
              if (isNarrow) setActiveTooltip(null);
            }}
            onFocus={(e) => {
              if (isNarrow) {
                showCollapsedTooltip(e.currentTarget, {
                  id: 'brand-home',
                  label: 'ArthNiti Terminal',
                  shortDesc: 'Return to Dashboard Overview',
                  groupTitle: 'Platform',
                });
              }
            }}
            onBlur={() => {
              if (isNarrow) setActiveTooltip(null);
            }}
            aria-label="ArthNiti — Return to Dashboard Overview"
            className={`flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-emerald-500 cursor-pointer ${
              isNarrow ? 'justify-center w-10 h-10' : 'gap-2.5 min-w-0 py-1 pr-1 text-left'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-base text-emerald-400 tracking-tight">
                अ
              </span>
            </div>
            {!isNarrow && (
              <div className="min-w-0">
                <div
                  className={`font-display font-bold text-[15px] tracking-tight leading-none truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  ARTHNITI
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-1">
                  Economic Intelligence
                </div>
              </div>
            )}
          </button>

          {/* Header Collapse Button (Expanded Desktop Mode) */}
          {!isMobileDrawer && !isNarrow && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              aria-expanded={true}
              title="Collapse sidebar"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Drawer Close Button */}
          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dedicated Top Expand Button when Desktop Sidebar is Collapsed */}
        {!isMobileDrawer && isNarrow && (
          <div
            className={`px-2 py-2 border-b shrink-0 flex justify-center ${
              isDark ? 'border-slate-800/70' : 'border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={onToggleCollapse}
              onMouseEnter={(e) =>
                showCollapsedTooltip(e.currentTarget, {
                  id: 'expand-top',
                  label: 'Expand Sidebar',
                  shortDesc: 'Show navigation labels and categories',
                  groupTitle: 'Navigation Control',
                })
              }
              onMouseLeave={() => setActiveTooltip(null)}
              onFocus={(e) =>
                showCollapsedTooltip(e.currentTarget, {
                  id: 'expand-top',
                  label: 'Expand Sidebar',
                  shortDesc: 'Show navigation labels and categories',
                  groupTitle: 'Navigation Control',
                })
              }
              onBlur={() => setActiveTooltip(null)}
              aria-label="Expand sidebar"
              aria-expanded={false}
              className={`w-11 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                isDark
                  ? 'bg-[#0C162B] border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-slate-100'
              }`}
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. Scrollable Categorized Navigation Region */}
        <nav
          aria-label="Primary Economic Modules"
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${
            isNarrow ? 'py-2.5 px-2 space-y-2' : 'py-3 px-2.5 space-y-3.5'
          }`}
        >
          {ARTHNITI_NAV_GROUPS.map((group, groupIndex) => {
            const isGroupExpanded = expandedGroups[group.id] ?? true;
            const hasActiveChild = group.items.some((item) => item.id === activePage);

            return (
              <div
                key={group.id}
                role="group"
                aria-label={group.title}
                className="space-y-1"
              >
                {/* Category Header (Expanded Mode) or Subtle Hairline Divider (Collapsed Mode) */}
                {isNarrow ? (
                  groupIndex > 0 ? (
                    <div
                      aria-hidden="true"
                      className={`h-px w-7 mx-auto my-1.5 ${
                        isDark ? 'bg-slate-800/90' : 'bg-slate-200'
                      }`}
                    />
                  ) : null
                ) : group.collapsible ? (
                  <button
                    type="button"
                    onClick={() => handleToggleGroup(group.id)}
                    aria-expanded={isGroupExpanded}
                    aria-controls={`sidebar-group-items-${group.id}`}
                    className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                      hasActiveChild
                        ? isDark
                          ? 'text-emerald-400'
                          : 'text-emerald-700'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span className="truncate">{group.title}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                        isGroupExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>
                ) : (
                  <div
                    className={`px-2.5 py-1 text-[11px] font-semibold tracking-wider truncate ${
                      hasActiveChild
                        ? isDark
                          ? 'text-emerald-400'
                          : 'text-emerald-700'
                        : isDark
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {group.title}
                  </div>
                )}

                {/* Category Items (Always visible when sidebar is collapsed so all icons remain reachable) */}
                {(isNarrow || !group.collapsible || isGroupExpanded) && (
                  <div
                    id={`sidebar-group-items-${group.id}`}
                    className="space-y-0.5"
                  >
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePage === item.id;
                      const tooltipId = `sidebar-tooltip-${item.id}`;

                      return (
                        <div key={item.id} className="relative">
                          <button
                            type="button"
                            onClick={() => handleSelect(item.id)}
                            onMouseEnter={(e) => {
                              if (isNarrow) {
                                showCollapsedTooltip(e.currentTarget, {
                                  id: item.id,
                                  label: item.label,
                                  shortDesc: item.shortDesc,
                                  groupTitle: group.title,
                                });
                              }
                            }}
                            onMouseLeave={() => {
                              if (isNarrow) setActiveTooltip(null);
                            }}
                            onFocus={(e) => {
                              if (isNarrow) {
                                showCollapsedTooltip(e.currentTarget, {
                                  id: item.id,
                                  label: item.label,
                                  shortDesc: item.shortDesc,
                                  groupTitle: group.title,
                                });
                              }
                            }}
                            onBlur={() => {
                              if (isNarrow) setActiveTooltip(null);
                            }}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={
                              isNarrow ? `${item.label} — ${item.shortDesc}` : undefined
                            }
                            aria-describedby={isNarrow ? tooltipId : undefined}
                            className={`relative w-full flex items-center rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                              isNarrow
                                ? 'justify-center h-10 w-11 mx-auto px-0'
                                : 'gap-3 px-2.5 py-2'
                            } ${
                              isActive
                                ? isDark
                                  ? 'text-white bg-emerald-500/14'
                                  : 'text-emerald-950 bg-emerald-500/12'
                                : isDark
                                ? 'text-slate-300 hover:text-white hover:bg-slate-800/55'
                                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                            }`}
                          >
                            {isActive && (
                              <motion.span
                                layoutId={
                                  isMobileDrawer ? 'activeNavMobile' : 'activeNavDesktop'
                                }
                                className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r"
                                transition={
                                  shouldReduceMotion
                                    ? { duration: 0 }
                                    : { type: 'spring', stiffness: 380, damping: 32 }
                                }
                              />
                            )}

                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? isDark
                                    ? 'text-emerald-400'
                                    : 'text-emerald-600'
                                  : isDark
                                  ? 'text-slate-400'
                                  : 'text-slate-500'
                              }`}
                            />

                            {!isNarrow && (
                              <div className="min-w-0 flex-1 text-left">
                                <div className="text-[12.5px] font-medium leading-tight truncate">
                                  {item.label}
                                </div>
                                <div
                                  className={`text-[10.5px] font-normal leading-tight truncate mt-0.5 ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                  }`}
                                >
                                  {item.shortDesc}
                                </div>
                              </div>
                            )}
                          </button>

                          {isNarrow && (
                            <span id={tooltipId} role="tooltip" className="sr-only">
                              {group.title}: {item.label} — {item.shortDesc}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 3. Pinned Bottom Footer: Data Provenance Note + Collapse/Expand Toggle */}
        <div
          className={`shrink-0 border-t ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          } ${isNarrow ? 'p-2' : 'p-3 space-y-2'}`}
        >
          {!isNarrow && (
            <div
              className={`p-2.5 rounded-lg border text-[11px] leading-snug ${
                isDark
                  ? 'bg-[#060B16] border-slate-800/90 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-0.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Verified Official Data</span>
              </div>
              <p className="text-[10.5px] leading-relaxed">
                7 official macro CSV series (MoSPI, RBI, FBIL, PPAC, MoCI) + live server APIs.
              </p>
            </div>
          )}

          {!isMobileDrawer && (
            <button
              type="button"
              onClick={onToggleCollapse}
              onMouseEnter={(e) => {
                if (isNarrow) {
                  showCollapsedTooltip(e.currentTarget, {
                    id: 'expand-bottom',
                    label: 'Expand Sidebar',
                    shortDesc: 'Restore full navigation labels',
                    groupTitle: 'Navigation Control',
                  });
                }
              }}
              onMouseLeave={() => {
                if (isNarrow) setActiveTooltip(null);
              }}
              onFocus={(e) => {
                if (isNarrow) {
                  showCollapsedTooltip(e.currentTarget, {
                    id: 'expand-bottom',
                    label: 'Expand Sidebar',
                    shortDesc: 'Restore full navigation labels',
                    groupTitle: 'Navigation Control',
                  });
                }
              }}
              onBlur={() => {
                if (isNarrow) setActiveTooltip(null);
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              className={`flex items-center justify-center gap-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                isNarrow ? 'w-11 h-9 mx-auto px-0' : 'w-full py-2 px-3'
              } ${
                isDark
                  ? 'bg-[#060B16] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="truncate">Collapse Sidebar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        aria-label="Primary Sidebar"
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 ${
          collapsed ? 'w-[72px]' : 'w-[264px]'
        } ${shouldReduceMotion ? '' : 'transition-[width] duration-200 ease-out'}`}
      >
        {renderSidebarPanel(false)}
      </aside>

      {/* Unclipped Floating Tooltip for Collapsed Desktop Sidebar (Hover & Keyboard Focus) */}
      {collapsed && !mobileOpen && activeTooltip && (
        <div
          role="status"
          aria-live="polite"
          style={{ top: `${activeTooltip.top}px`, left: `${SIDEBAR_COLLAPSED_WIDTH_PX + 10}px` }}
          className={`hidden lg:block fixed -translate-y-1/2 z-50 pointer-events-none px-3 py-2 rounded-lg border shadow-xl max-w-[240px] ${
            theme === 'dark'
              ? 'bg-[#0B1528] border-slate-700/90 text-slate-100'
              : 'bg-white border-[#CBD5E1] text-[#172033]'
          }`}
        >
          <div className="text-[10px] font-semibold tracking-wider text-emerald-400">
            {activeTooltip.groupTitle}
          </div>
          <div
            className={`text-xs font-semibold leading-snug mt-0.5 ${
              theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
            }`}
          >
            {activeTooltip.label}
          </div>
          <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
            {activeTooltip.shortDesc}
          </div>
        </div>
      )}

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full max-w-[85vw]">
            {renderSidebarPanel(true)}
          </div>
        </div>
      )}
    </>
  );
};

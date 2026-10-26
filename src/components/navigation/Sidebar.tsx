import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  BarChart2,
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Database,
  Droplets,
  GitCompare,
  Info,
  Landmark,
  Newspaper,
  TrendingUp,
  X,
} from 'lucide-react';
import { PageId } from '../../types/economy';

export interface NavItemConfig {
  id: PageId;
  label: string;
  shortDesc: string;
  icon: React.FC<{ className?: string }>;
}

export const ARTHNITI_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    shortDesc: 'Macro Pulse & 3D Network',
    icon: Activity,
  },
  {
    id: 'gdp-growth',
    label: 'GDP & Growth',
    shortDesc: 'National Accounts & GVA',
    icon: TrendingUp,
  },
  {
    id: 'inflation',
    label: 'Inflation',
    shortDesc: 'CPI Basket & RBI Target',
    icon: BarChart2,
  },
  {
    id: 'labour-market',
    label: 'Labour Market',
    shortDesc: 'PLFS Employment & LFPR',
    icon: Briefcase,
  },
  {
    id: 'currency-oil',
    label: 'Currency, Oil & Trade',
    shortDesc: 'Trade Balance, Crude & INR',
    icon: Droplets,
  },
  {
    id: 'financial-markets',
    label: 'Financial Markets',
    shortDesc: 'Indices & Sovereign Yields',
    icon: Landmark,
  },
  {
    id: 'economic-news',
    label: 'Economic News',
    shortDesc: 'India & Global Intelligence',
    icon: Newspaper,
  },
  {
    id: 'comparisons',
    label: 'Economic Comparisons',
    shortDesc: 'Normalized Dual Explorer',
    icon: GitCompare,
  },
  {
    id: 'data-sources',
    label: 'Data Sources',
    shortDesc: 'MoSPI, RBI & Methodology',
    icon: Database,
  },
  {
    id: 'about',
    label: 'About ArthNiti',
    shortDesc: 'Architecture & Mission',
    icon: BookOpen,
  },
];

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
  const handleSelect = (id: PageId) => {
    onSelectPage(id);
    onCloseMobile();
  };

  const sidebarContent = (isMobileDrawer: boolean) => {
    const isNarrow = collapsed && !isMobileDrawer;

    return (
      <div
        className={`h-full flex flex-col justify-between select-none transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-[#080F1E] border-r border-slate-800/90 text-slate-200'
            : 'bg-white border-r border-slate-200 text-slate-800'
        } ${isNarrow ? 'w-[72px]' : 'w-[260px]'}`}
      >
        {/* Top Brand Mark */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/60">
            <button
              type="button"
              onClick={() => handleSelect('overview')}
              className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-md cursor-pointer overflow-hidden"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <span className="font-display font-bold text-base text-emerald-400 tracking-tight">
                  अ
                </span>
              </div>
              {!isNarrow && (
                <div className="min-w-0">
                  <div
                    className={`font-display font-bold text-base tracking-tight leading-none ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    ARTHNITI
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    Economic Intelligence
                  </div>
                </div>
              )}
            </button>

            {isMobileDrawer && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-2.5 space-y-1" aria-label="Primary Economic Modules">
            {ARTHNITI_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                      isActive
                        ? theme === 'dark'
                          ? 'text-white bg-emerald-500/12'
                          : 'text-emerald-950 bg-emerald-500/10'
                        : theme === 'dark'
                        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    } ${isNarrow ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId={isMobileDrawer ? 'activeNavMobile' : 'activeNavDesktop'}
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    {!isNarrow && (
                      <div className="min-w-0 text-left">
                        <div className="truncate">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {item.shortDesc}
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Tooltip when collapsed */}
                  {isNarrow && (
                    <div
                      role="tooltip"
                      className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 px-2.5 py-1.5 rounded-md bg-slate-900 text-white text-xs border border-slate-700 shadow-lg whitespace-nowrap"
                    >
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.shortDesc}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Collapse Toggle & Sample Data Transparency Footer */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {!isNarrow && (
            <div
              className={`p-2.5 rounded-lg border text-[11px] leading-snug ${
                theme === 'dark'
                  ? 'bg-[#060B16] border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium text-amber-400 mb-0.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Illustrative Data Mode</span>
              </div>
              <span>
                Structured 10-year sample series. Configure <code className="font-mono-tabular">VITE_API_BASE_URL</code> for FastAPI backend.
              </span>
            </div>
          )}

          {!isMobileDrawer && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                theme === 'dark'
                  ? 'bg-[#060B16] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Sidebar</span>
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent(false)}
      </aside>

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent(true)}</div>
        </div>
      )}
    </>
  );
};

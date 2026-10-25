import React from 'react';
import {
  BookOpen,
  Code2,
  Cpu,
  Database,
  Layers,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { getServiceStatus } from '../services/economyService';
import { PageId } from '../types/economy';

interface AboutPageProps {
  theme: 'dark' | 'light';
  onSelectPage: (pageId: PageId) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ theme, onSelectPage }) => {
  const serviceStatus = getServiceStatus();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Platform Architecture &amp; Editorial Charter</span>
        </div>
        <h1
          className={`font-display text-2xl sm:text-3xl font-semibold tracking-tight mt-1 ${
            theme === 'dark' ? 'text-white' : 'text-slate-950'
          }`}
        >
          About ArthNiti — Indian Economic Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Understand the Economy. Discover the Data. Built for economists, policy researchers, analysts, and students seeking transparent Indian macroeconomic visualization.
        </p>
      </div>

      {/* Mission & Editorial Principles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          className={`rounded-xl border p-5 sm:p-6 space-y-2.5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold">Econometric Honesty</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            ArthNiti never assumes every numerical increase is positive or every decrease is negative. Inflation, unemployment, crude import costs, and currency movements are evaluated against their real macroeconomic context and RBI policy mandates.
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 sm:p-6 space-y-2.5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <Layers className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold">Zero Fabricated Claims</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every chart clearly distinguishes between illustrative development data and live upstream API feeds, explains why correlation does not establish causation, and enforces unit-compatibility normalization before comparing multi-series data.
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 sm:p-6 space-y-2.5 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold">Modular FastAPI Readiness</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All components consume data exclusively through the typed <code className="font-mono-tabular">economyService.ts</code> layer. Connecting a Python FastAPI backend requires only setting <code className="font-mono-tabular">VITE_API_BASE_URL</code> in your environment configuration.
          </p>
        </div>
      </div>

      {/* FastAPI Backend Integration Contract & Windows Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FastAPI Contract (6 cols) */}
        <div
          className={`lg:col-span-6 rounded-xl border p-5 sm:p-6 space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono-tabular">
            <Database className="w-4 h-4" />
            <span>Service Layer &amp; Future FastAPI Integration</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            Configurable Backend Architecture
          </h2>

          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span>Current Data Service Mode:</span>
              <span className="font-mono-tabular text-amber-400 font-semibold">
                {serviceStatus.mode === 'live_api' ? 'Connected FastAPI' : 'Illustrative Mock Dataset'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span>Configured VITE_API_BASE_URL:</span>
              <span className="font-mono-tabular text-slate-300">
                {serviceStatus.apiBaseUrl || '(Not set — using local 10Y dataset)'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span>Expected FastAPI Endpoint:</span>
              <span className="font-mono-tabular text-emerald-400">GET /api/v1/indicators</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            When the FastAPI backend is deployed, set <code className="font-mono-tabular">VITE_API_BASE_URL=http://localhost:8000</code> in <code className="font-mono-tabular">.env.local</code>. If the upstream API is unreachable or times out, ArthNiti gracefully degrades to the verified local dataset without crashing the interface.
          </p>

          <button
            type="button"
            onClick={() => onSelectPage('data-sources')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Inspect Official Data Sources Directory
          </button>
        </div>

        {/* Windows & Local Setup Guide (6 cols) */}
        <div
          className={`lg:col-span-6 rounded-xl border p-5 sm:p-6 space-y-4 ${
            theme === 'dark' ? 'bg-[#0B1325] border-slate-800/90' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-tabular">
            <Terminal className="w-4 h-4" />
            <span>Developer Quickstart (Windows PowerShell / CMD)</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            Local Installation &amp; Deployment Commands
          </h2>

          <pre
            className={`p-4 rounded-lg border font-mono-tabular text-xs overflow-x-auto leading-relaxed ${
              theme === 'dark'
                ? 'bg-[#060B16] border-slate-800 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-emerald-300'
            }`}
          >
{`# 1. Clone the repository on Windows
git clone https://github.com/your-username/arthniti-economic-intelligence.git
cd arthniti-economic-intelligence

# 2. Copy environment configuration (PowerShell)
Copy-Item .env.example .env.local

# 3. Install dependencies and start Vite dev server
npm install
npm run dev

# 4. Create production static build for Vercel / GitHub Pages
npm run build
npm run preview`}
          </pre>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Repository Target: <strong className="font-mono-tabular text-slate-200">arthniti-economic-intelligence</strong> (Static-host ready for Vercel &amp; GitHub Pages).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

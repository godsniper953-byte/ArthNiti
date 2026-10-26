import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { StructuredIndicatorSourceRegistryEntry } from '../types/economy';
import { getIndicatorProvenanceClassification } from '../services/indicatorRegistry';

interface ProvenanceAuditSectionProps {
  filteredRegistry: StructuredIndicatorSourceRegistryEntry[];
  totalCount: number;
  theme: 'dark' | 'light';
}

export const ProvenanceAuditSection: React.FC<ProvenanceAuditSectionProps> = ({
  filteredRegistry,
  totalCount,
  theme,
}) => {
  return (
    <section
      aria-label="Structured Indicator Source Registry"
      className={`rounded-xl border overflow-hidden ${
        theme === 'dark'
          ? 'bg-[#0B1325] border-slate-800/90 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="p-5 sm:p-6 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Indicator-Level Provenance &amp; Freshness Audit Matrix</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold mt-0.5">
            Structured Indicator Source Registry ({filteredRegistry.length} / {totalCount} Domains)
          </h2>
        </div>
        <span className="text-xs font-mono-tabular text-slate-400">
          Publication Time ≠ Retrieval Time · Static CSV vs. Live Proxy Distinguished
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr
              className={`border-b font-mono-tabular text-[11px] uppercase tracking-wider ${
                theme === 'dark'
                  ? 'bg-[#060B16] border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <th className="py-3 px-4">Indicator &amp; Provenance State</th>
              <th className="py-3 px-4">Provider &amp; Retrieval</th>
              <th className="py-3 px-4">Unit &amp; Definition</th>
              <th className="py-3 px-4">Ref Period &amp; Pub Date</th>
              <th className="py-3 px-4">Frequency &amp; Threshold</th>
              <th className="py-3 px-4">Methodological Safeguards</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRegistry.map((row) => {
              const classificationMeta = getIndicatorProvenanceClassification(row.indicatorId);
              const badgeText =
                classificationMeta?.badgeLabel ||
                (row.dataStatus === 'verified_official_csv'
                  ? 'Official Source Verified (Bundled CSV)'
                  : row.dataStatus === 'live_exchange_api_proxy'
                  ? 'Secondary Aggregator Feed (Delayed Proxy)'
                  : 'Live Server RSS/JSON Engine');

              const isIndependentlyVerified =
                classificationMeta?.classification === 'official_source_independently_verified' ||
                classificationMeta?.classification === 'static_historical_dataset';

              return (
                <tr
                  key={row.indicatorId}
                  className={
                    theme === 'dark' ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/80'
                  }
                >
                  <td className="py-3.5 px-4 align-top min-w-[210px]">
                    <div className="font-semibold text-emerald-400">{row.displayName}</div>
                    <div className="font-mono-tabular text-[11px] text-slate-400 mt-0.5">
                      ID: {row.indicatorId}
                    </div>
                    <div className="mt-1.5">
                      <span
                        className={`inline-block font-mono-tabular text-[10px] px-1.5 py-0.5 rounded border ${
                          isIndependentlyVerified
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {badgeText}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top min-w-[210px]">
                    <div className="font-medium">{row.provider}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{row.retrievalMethod}</div>
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono-tabular text-amber-400 hover:underline mt-1"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-3.5 px-4 align-top font-mono-tabular min-w-[180px]">
                    {row.unit}
                  </td>
                  <td className="py-3.5 px-4 align-top min-w-[175px]">
                    <div className="font-mono-tabular font-medium text-cyan-400">
                      {row.referencePeriod}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Published: {row.publicationTimestamp}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top min-w-[165px]">
                    <div className="font-mono-tabular">{row.expectedUpdateFrequency}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Freshness: {row.freshnessThreshold}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top text-slate-400 leading-relaxed min-w-[260px]">
                    <div>{row.methodologicalNotes}</div>
                    {classificationMeta && (
                      <div className="mt-1 text-[11px] text-slate-500">
                        {classificationMeta.verificationSummary}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

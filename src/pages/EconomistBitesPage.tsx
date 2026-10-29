import React from 'react';
import type { EconomistBitesResponse } from '../services/economistBitesService';
import { EconomistBitesSection } from '../components/bites/EconomistBitesSection';
import type { PageId } from '../types/economy';

interface EconomistBitesPageProps {
  data: EconomistBitesResponse | null;
  loading: boolean;
  error: string | null;
  isStaleCache?: boolean;
  onRefresh: (force?: boolean) => void;
  onSimulateError?: (simulate: boolean) => void;
  autoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
  onNavigate?: (page: PageId, indicatorId?: string) => void;
  theme?: 'dark' | 'light';
}

export const EconomistBitesPage: React.FC<EconomistBitesPageProps> = ({
  data,
  loading,
  error,
  isStaleCache = false,
  onRefresh,
  onSimulateError,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
  onNavigate,
  theme = 'dark',
}) => {
  return (
    <div className="space-y-6">
      <EconomistBitesSection
        data={data}
        loading={loading}
        error={error}
        isStaleCache={isStaleCache}
        onRefresh={onRefresh}
        onSimulateError={onSimulateError}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={onToggleAutoRefresh}
        mode="full"
        onNavigate={onNavigate}
        theme={theme}
      />
    </div>
  );
};

export default EconomistBitesPage;

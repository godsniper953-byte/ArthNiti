import React from 'react';
import { PageId } from '../types/economy';
import { EconomicNewsResponse } from '../services/economicNewsService';
import { EconomicNewsSection } from '../components/news/EconomicNewsSection';

interface EconomicNewsPageProps {
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
}

export const EconomicNewsPage: React.FC<EconomicNewsPageProps> = ({
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
}) => {
  return (
    <EconomicNewsSection
      newsData={newsData}
      isLoading={isLoading}
      errorMessage={errorMessage}
      isStaleCache={isStaleCache}
      autoRefreshEnabled={autoRefreshEnabled}
      onToggleAutoRefresh={onToggleAutoRefresh}
      onRefreshNow={onRefreshNow}
      onSimulateError={onSimulateError}
      onSelectPage={onSelectPage}
      theme={theme}
      mode="full"
    />
  );
};

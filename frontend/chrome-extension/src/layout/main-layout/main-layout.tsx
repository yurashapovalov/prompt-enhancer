import React, { useState } from 'react';
import './main-layout.css';
import { TabsHeader, TabType } from './components/tabs-header/tabs-header';
import { PromptsTab } from './components/tabs-content/prompts-tab/prompts-tab';
import { HistoryTab } from './components/tabs-content/history-tab/history-tab';
import { MarketplaceTab } from './components/tabs-content/marketplace-tab/marketplace-tab';

interface MainLayoutProps {
  onLogout?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = () => {
  // Состояние для активного таба
  const [activeTab, setActiveTab] = useState<TabType>('prompts');

  // Обработчик изменения таба
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="main-layout">
      <TabsHeader activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className="main-content">
        {activeTab === 'prompts' && <PromptsTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'marketplace' && <MarketplaceTab />}
      </div>
    </div>
  );
};

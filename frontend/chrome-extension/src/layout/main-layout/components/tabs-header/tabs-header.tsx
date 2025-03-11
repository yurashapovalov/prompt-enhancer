import React from 'react';
import './tabs-header.css';
import { Button } from '@components/ui/button/button';
import { Tooltip, TooltipPosition } from '@components/tech/tooltip/tooltip';

// Импорт иконок
import promptIconRaw from '@assets/icons/general/prompt-line.svg?raw';
import historyIconRaw from '@assets/icons/general/history-line.svg?raw';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import searchIconRaw from '@assets/icons/general/search-line.svg?raw';

// Типы табов
export type TabType = 'prompts' | 'history' | 'marketplace';

// Интерфейс пропсов
interface TabsHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabsHeader: React.FC<TabsHeaderProps> = ({ onTabChange }) => {
  // Массив с данными о табах
  const tabs: { id: TabType; icon: string; tooltip: string; position: TooltipPosition }[] = [
    { id: 'prompts', icon: promptIconRaw, tooltip: 'Prompts', position: 'bottom' },
    { id: 'history', icon: historyIconRaw, tooltip: 'Improvement history', position: 'bottom' },
    { id: 'marketplace', icon: searchIconRaw, tooltip: 'Marketplace', position: 'bottom-center' }
  ];

  return (
    <div className="tabs-header">
      <div className="tabs-header-left">
        {tabs.map(tab => (
          <Tooltip 
            key={tab.id} 
            content={tab.tooltip} 
            position={tab.position}
          >
            <Button
              variant="transparent"
              size="medium"
              icon={tab.icon}
              onClick={() => onTabChange(tab.id)}
            />
          </Tooltip>
        ))}
      </div>
      <div className="tabs-header-right">
        <Tooltip content="Open menu" position="bottom-right">
          <Button
            variant="transparent"
            size="medium"
            icon={menuIconRaw}
          />
        </Tooltip>
      </div>
    </div>
  );
};

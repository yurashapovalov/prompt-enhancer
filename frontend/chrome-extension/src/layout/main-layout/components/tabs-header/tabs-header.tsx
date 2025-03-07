import React from 'react';
import './tabs-header.css';
import { Button } from '@components/ui/button/button';

// Импорт иконок
import baseIconRaw from '@assets/icons/general/base-icon.svg?raw';
import promptIconRaw from '@assets/icons/general/prompt-line.svg?raw';
import historyIconRaw from '@assets/icons/general/history-line.svg?raw';
import bracesIconRaw from '@assets/icons/general/braces-line.svg?raw';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';

// Типы табов
export type TabType = 'prompts' | 'variables' | 'history' | 'marketplace';

// Интерфейс пропсов
interface TabsHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabsHeader: React.FC<TabsHeaderProps> = ({ onTabChange }) => {
  // Массив с данными о табах
  const tabs: { id: TabType; icon: string }[] = [
    { id: 'prompts', icon: promptIconRaw },
    { id: 'variables', icon: bracesIconRaw },
    { id: 'history', icon: historyIconRaw },
    { id: 'marketplace', icon: baseIconRaw }
  ];

  return (
    <div className="tabs-header">
      <div className="tabs-header-left">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant="transparent"
            size="medium"
            icon={tab.icon}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
      <div className="tabs-header-right">
        <Button
          variant="transparent"
          size="medium"
          icon={menuIconRaw}
        />
      </div>
    </div>
  );
};

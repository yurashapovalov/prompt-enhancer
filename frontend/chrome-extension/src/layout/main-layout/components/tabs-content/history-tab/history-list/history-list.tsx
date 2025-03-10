import React, { useState, useEffect } from 'react';
import './history-list.css';
import { ItemCard } from '@components/shared/item-card/item-card';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import { Button } from '@components/ui/button/button';
import { HistoryEntry } from '@services/api-service';
import { historyService } from '@services/services';
import { getCurrentUserToken } from '@services/auth-service';

interface HistoryListProps {
  onHistoryEntrySelect: (entryId: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onHistoryEntrySelect }) => {
  // State for storing history
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Function for date formatting
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown date';
    
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Subscribe to history service
  useEffect(() => {
    // Подписываемся на изменения данных
    const unsubscribe = historyService.subscribe(setHistory);
    
    // Отписываемся при размонтировании компонента
    return unsubscribe;
  }, []);

  // Check if there are history entries to display
  const hasHistory = history.length > 0;

  // Function to clear all history
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history?')) {
      return;
    }
    
    try {
      const token = await getCurrentUserToken();
      
      if (token) {
        // Очищаем историю на сервере
        await historyService.delete('all');
      }
    } catch (err: any) {
      console.error('Error clearing history:', err);
    }
  };

  return (
    <div className="history-list">
      <div className="history-list__header">
        <h1 className="history-list__title">History</h1>
        {hasHistory && (
          <div className="history-list__actions">
            <Button 
              variant="transparent"
              onClick={handleClearHistory}
            >
              Clear history
            </Button>
          </div>
        )}
      </div>
      
      <div className="history-list__content">
        {hasHistory ? (
          <div className="history-list__items">
            {history.map(entry => (
              <ItemCard
                key={entry.id}
                title={`Request from ${formatDate(entry.timestamp)}`}
                color="var(--color-prompt-tile-silver)"
                actionIcon={menuIconRaw}
                onAction={() => console.log('Action on history item', entry.id)}
                onClick={() => onHistoryEntrySelect(entry.id || '')}
              />
            ))}
          </div>
        ) : (
          <div className="history-list__empty-state">
            <p>History is empty</p>
            <p>Your prompt enhancement requests will be displayed here</p>
            <Button 
              variant="transparent"
              onClick={() => onHistoryEntrySelect('new')}
            >
              View sample history entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

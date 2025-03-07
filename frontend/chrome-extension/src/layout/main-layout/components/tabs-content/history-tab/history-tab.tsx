import React, { useState } from 'react';
import './history-tab.css';
import { HistoryList } from './history-list/history-list';
import { HistoryEntryDetail } from './history-entry-detail/history-entry-detail';

export const HistoryTab: React.FC = () => {
  // State for selected history entry
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  
  // Handler for selecting a history entry from the list
  const handleHistoryEntrySelect = (entryId: string) => {
    setSelectedEntryId(entryId);
  };
  
  // Handler for returning to the list
  const handleBackToList = () => {
    setSelectedEntryId(null);
  };
  
  return (
    <div className="history-tab">
      {selectedEntryId ? (
        <HistoryEntryDetail 
          entryId={selectedEntryId} 
          onBack={handleBackToList} 
        />
      ) : (
        <HistoryList onHistoryEntrySelect={handleHistoryEntrySelect} />
      )}
    </div>
  );
};

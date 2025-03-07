import React, { useState, useEffect, useCallback } from 'react';
import './history-list.css';
import { ItemCard } from '@components/shared/item-card/item-card';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import { Button } from '@components/ui/button/button';
import { HistoryEntry, historyApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

interface HistoryListProps {
  onHistoryEntrySelect: (entryId: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onHistoryEntrySelect }) => {
  // State for storing history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // State for displaying loading
  const [loading, setLoading] = useState<boolean>(true);
  // State for displaying error
  const [error, setError] = useState<string | null>(null);
  // State for displaying detailed error information
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

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

  // Function to fetch history (can be called for refresh)
  const fetchHistory = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
      console.log('Getting authentication token...');
      const token = await getCurrentUserToken();
      
      if (token) {
        console.log('Token received, loading history...');
        try {
          const historyData = await historyApi.getHistory(token, 20, 0, forceRefresh);
          console.log('History loaded:', historyData);
          setHistory(historyData);
        } catch (apiError: any) {
          console.error('API error when loading history:', apiError);
          setError('Failed to load history');
          setErrorDetails(`API Error: ${apiError.message || JSON.stringify(apiError)}`);
        }
      } else {
        console.error('Failed to get authentication token');
        setError('Failed to get authentication token');
        setErrorDetails('Authentication token not received. You may not be authorized.');
      }
    } catch (err: any) {
      console.error('General error when loading history:', err);
      setError('Failed to load history');
      setErrorDetails(`Error: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load history when component mounts and set up auto-refresh
  useEffect(() => {
    // Initial load
    fetchHistory(false);
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing history data...');
      fetchHistory(true);
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchHistory]);

  // Check if there are history entries to display
  const hasHistory = history.length > 0;

  // For debugging - show state information in the console
  useEffect(() => {
    console.log('HistoryList state:', { loading, error, errorDetails, history });
  }, [loading, error, errorDetails, history]);

  // Function to clear all history
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history?')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = await getCurrentUserToken();
      
      if (token) {
        await historyApi.clearHistory(token);
        setHistory([]);
      } else {
        setError('Failed to get authentication token');
      }
    } catch (err: any) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history');
      setErrorDetails(`Error: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
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
              disabled={loading}
            >
              Clear history
            </Button>
          </div>
        )}
      </div>
      
      <div className="history-list__content">
        {loading ? (
          <div className="history-list__loading">
            <p>Loading history...</p>
          </div>
        ) : error ? (
          <div className="history-list__error">
            <p>{error}</p>
            {errorDetails && (
              <div className="history-list__error-details">
                <p><small>{errorDetails}</small></p>
              </div>
            )}
            <Button 
              variant="transparent"
              onClick={() => fetchHistory(true)}
            >
              Try again
            </Button>
          </div>
        ) : hasHistory ? (
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
              onClick={() => onHistoryEntrySelect('sample-history-id')}
            >
              View sample history entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

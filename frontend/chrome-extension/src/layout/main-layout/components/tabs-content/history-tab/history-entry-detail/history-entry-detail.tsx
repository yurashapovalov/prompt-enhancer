import React, { useState, useEffect } from 'react';
import './history-entry-detail.css';
import { Button } from '@components/ui/button/button';
import { HistoryEntry, historyApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

interface HistoryEntryDetailProps {
  entryId: string;
  onBack: () => void;
}

export const HistoryEntryDetail: React.FC<HistoryEntryDetailProps> = ({ entryId, onBack }) => {
  // State for storing history entry data
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  // State for displaying loading
  const [loading, setLoading] = useState<boolean>(true);
  // State for displaying error
  const [error, setError] = useState<string | null>(null);

  // Load history entry data when component mounts
  useEffect(() => {
    const fetchHistoryEntry = async () => {
      try {
        setLoading(true);
        const token = await getCurrentUserToken();
        
        if (token) {
          // If this is a sample entry, create a stub
          if (entryId === 'sample-history-id') {
            setEntry({
              originalPrompt: 'Write a story about a dragon',
              enhancedPrompt: 'Create an engaging narrative about a mythical dragon, describing its appearance, personality, and the world it inhabits. Include details about its interactions with humans or other creatures, and develop a compelling plot with a beginning, middle, and end.',
              timestamp: new Date()
            });
          } else {
            // Use the new getHistoryEntry method with caching
            const foundEntry = await historyApi.getHistoryEntry(entryId, token, false);
            
            if (foundEntry) {
              setEntry(foundEntry);
            } else {
              setError('History entry not found');
            }
          }
        } else {
          setError('Failed to get authentication token');
        }
      } catch (err) {
        console.error('Error loading history entry:', err);
        setError('Failed to load history entry');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryEntry();
  }, [entryId]);

  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Unknown date';
    
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="history-entry-detail">
      <div className="history-entry-detail__header">
        <Button 
          variant="transparent"
          onClick={onBack}
        >
          ← Back
        </Button>
        <h1 className="history-entry-detail__title">History Entry Details</h1>
      </div>
      
      <div className="history-entry-detail__content">
        {loading ? (
          <div className="history-entry-detail__loading">
            <p>Loading history entry...</p>
          </div>
        ) : error ? (
          <div className="history-entry-detail__error">
            <p>{error}</p>
            <Button 
              variant="transparent"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        ) : entry ? (
          <div className="history-entry-detail__info">
            {entry.timestamp && (
              <div className="history-entry-detail__timestamp">
                {formatDate(entry.timestamp)}
              </div>
            )}
            
            <div className="history-entry-detail__section">
              <h3 className="history-entry-detail__section-title">Original Prompt</h3>
              <div className="history-entry-detail__prompt-box">
                {entry.originalPrompt}
              </div>
            </div>
            
            <div className="history-entry-detail__section">
              <h3 className="history-entry-detail__section-title">Enhanced Prompt</h3>
              <div className="history-entry-detail__prompt-box">
                {entry.enhancedPrompt}
              </div>
            </div>
          </div>
        ) : (
          <div className="history-entry-detail__not-found">
            <p>History entry not found</p>
            <Button 
              variant="transparent"
              onClick={onBack}
            >
              Back to list
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

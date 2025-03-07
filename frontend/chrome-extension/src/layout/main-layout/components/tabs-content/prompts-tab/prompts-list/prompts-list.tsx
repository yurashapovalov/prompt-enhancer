import React, { useState, useEffect, useCallback } from 'react';
import './prompts-list.css';
import { Button } from '@components/ui/button/button';
import { ItemCard } from '@components/shared/item-card/item-card';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import { Prompt, promptsApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

interface PromptsListProps {
  onPromptSelect: (promptId: string) => void;
}

export const PromptsList: React.FC<PromptsListProps> = ({ onPromptSelect }) => {
  // State for storing prompts
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  // State for displaying loading
  const [loading, setLoading] = useState<boolean>(true);
  // State for displaying error
  const [error, setError] = useState<string | null>(null);
  // State for displaying detailed error information
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Function for selecting a prompt
  const handleSelectPrompt = (promptId: string) => {
    onPromptSelect(promptId);
  };

  // Function to fetch prompts (can be called for refresh)
  const fetchPrompts = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
      console.log('Getting authentication token...');
      const token = await getCurrentUserToken();
      
      if (token) {
        console.log('Token received, loading prompts...');
        try {
          const promptsData = await promptsApi.getPrompts(token, forceRefresh);
          console.log('Prompts loaded:', promptsData);
          setPrompts(promptsData);
        } catch (apiError: any) {
          console.error('API error when loading prompts:', apiError);
          setError('Failed to load prompts');
          setErrorDetails(`API Error: ${apiError.message || JSON.stringify(apiError)}`);
        }
      } else {
        console.error('Failed to get authentication token');
        setError('Failed to get authentication token');
        setErrorDetails('Authentication token not received. You may not be authorized.');
      }
    } catch (err: any) {
      console.error('General error when loading prompts:', err);
      setError('Failed to load prompts');
      setErrorDetails(`Error: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load prompts when component mounts and set up auto-refresh
  useEffect(() => {
    // Initial load
    fetchPrompts(false);
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing prompts data...');
      fetchPrompts(true);
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchPrompts]);

  // Check if there are prompts to display
  const hasPrompts = prompts.length > 0;

  // For debugging - show state information in the console
  useEffect(() => {
    console.log('PromptsList state:', { loading, error, errorDetails, prompts });
  }, [loading, error, errorDetails, prompts]);

  return (
    <div className="prompts-list">
      <div className="prompts-list__header">
        <h1 className="prompts-list__title">My Prompts</h1>
      </div>
      
      <div className="prompts-list__content">
        {loading ? (
          <div className="prompts-list__loading">
            <p>Loading prompts...</p>
          </div>
        ) : error ? (
          <div className="prompts-list__error">
            <p>{error}</p>
            {errorDetails && (
              <div className="prompts-list__error-details">
                <p><small>{errorDetails}</small></p>
              </div>
            )}
            <Button 
              variant="transparent"
              onClick={() => fetchPrompts(true)}
            >
              Try again
            </Button>
          </div>
        ) : hasPrompts ? (
          <div className="prompts-list__items">
            {prompts.map(prompt => (
              <ItemCard
                key={prompt.id}
                title={prompt.promptName}
                color={prompt.color}
                actionIcon={menuIconRaw}
                onAction={() => console.log('Action on prompt', prompt.id)}
                onClick={() => handleSelectPrompt(prompt.id || '')}
              />
            ))}
          </div>
        ) : (
          <div className="prompts-list__empty-state">
            <p>No prompts available</p>
            <Button 
              variant="transparent"
              onClick={() => handleSelectPrompt('sample-prompt-id')}
            >
              Create first prompt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import './prompt-detail.css';
import { Button } from '@components/ui/button/button';
import { Prompt, promptsApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

interface PromptDetailProps {
  promptId: string;
  onBack: () => void;
}

export const PromptDetail: React.FC<PromptDetailProps> = ({ promptId, onBack }) => {
  // State for storing prompt data
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  // State for displaying loading
  const [loading, setLoading] = useState<boolean>(true);
  // State for displaying error
  const [error, setError] = useState<string | null>(null);

  // Load prompt data when component mounts
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setLoading(true);
        const token = await getCurrentUserToken();
        
        if (token) {
          // If this is a sample prompt, create a stub
          if (promptId === 'sample-prompt-id') {
            setPrompt({
              promptName: 'Sample Prompt',
              promptDescription: 'This is a sample prompt for demonstration',
              promptText: 'Sample prompt text. This is where the prompt content will be.',
              color: 'var(--color-prompt-tile-emerald)'
            });
          } else {
            // Otherwise load data from the server with caching
            const promptData = await promptsApi.getPrompt(promptId, token, false);
            setPrompt(promptData);
          }
        } else {
          setError('Failed to get authentication token');
        }
      } catch (err) {
        console.error('Error loading prompt:', err);
        setError('Failed to load prompt');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [promptId]);

  return (
    <div className="prompt-detail">
      <div className="prompt-detail__header">
        <Button 
          variant="transparent"
          onClick={onBack}
        >
          ← Back
        </Button>
        <h1 className="prompt-detail__title">Prompt Details</h1>
      </div>
      
      <div className="prompt-detail__content">
        {loading ? (
          <div className="prompt-detail__loading">
            <p>Loading prompt...</p>
          </div>
        ) : error ? (
          <div className="prompt-detail__error">
            <p>{error}</p>
            <Button 
              variant="transparent"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        ) : prompt ? (
          <div className="prompt-detail__info">
            <div className="prompt-detail__header-info">
              <div 
                className="prompt-detail__color" 
                style={{ backgroundColor: prompt.color }}
              ></div>
              <h2 className="prompt-detail__name">{prompt.promptName}</h2>
            </div>
            
            <div className="prompt-detail__section">
              <h3 className="prompt-detail__section-title">Description</h3>
              <p className="prompt-detail__description">{prompt.promptDescription}</p>
            </div>
            
            <div className="prompt-detail__section">
              <h3 className="prompt-detail__section-title">Prompt Text</h3>
              <div className="prompt-detail__text-box">
                {prompt.promptText}
              </div>
            </div>
          </div>
        ) : (
          <div className="prompt-detail__not-found">
            <p>Prompt not found</p>
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

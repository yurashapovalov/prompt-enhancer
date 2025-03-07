import React, { useState, useEffect } from 'react';
import './variable-detail.css';
import { Button } from '@components/ui/button/button';
import { Variable, variablesApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

interface VariableDetailProps {
  variableId: string;
  onBack: () => void;
}

export const VariableDetail: React.FC<VariableDetailProps> = ({ variableId, onBack }) => {
  // State for storing variable data
  const [variable, setVariable] = useState<Variable | null>(null);
  // State for displaying loading
  const [loading, setLoading] = useState<boolean>(true);
  // State for displaying error
  const [error, setError] = useState<string | null>(null);

  // Load variable data when component mounts
  useEffect(() => {
    const fetchVariable = async () => {
      try {
        setLoading(true);
        const token = await getCurrentUserToken();
        
        if (token) {
          // If this is a sample variable, create a stub
          if (variableId === 'sample-variable-id') {
            setVariable({
              variableName: 'Sample Variable',
              variableValue: 'This is a sample variable value for demonstration',
              color: 'var(--color-prompt-tile-emerald)'
            });
          } else {
            // Otherwise load data from the server with caching
            const variableData = await variablesApi.getVariable(variableId, token, false);
            setVariable(variableData);
          }
        } else {
          setError('Failed to get authentication token');
        }
      } catch (err) {
        console.error('Error loading variable:', err);
        setError('Failed to load variable');
      } finally {
        setLoading(false);
      }
    };

    fetchVariable();
  }, [variableId]);

  // Format date for display
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

  return (
    <div className="variable-detail">
      <div className="variable-detail__header">
        <Button 
          variant="transparent"
          onClick={onBack}
        >
          ← Back
        </Button>
        <h1 className="variable-detail__title">Variable Details</h1>
      </div>
      
      <div className="variable-detail__content">
        {loading ? (
          <div className="variable-detail__loading">
            <p>Loading variable...</p>
          </div>
        ) : error ? (
          <div className="variable-detail__error">
            <p>{error}</p>
            <Button 
              variant="transparent"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        ) : variable ? (
          <div className="variable-detail__info">
            <div className="variable-detail__header-info">
              <div 
                className="variable-detail__color" 
                style={{ backgroundColor: variable.color }}
              ></div>
              <h2 className="variable-detail__name">{variable.variableName}</h2>
            </div>
            
            <div className="variable-detail__section">
              <h3 className="variable-detail__section-title">Value</h3>
              <div className="variable-detail__value-box">
                {variable.variableValue}
              </div>
            </div>
            
            {(variable.createdAt || variable.updatedAt) && (
              <div className="variable-detail__meta">
                {variable.createdAt && (
                  <div className="variable-detail__meta-item">
                    Created: {formatDate(variable.createdAt)}
                  </div>
                )}
                {variable.updatedAt && (
                  <div className="variable-detail__meta-item">
                    Last updated: {formatDate(variable.updatedAt)}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="variable-detail__not-found">
            <p>Variable not found</p>
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

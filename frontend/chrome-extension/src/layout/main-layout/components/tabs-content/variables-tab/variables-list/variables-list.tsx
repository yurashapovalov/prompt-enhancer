import React, { useState, useEffect, useCallback } from 'react';
import './variables-list.css';
import { ItemCard } from '@components/shared/item-card/item-card';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import { Button } from '@components/ui/button/button';
import { Variable, variablesApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';

interface VariablesListProps {
  onVariableSelect: (variableId: string) => void;
}

export const VariablesList: React.FC<VariablesListProps> = ({ onVariableSelect }) => {
  // State for storing variables
  const [variables, setVariables] = useState<Variable[]>([]);
  // State for displaying loading
  const [loading, setLoading] = useState<boolean>(true);
  // State for displaying error
  const [error, setError] = useState<string | null>(null);
  // State for displaying detailed error information
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Function to fetch variables (can be called for refresh)
  const fetchVariables = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
      console.log('Getting authentication token...');
      const token = await getCurrentUserToken();
      
      if (token) {
        console.log('Token received, loading variables...');
        try {
          const variablesData = await variablesApi.getVariables(token, forceRefresh);
          console.log('Variables loaded:', variablesData);
          setVariables(variablesData);
        } catch (apiError: any) {
          console.error('API error when loading variables:', apiError);
          setError('Failed to load variables');
          setErrorDetails(`API Error: ${apiError.message || JSON.stringify(apiError)}`);
        }
      } else {
        console.error('Failed to get authentication token');
        setError('Failed to get authentication token');
        setErrorDetails('Authentication token not received. You may not be authorized.');
      }
    } catch (err: any) {
      console.error('General error when loading variables:', err);
      setError('Failed to load variables');
      setErrorDetails(`Error: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load variables when component mounts and set up auto-refresh
  useEffect(() => {
    // Initial load
    fetchVariables(false);
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing variables data...');
      fetchVariables(true);
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchVariables]);

  // Check if there are variables to display
  const hasVariables = variables.length > 0;

  // For debugging - show state information in the console
  useEffect(() => {
    console.log('VariablesList state:', { loading, error, errorDetails, variables });
  }, [loading, error, errorDetails, variables]);

  return (
    <div className="variables-list">
      <div className="variables-list__header">
        <h1 className="variables-list__title">Variables</h1>
      </div>
      
      <div className="variables-list__content">
        {loading ? (
          <div className="variables-list__loading">
            <p>Loading variables...</p>
          </div>
        ) : error ? (
          <div className="variables-list__error">
            <p>{error}</p>
            {errorDetails && (
              <div className="variables-list__error-details">
                <p><small>{errorDetails}</small></p>
              </div>
            )}
            <Button 
              variant="transparent"
              onClick={() => fetchVariables(true)}
            >
              Try again
            </Button>
          </div>
        ) : hasVariables ? (
          <div className="variables-list__items">
            {variables.map(variable => (
              <ItemCard
                key={variable.id}
                title={variable.variableName}
                color={variable.color}
                actionIcon={menuIconRaw}
                onAction={() => console.log('Action on variable', variable.id)}
                onClick={() => onVariableSelect(variable.id || '')}
              />
            ))}
          </div>
        ) : (
          <div className="variables-list__empty-state">
            <p>No variables available</p>
            <Button 
              variant="transparent"
              onClick={() => onVariableSelect('sample-variable-id')}
            >
              Create first variable
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './prompt-detail.css';
import { Button } from '@components/ui/button/button';
import { Prompt, PromptVariable, promptsApi } from '@services/api-service';
import { getCurrentUserToken } from '@services/auth-service';
import { InputBlock } from '@components/shared/input-block/input-block';
import { VariableInputs } from '@components/shared/variable-inputs/variable-inputs';
import { BackHeader } from '@components/shared/back-header/back-header';
import { localPromptsStorage } from '@services/local-storage-service';

interface PromptDetailProps {
  promptId: string;
  onBack: () => void;
}

// Helper function for debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export const PromptDetail: React.FC<PromptDetailProps> = ({ promptId, onBack }) => {
  // State for storing prompt data
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  // State for displaying loading
  const [loading, setLoading] = useState<boolean>(true);
  // State for displaying error
  const [error, setError] = useState<string | null>(null);
  // State for storing variables
  const [variables, setVariables] = useState<string[]>([]);
  // State for storing variable values
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  // State for storing prompt text
  const [promptText, setPromptText] = useState<string>('');
  // State for saving status (unused for now)
  const [saving] = useState<boolean>(false);
  // State for prompt saving status
  const [savingPrompt, setSavingPrompt] = useState<boolean>(false);
  // Ref to track if prompt has unsaved changes
  const hasUnsavedChanges = useRef<boolean>(false);

  // Load prompt data when component mounts
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        setLoading(true);
        
        // If this is a sample prompt, create a stub
        if (promptId === 'sample-prompt-id') {
          const samplePrompt = {
            promptName: 'Sample Prompt',
            promptDescription: 'This is a sample prompt for demonstration',
            promptText: 'Sample prompt text. This is where the prompt content will be.',
            color: 'var(--color-prompt-tile-emerald)'
          };
          setPrompt(samplePrompt);
          setPromptText(samplePrompt.promptText);
        } else {
          // First try to get from local storage
          const promptData = await localPromptsStorage.getById(promptId);
          
          if (promptData) {
            console.log('Loaded prompt from local storage:', promptData);
            setPrompt(promptData);
            setPromptText(promptData.promptText);
            
            // Initialize variables from prompt
            if (promptData.variables && promptData.variables.length > 0) {
              // Extract variable names
              const varNames = promptData.variables.map(v => v.name);
              setVariables(varNames);
              
              // Create a map of variable values
              const varValues: Record<string, string> = {};
              promptData.variables.forEach(v => {
                varValues[v.name] = v.value;
              });
              setVariableValues(varValues);
            }
          } else {
            // If not in local storage, try to get from server
            const token = await getCurrentUserToken();
            if (!token) {
              setError('Failed to get authentication token');
              return;
            }
            
            const serverPromptData = await promptsApi.getPrompt(promptId, token);
            setPrompt(serverPromptData);
            setPromptText(serverPromptData.promptText);
            
            // Initialize variables from prompt
            if (serverPromptData.variables && serverPromptData.variables.length > 0) {
              // Extract variable names
              const varNames = serverPromptData.variables.map(v => v.name);
              setVariables(varNames);
              
              // Create a map of variable values
              const varValues: Record<string, string> = {};
              serverPromptData.variables.forEach(v => {
                varValues[v.name] = v.value;
              });
              setVariableValues(varValues);
            }
            
            // Save to local storage for future use
            await localPromptsStorage.save(serverPromptData);
          }
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

  // Process text to ensure variables have double braces
  const processVariableBraces = useCallback((text: string): string => {
    if (!text || !variables.length) return text;
    
    let processedText = text;
    
    // Ensure all variables in the text have double curly braces
    variables.forEach(variable => {
      // Check if the variable exists in the text in {{variable}} format
      const doublePattern = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
      // Check if the variable exists in the text in {variable} format
      const singlePattern = new RegExp(`\\{\\s*${variable}\\s*\\}`, 'g');
      
      // If the variable exists in {variable} format but not in {{variable}} format, convert it
      if (!doublePattern.test(processedText) && singlePattern.test(processedText)) {
        processedText = processedText.replace(singlePattern, `{{${variable}}}`);
      }
    });
    
    return processedText;
  }, [variables]);
  
  // Save prompt to local storage
  const savePrompt = useCallback(async () => {
    if (!prompt || !prompt.id || promptId === 'sample-prompt-id') {
      return; // Don't save sample prompts or if no prompt loaded
    }
    
    try {
      setSavingPrompt(true);
      
      // Process text to ensure variables have double braces
      const processedText = processVariableBraces(promptText);
      
      // Create prompt variables array from current variables and values
      const promptVars: PromptVariable[] = variables.map(name => ({
        name,
        value: variableValues[name] || ''
      }));
      
      // Update prompt with processed text and variables
      const updatedPrompt = {
        ...prompt,
        promptText: processedText,
        variables: promptVars
      };
      
      // Save to local storage (this will also queue for server sync)
      await localPromptsStorage.save(updatedPrompt);
      
      // Update prompt state
      setPrompt(updatedPrompt);
      
      // Update text if it was processed
      if (processedText !== promptText) {
        setPromptText(processedText);
      }
      
      console.log('Prompt saved to local storage with variables:', promptVars);
      hasUnsavedChanges.current = false;
    } catch (err) {
      console.error('Error saving prompt:', err);
    } finally {
      setSavingPrompt(false);
    }
  }, [prompt, promptId, promptText, processVariableBraces, variables, variableValues]);
  
  // Debounced version of savePrompt
  const debouncedSavePrompt = useCallback(
    debounce(() => {
      savePrompt();
    }, 1000), // 1000ms delay for better responsiveness and less frequent saves
    [savePrompt]
  );
  
  // Handle prompt text change
  const handlePromptTextChange = useCallback((text: string) => {
    // Process text to ensure variables have double braces
    const processedText = processVariableBraces(text);
    
    // Update state with processed text
    setPromptText(processedText);
    
    // Mark as having unsaved changes
    hasUnsavedChanges.current = true;
    
    // Save with debounce for better performance
    debouncedSavePrompt();
  }, [processVariableBraces, debouncedSavePrompt]);
  
  // Handle variables change
  const handleVariablesChange = useCallback((newVariables: string[]) => {
    // Check if variables have actually changed before updating state
    const varsChanged = 
      variables.length !== newVariables.length || 
      newVariables.some(v => !variables.includes(v));
    
    if (!varsChanged) return;
    
    setVariables(newVariables);
    
    // Remove values for variables that no longer exist
    const updatedValues = { ...variableValues };
    Object.keys(updatedValues).forEach(key => {
      if (!newVariables.includes(key)) {
        delete updatedValues[key];
      }
    });
    
    setVariableValues(updatedValues);
    
    // Mark as having unsaved changes
    hasUnsavedChanges.current = true;
    
    // Save prompt with updated variables
    debouncedSavePrompt();
  }, [variables, variableValues, debouncedSavePrompt]);

  // Handle variable value change
  const handleVariableValueChange = useCallback((name: string, value: string) => {
    // Skip update if the value hasn't changed
    if (variableValues[name] === value) return;
    
    const newValues = {
      ...variableValues,
      [name]: value
    };
    
    setVariableValues(newValues);
    
    // Mark as having unsaved changes
    hasUnsavedChanges.current = true;
    
    // Save prompt with updated variable values
    debouncedSavePrompt();
  }, [variables, variableValues, debouncedSavePrompt]);

  // Save prompt when component unmounts or user navigates away
  useEffect(() => {
    // Save on unmount
    return () => {
      if (hasUnsavedChanges.current) {
        savePrompt();
      }
    };
  }, [savePrompt]);
  
  // Save prompt when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        savePrompt();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [savePrompt]);
  
  // Handle back button click
  const handleBackClick = () => {
    // Save any unsaved changes before navigating back
    if (hasUnsavedChanges.current) {
      savePrompt().then(() => {
        onBack();
      });
    } else {
      onBack();
    }
  };

  return (
    <div className="prompt-detail">
      <BackHeader onBackClick={handleBackClick} />
      
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
          <>
            <div className="prompt-detail__header-info">
              <div 
                className="prompt-detail__color" 
                style={{ backgroundColor: prompt.color }}
              ></div>
              <h2 className="prompt-detail__name text-medium text-primary">{prompt.promptName}</h2>
              <p className="prompt-detail__description text-default text-secondary">{prompt.promptDescription}</p>
            </div>
            
            <div className="prompt-detail__section">
              <InputBlock 
                variant="prompt"
                className="prompt-detail__text-block"
                label="Prompt Text"
                value={promptText}
                onChange={handlePromptTextChange}
                onVariablesChange={handleVariablesChange}
                onLabelButtonClick={() => {
                  console.log('Sending template with variables:', promptText);
                  console.log('Variables:', variables.map(name => ({ name, value: variableValues[name] || '' })));
                  
                  // Заменяем переменные на их значения перед отправкой
                  let processedText = promptText;
                  
                  // Заменяем переменные на их значения
                  variables.forEach(name => {
                    const value = variableValues[name] || '';
                    // Экранируем специальные символы в имени переменной для использования в регулярном выражении
                    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // Создаем регулярное выражение, которое учитывает возможные пробелы в имени переменной
                    const pattern = new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g');
                    processedText = processedText.replace(pattern, value);
                  });
                  
                  console.log('Original text:', promptText);
                  console.log('Processed text:', processedText);
                  
                  // Отправляем обработанный текст без переменных
                  chrome.runtime.sendMessage({
                    action: 'sendToActiveTab',
                    data: {
                      action: 'insertPrompt',
                      text: processedText, // Текст с замененными переменными
                      doNotReplaceVariables: true, // Флаг не имеет значения, так как переменные уже заменены
                      variables: [] // Пустой массив переменных, так как они уже заменены
                    }
                  }, (response) => {
                    // Обрабатываем ответ от background script
                    if (response && !response.success) {
                      console.error('Error inserting prompt:', response.error);
                      // Можно добавить уведомление для пользователя
                      alert(`Не удалось вставить текст: ${response.error || 'Неизвестная ошибка'}`);
                    } else if (response && response.success) {
                      console.log('Prompt inserted successfully');
                    }
                  });
                }}
              />
              
              {/* Display input blocks for each variable */}
              <VariableInputs
                variables={variables}
                values={variableValues}
                onChange={handleVariableValueChange}
              />
            </div>
          </>
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

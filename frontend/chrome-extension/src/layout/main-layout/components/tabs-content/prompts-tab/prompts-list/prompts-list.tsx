import React, { useState, useEffect } from 'react';
import './prompts-list.css';
import { Button } from '@components/ui/button/button';
import { ItemCard } from '@components/shared/item-card/item-card';
import menuIconRaw from '@assets/icons/general/menu-line.svg?raw';
import { Prompt } from '@services/api-service';
import { promptsService } from '@services/services';

interface PromptsListProps {
  onPromptSelect: (promptId: string) => void;
}

export const PromptsList: React.FC<PromptsListProps> = ({ onPromptSelect }) => {
  // State for storing prompts
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  // Function for selecting a prompt
  const handleSelectPrompt = (promptId: string) => {
    onPromptSelect(promptId);
  };

  // Subscribe to prompts service
  useEffect(() => {
    // Подписываемся на изменения данных
    const unsubscribe = promptsService.subscribe(setPrompts);
    
    // Отписываемся при размонтировании компонента
    return unsubscribe;
  }, []);

  // Check if there are prompts to display
  const hasPrompts = prompts.length > 0;

  return (
    <div className="prompts-list">
      <div className="prompts-list__header">
        <h1 className="prompts-list__title">My Prompts</h1>
      </div>
      
      <div className="prompts-list__content">
        {hasPrompts ? (
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
              onClick={() => handleSelectPrompt('new')}
            >
              Create first prompt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

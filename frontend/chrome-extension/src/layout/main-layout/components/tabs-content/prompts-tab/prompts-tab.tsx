import React, { useState } from 'react';
import './prompts-tab.css';
import { PromptsList } from './prompts-list/prompts-list';
import { PromptDetail } from './prompt-detail/prompt-detail';

// Тип для промпта (будет расширен позже)
export interface Prompt {
  id: string;
  title: string;
  content?: string;
  color?: string;
}

export const PromptsTab: React.FC = () => {
  // Состояние для выбранного промпта
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  
  // Обработчик выбора промпта из списка
  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId);
  };
  
  // Обработчик возврата к списку
  const handleBackToList = () => {
    setSelectedPromptId(null);
  };
  
  return (
    <div className="prompts-tab">
      {selectedPromptId ? (
        <PromptDetail 
          promptId={selectedPromptId} 
          onBack={handleBackToList} 
        />
      ) : (
        <PromptsList onPromptSelect={handlePromptSelect} />
      )}
    </div>
  );
};

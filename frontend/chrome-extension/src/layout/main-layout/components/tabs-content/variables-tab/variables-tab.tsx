import React, { useState } from 'react';
import './variables-tab.css';
import { VariablesList } from './variables-list/variables-list';
import { VariableDetail } from './variable-detail/variable-detail';

export const VariablesTab: React.FC = () => {
  // State for selected variable
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  
  // Handler for selecting a variable from the list
  const handleVariableSelect = (variableId: string) => {
    setSelectedVariableId(variableId);
  };
  
  // Handler for returning to the list
  const handleBackToList = () => {
    setSelectedVariableId(null);
  };
  
  return (
    <div className="variables-tab">
      {selectedVariableId ? (
        <VariableDetail 
          variableId={selectedVariableId} 
          onBack={handleBackToList} 
        />
      ) : (
        <VariablesList onVariableSelect={handleVariableSelect} />
      )}
    </div>
  );
};

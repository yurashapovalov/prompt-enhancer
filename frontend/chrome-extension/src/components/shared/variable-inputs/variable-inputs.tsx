import React, { memo } from 'react';
import './variable-inputs.css';
import { InputBlock } from '@components/shared/input-block/input-block';

interface VariableInputsProps {
  variables: string[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

// Use memo to optimize rendering and prevent unnecessary re-renders
export const VariableInputs: React.FC<VariableInputsProps> = memo(({ 
  variables, 
  values, 
  onChange 
}) => {
  // Don't render anything if there are no variables to display
  if (variables.length === 0) {
    return null;
  }
  
  return (
    <div className="variable-inputs">
      <div className="variable-inputs__list">
        {variables.map(variable => (
          <InputBlock
            key={variable}
            variant="variable"
            label={variable}
            value={values[variable] || ''}
            onChange={(value) => onChange(variable, value)}
            className="variable-inputs__item"
          />
        ))}
      </div>
    </div>
  );
});

// Add displayName for easier debugging in React DevTools
VariableInputs.displayName = 'VariableInputs';

import React, { memo } from 'react';
import './variable-inputs.css';
import { InputBlock } from '@components/shared/input-block/input-block';

interface VariableInputsProps {
  variables: string[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

// Используем memo для оптимизации рендеринга
export const VariableInputs: React.FC<VariableInputsProps> = memo(({ 
  variables, 
  values, 
  onChange 
}) => {
  // Если нет переменных, не рендерим компонент
  if (variables.length === 0) {
    return null;
  }
  
  return (
    <div className="variable-inputs">
      <h3 className="variable-inputs__title">Variables</h3>
      <div className="variable-inputs__list">
        {variables.map(variable => (
          <InputBlock
            key={variable}
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

// Добавляем displayName для отладки
VariableInputs.displayName = 'VariableInputs';

import React from 'react';
import './input-block.css';
import { InputBlockLabel } from '@components/shared/input-block/components/input-block-label/input-block-label';
import { InputBlockContent } from '@components/shared/input-block/components/input-block-content/input-block-content';

interface InputBlockProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  onLabelButtonClick?: () => void;
  children?: React.ReactNode;
  onVariablesChange?: (variables: string[]) => void; // Callback для уведомления о переменных
}

export const InputBlock: React.FC<InputBlockProps> = ({ 
  value = '',
  onChange,
  className = '',
  label,
  placeholder,
  onLabelButtonClick,
  children,
  onVariablesChange,
}) => {
  return (
    <div className={`input-block ${className}`}>
      {label && (
        <InputBlockLabel onButtonClick={onLabelButtonClick}>
          {label}
        </InputBlockLabel>
      )}
      <InputBlockContent
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        children={children}
        onVariablesChange={onVariablesChange}
      />
    </div>
  );
};

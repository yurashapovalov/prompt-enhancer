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
  onVariablesChange?: (variables: string[]) => void; // Callback function to notify parent component about detected variables
  variant?: 'prompt' | 'variable'; // Determines the display variant: 'prompt' shows button, 'variable' hides it
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
  variant = 'prompt', // Default to 'prompt' variant which displays the button
}) => {
  return (
    <div className={`input-block ${className}`}>
      {label && (
        <InputBlockLabel 
          onButtonClick={onLabelButtonClick}
          variant={variant} // Pass the variant to InputBlockLabel to control button visibility
        >
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

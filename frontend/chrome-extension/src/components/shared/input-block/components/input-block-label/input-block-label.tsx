import React from 'react';
import './input-block-label.css';
import { Button } from '@components/ui/button/button';

interface InputBlockLabelProps {
  children?: React.ReactNode;
  className?: string;
  onButtonClick?: () => void;
  variant?: 'prompt' | 'variable'; // Новый пропс для определения варианта отображения
}

export const InputBlockLabel: React.FC<InputBlockLabelProps> = ({ 
  children,
  className = '',
  onButtonClick,
  variant = 'prompt', // По умолчанию используем вариант для промптов
}) => {
  return (
    <div className={`input-block-label text-default text-medium text-secondary ${className}`}>
      <div className="input-block-label-left">
        {children}
      </div>
      {/* Отображаем кнопку только если variant === 'prompt' и есть onButtonClick */}
      {variant === 'prompt' && onButtonClick && (
        <div className="input-block-label-right">
          <Button 
            size="small" 
            icon={true} 
            onClick={onButtonClick}
          />
        </div>
      )}
    </div>
  );
};

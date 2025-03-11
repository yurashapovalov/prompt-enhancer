import React from 'react';
import './input-block-label.css';
import { Button } from '@components/ui/button/button';
import { Tooltip } from '@components/tech/tooltip/tooltip';
import chatSmileIconRaw from '@assets/icons/general/chat-smile.svg?raw';

interface InputBlockLabelProps {
  children?: React.ReactNode;
  className?: string;
  onButtonClick?: () => void;
  variant?: 'prompt' | 'variable'; // Determines the display variant: 'prompt' shows button, 'variable' hides it
}

export const InputBlockLabel: React.FC<InputBlockLabelProps> = ({ 
  children,
  className = '',
  onButtonClick,
  variant = 'prompt', // Default to 'prompt' variant which displays the button
}) => {
  return (
    <div className={`input-block-label text-default text-secondary ${className}`}>
      <div className="input-block-label-left">
        {children}
      </div>
      {/* Only display the button when variant is 'prompt' and onButtonClick handler is provided */}
      {variant === 'prompt' && onButtonClick && (
        <div className="input-block-label-right">
          <Tooltip content="Add to chat input" position="bottom-right">
            <Button 
              size="small" 
              icon={chatSmileIconRaw} 
              onClick={onButtonClick}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

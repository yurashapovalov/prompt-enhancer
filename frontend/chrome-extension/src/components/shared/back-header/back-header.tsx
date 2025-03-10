import React from 'react';
import './back-header.css';
import { Button } from '@components/ui/button/button';
import arrowLeftIcon from '@assets/icons/general/arrow-left.svg?raw';

interface BackHeaderProps {
  onBackClick: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const BackHeader: React.FC<BackHeaderProps> = ({ 
  onBackClick,
  children,
  className = '',
}) => {
  return (
    <div className={`back-header ${className}`}>
      <Button 
        variant="transparent"
        size="medium"
        icon={arrowLeftIcon}
        onClick={onBackClick}
      >
        Back
      </Button>
      {children}
    </div>
  );
};

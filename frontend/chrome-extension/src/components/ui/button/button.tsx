import React from 'react';
import './button.css';
import baseIconRaw from '@assets/icons/general/base-icon.svg?raw';

// Button types
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'transparent';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: React.ReactNode | boolean | string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  size = 'medium',
  variant = 'transparent',
  icon,
  children,
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  // Определяем, какую иконку использовать
  let iconToRender;
  if (icon === true) {
    iconToRender = <span dangerouslySetInnerHTML={{ __html: baseIconRaw }} />;
  } else if (typeof icon === 'string') {
    iconToRender = <span dangerouslySetInnerHTML={{ __html: icon }} />;
  } else {
    iconToRender = icon;
  }
  
  const isIconOnly = iconToRender && !children;
  
  const buttonClasses = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth ? 'button--full-width' : '',
    isIconOnly ? 'button--icon-only' : iconToRender ? 'button--with-icon' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses} 
      disabled={disabled} 
      {...props}
    >
      {iconToRender && <span className="button__icon">{iconToRender}</span>}
      {children && <span className="button__text">{children}</span>}
    </button>
  );
};

import React from 'react';
import './button.css';

// Button types
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'text' | 'outlined' | 'subtle' | 'filled';
export type ButtonIconPosition = 'left' | 'only';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  iconPosition?: ButtonIconPosition;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  size = 'medium',
  variant = 'filled',
  icon,
  children,
  iconPosition = icon && !children ? 'only' : 'left',
  fullWidth = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const buttonClasses = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth ? 'button--full-width' : '',
    icon ? `button--with-icon button--icon-${iconPosition}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={buttonClasses} 
      disabled={disabled} 
      {...props}
    >
      {icon && <span className="button__icon">{icon}</span>}
      {children && <span className="button__text">{children}</span>}
    </button>
  );
};

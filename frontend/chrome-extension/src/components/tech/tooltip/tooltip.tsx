import React, { useState, useRef, useEffect } from 'react';
import './tooltip.css';

// Позиции тултипа
export type TooltipPosition = 
  'top' | 'top-center' | 'top-right' | 
  'right' | 'right-center' | 'right-bottom' | 
  'bottom' | 'bottom-center' | 'bottom-right' | 
  'left' | 'left-center' | 'left-bottom';

export interface TooltipProps {
  /**
   * Текст, который будет отображаться в тултипе
   */
  content: string;
  
  /**
   * Позиция тултипа относительно обёрнутого элемента
   * @default 'bottom-center'
   */
  position?: TooltipPosition;
  
  /**
   * Элемент, который будет обёрнут тултипом
   */
  children: React.ReactNode;
  
  /**
   * Дополнительные CSS классы
   */
  className?: string;
  
  /**
   * Задержка перед появлением тултипа (в мс)
   * @default 200
   */
  delay?: number;
  
  /**
   * Отключает тултип
   * @default false
   */
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'bottom-center',
  children,
  className = '',
  delay = 200,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const targetRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  
  // Функция для расчета позиции тултипа
  const calculatePosition = () => {
    if (!targetRef.current || !tooltipRef.current) return;
    
    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    // Базовые значения для позиционирования
    let top = 0;
    let left = 0;
    
    // Расчет позиции в зависимости от выбранного положения
    switch (position) {
      // Верхние позиции
      case 'top':
        top = -tooltipRect.height - 8;
        left = 0;
        break;
      case 'top-center':
        top = -tooltipRect.height - 8;
        left = (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'top-right':
        top = -tooltipRect.height - 8;
        left = targetRect.width - tooltipRect.width;
        break;
        
      // Правые позиции
      case 'right':
        top = 0;
        left = targetRect.width + 8;
        break;
      case 'right-center':
        top = (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.width + 8;
        break;
      case 'right-bottom':
        top = targetRect.height - tooltipRect.height;
        left = targetRect.width + 8;
        break;
        
      // Нижние позиции
      case 'bottom':
        top = targetRect.height + 8;
        left = 0;
        break;
      case 'bottom-center':
        top = targetRect.height + 8;
        left = (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom-right':
        top = targetRect.height + 8;
        left = targetRect.width - tooltipRect.width;
        break;
        
      // Левые позиции
      case 'left':
        top = 0;
        left = -tooltipRect.width - 8;
        break;
      case 'left-center':
        top = (targetRect.height - tooltipRect.height) / 2;
        left = -tooltipRect.width - 8;
        break;
      case 'left-bottom':
        top = targetRect.height - tooltipRect.height;
        left = -tooltipRect.width - 8;
        break;
    }
    
    setTooltipStyle({ top, left });
  };
  
  // Обработчики событий мыши
  const handleMouseEnter = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Расчет позиции после того, как тултип станет видимым
      setTimeout(calculatePosition, 0);
    }, delay);
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };
  
  // Пересчитываем позицию при изменении размеров окна
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      
      const handleResize = () => {
        calculatePosition();
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, position]);
  
  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const tooltipClasses = [
    'tooltip',
    `tooltip--${position}`,
    isVisible ? 'tooltip--visible' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className="tooltip-wrapper"
      ref={targetRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      <div 
        className={tooltipClasses}
        ref={tooltipRef}
        style={tooltipStyle}
        role="tooltip"
      >
        <div className="tooltip__content">
          {content}
        </div>
      </div>
    </div>
  );
};

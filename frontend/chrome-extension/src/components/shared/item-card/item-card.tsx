import React, { ReactNode } from 'react';
import './item-card.css';
import { Button } from '@components/ui/button/button';

interface ItemCardProps {
  icon?: ReactNode;
  title: string;
  color?: string;
  actionIcon?: string;
  onAction?: () => void;
  onClick?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  icon,
  title,
  color = '#666460', // Цвет по умолчанию
  actionIcon,
  onAction,
  onClick
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем всплытие события клика
    if (onAction) {
      onAction();
    }
  };

  return (
    <div className="item-card" onClick={handleCardClick}>
      <div className="item-card-left">
        <div
          className="item-card-icon"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <div className="item-card-title">{title}</div>
      </div>

      <div className="item-card-right">
        {actionIcon && (
          <Button
            variant="transparent"
            size="small"
            icon={actionIcon}
            onClick={handleActionClick}
          />
        )}
      </div>
    </div>
  );
};

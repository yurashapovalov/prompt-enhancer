import React from 'react';
import './marketplace-tab.css';

export const MarketplaceTab: React.FC = () => {
  return (
    <div className="marketplace-tab">
      <div className="marketplace-tab__header">
        <h1 className="marketplace-tab__title">Marketplace</h1>
      </div>
      
      <div className="marketplace-tab__content">
        <p>Здесь будет содержимое вкладки Marketplace</p>
      </div>
    </div>
  );
};

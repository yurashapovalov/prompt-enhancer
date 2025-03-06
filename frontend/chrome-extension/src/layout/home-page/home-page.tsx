import React from 'react';
import './home-page.css';
import { Button } from '@components/ui/button/button';

interface HomePageProps {
  onLogout?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLogout }) => {
  return (
    <div className="home-page">
      <h1 className="home-page__title">Prompt Enhancer</h1>
      
      <div className="home-page__status">
        <div className="home-page__status-icon">✓</div>
        <h2 className="home-page__status-title">You are authenticated</h2>
        <p className="home-page__status-description">
          You can now use all features of the extension.
        </p>
        
        {onLogout && (
          <Button 
            variant="outlined" 
            size="small" 
            onClick={onLogout}
            className="home-page__logout-button"
          >
            Sign Out
          </Button>
        )}
      </div>
      
      <div className="home-page__content">
        <div className="home-page__section">
          <h2 className="home-page__section-title">My Prompts</h2>
          <div className="home-page__prompt-list">
            <p className="home-page__empty-state">
              You don't have any saved prompts yet.
            </p>
            <Button 
              variant="filled" 
              size="medium" 
              className="home-page__add-button"
            >
              Create New Prompt
            </Button>
          </div>
        </div>
        
        <div className="home-page__section">
          <h2 className="home-page__section-title">Quick Actions</h2>
          <div className="home-page__actions">
            <Button variant="subtle" size="medium">Enhance Current Prompt</Button>
            <Button variant="subtle" size="medium">Browse Templates</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

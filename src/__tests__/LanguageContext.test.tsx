import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

const TestComponent = () => {
  const { t, language, setLanguage } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="translation">{t('nav.home')}</span>
      <button onClick={() => setLanguage('fr')}>Switch</button>
    </div>
  );
};

describe('LanguageContext', () => {
  it('provides default english language', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('translation')).toHaveTextContent('Home');
  });

  it('allows switching languages', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('Switch'));
    expect(screen.getByTestId('lang')).toHaveTextContent('fr');
    expect(screen.getByTestId('translation')).toHaveTextContent('Accueil');
  });
});

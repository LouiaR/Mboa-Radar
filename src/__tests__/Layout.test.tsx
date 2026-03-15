import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '../components/Layout';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Layout Component', () => {
  it('renders children and navigation links', () => {
    render(
      <ThemeProvider>
        <LanguageProvider>
          <Layout>
            <div data-testid="child-content">Test Content</div>
          </Layout>
        </LanguageProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child-content')).toHaveTextContent('Test Content');
    // 'CamRoute' text from standard layout
    expect(screen.getByText('CamRoute')).toBeInTheDocument();
  });
});

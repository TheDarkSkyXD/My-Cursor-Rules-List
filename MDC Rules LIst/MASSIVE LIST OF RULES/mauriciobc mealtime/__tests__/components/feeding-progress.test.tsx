/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import FeedingProgress from '@/components/feeding-progress';

describe('FeedingProgress', () => {
  const defaultProps = {
    lastFed: new Date('2024-03-20T10:00:00Z'),
    interval: 8,
    size: 40,
    strokeWidth: 4,
    color: '#10b981',
    bgColor: '#e5e7eb'
  };

  const mockSession = {
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      timezone: 'America/Sao_Paulo',
      role: 'user'
    },
    expires: '2024-04-20T10:00:00Z'
  };

  const renderWithSession = (ui: React.ReactElement) => {
    return render(
      <SessionProvider session={mockSession}>
        {ui}
      </SessionProvider>
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with default props', async () => {
    const now = new Date('2024-03-20T10:00:00Z'); // same as lastFed
    jest.setSystemTime(now);

    renderWithSession(<FeedingProgress {...defaultProps} />);
    
    await waitFor(() => {
      const progress = screen.getByRole('progressbar');
      const indicator = progress.firstChild as HTMLElement; // Get the inner div
      expect(indicator).toHaveStyle('transform: translateX(-100%)'); // 0 progress
    });
  });

  it('should show correct progress for recent feeding', async () => {
    const now = new Date('2024-03-20T12:00:00Z'); // 2 hours after lastFed (2/8 = 25%)
    jest.setSystemTime(now);

    renderWithSession(<FeedingProgress {...defaultProps} />);

    await waitFor(() => {
      const progress = screen.getByRole('progressbar'); 
      const indicator = progress.firstChild as HTMLElement; // Get the inner div
      expect(indicator).toHaveStyle('transform: translateX(-75%)'); // 25 progress
    });
  });

  it('should show correct progress when feeding is overdue', async () => {
    const now = new Date('2024-03-20T19:00:00Z'); // 9 hours after lastFed (1 hour into next 8h interval = 1/8 = 12.5%)
    jest.setSystemTime(now);

    renderWithSession(<FeedingProgress {...defaultProps} />);

    await waitFor(() => {
      const progress = screen.getByRole('progressbar'); 
      const indicator = progress.firstChild as HTMLElement; // Get the inner div
      expect(indicator).toHaveStyle('transform: translateX(-87.5%)'); // 12.5 progress
    });
  });

  it('should show full progress for immediate feeding', async () => {
    const now = new Date('2024-03-20T10:00:00Z'); // same as lastFed
    jest.setSystemTime(now);

    renderWithSession(<FeedingProgress {...defaultProps} />);

    await waitFor(() => {
      const progress = screen.getByRole('progressbar'); 
      const indicator = progress.firstChild as HTMLElement; // Get the inner div
      expect(indicator).toHaveStyle('transform: translateX(-100%)'); // 0 progress
    });
  });
}); 
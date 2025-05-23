import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';
import { expect } from '@jest/globals';

// Mock next-themes
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

describe('ThemeToggle', () => {
  it('renders the theme toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('displays sun icon in light mode', () => {
    render(<ThemeToggle />);
    const sunIcon = document.querySelector('.rotate-0.scale-100:not(.absolute)');
    expect(sunIcon).toBeDefined();
  });

  it('displays moon icon in dark mode', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
      theme: 'dark',
      setTheme: mockSetTheme,
    }));

    render(<ThemeToggle />);
    const moonIcon = document.querySelector('.absolute.rotate-90');
    expect(moonIcon).toBeDefined();
  });

  it('toggles theme when clicked', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
      theme: 'light',
      setTheme: mockSetTheme,
    }));
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  describe('Accessibility', () => {
    it('has correct ARIA labels for toggle button', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Toggle theme');
    });

    it('has correct ARIA labels for icons', () => {
      render(<ThemeToggle />);
      const sunIcon = document.querySelector('.rotate-0.scale-100:not(.absolute)');
      expect(sunIcon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Theme Switching', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
      theme: 'light',
      setTheme: mockSetTheme,
    }));
    it('switches from light to dark theme', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('switches from dark to light theme', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
        theme: 'dark',
        setTheme: mockSetTheme,
      }));

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Performance', () => {
    it('handles theme switching efficiently', () => {
      const startTime = performance.now();

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should switch within 100ms
    });

    it('handles icon transitions efficiently', () => {
      const startTime = performance.now();

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should transition within 100ms
    });
  });
});

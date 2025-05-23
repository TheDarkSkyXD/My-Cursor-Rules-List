'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toggle } from '@/components/ui/toggle';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Get the icons by their unique class combinations
  const sunIcon = (
    <Sun
      className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      role="img"
      aria-hidden="true"
    />
  );

  const moonIcon = (
    <Moon
      className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      role="img"
      aria-hidden="true"
    />
  );

  return (
    <Toggle
      className="cursor-pointer rounded-lg"
      variant="outline"
      size="lg"
      pressed={theme === 'dark'}
      onPressedChange={(pressed) => setTheme(pressed ? 'dark' : 'light')}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {sunIcon}
      {moonIcon}
    </Toggle>
  );
}

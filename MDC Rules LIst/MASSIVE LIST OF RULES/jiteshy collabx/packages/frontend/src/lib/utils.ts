import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and merges Tailwind CSS classes.
 * This utility function helps manage conditional class names and resolves Tailwind CSS conflicts.
 * @param inputs - Array of class names or conditional class name objects
 * @returns Merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

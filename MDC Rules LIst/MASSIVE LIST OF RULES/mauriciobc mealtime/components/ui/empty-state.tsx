"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react'; // To accept any Lucide icon
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  IconComponent: LucideIcon;
  title: string;
  description: string;
  actionButton?: React.ReactNode; // Optional action button (e.g., "Add new cat")
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  IconComponent,
  title,
  description,
  actionButton,
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 space-y-4 h-full bg-muted/50 rounded-lg border border-dashed",
        className
      )}
    >
      <IconComponent 
        className={cn("w-16 h-16 text-muted-foreground/70 mb-4", iconClassName)} 
        strokeWidth={1.5} 
      />
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {description}
      </p>
      {actionButton && <div className="pt-4">{actionButton}</div>}
    </div>
  );
}

export default EmptyState; 
"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"; // Or make avatar clickable
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // For conditional class names

// TODO: Define a proper Cat interface, potentially import from a shared types file
interface Cat {
  id: string;
  name: string;
  photo_url?: string | null; // Optional: URL to the cat's avatar image
}

interface CatAvatarStackProps {
  cats: Cat[];
  selectedCatId: string | null;
  onSelectCat: (catId: string) => void;
  className?: string;
}

export function CatAvatarStack({
  cats,
  selectedCatId,
  onSelectCat,
  className,
}: CatAvatarStackProps) {
  if (!cats || cats.length === 0) {
    return (
      <div className={cn("p-4 text-center text-sm text-muted-foreground", className)}>
        No cats available to display.
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex space-x-2 p-2 overflow-x-auto bg-card border rounded-lg shadow", className)} role="toolbar" aria-label="Select a cat">
        {cats.map((cat) => (
          <Tooltip key={cat.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "p-1 h-auto rounded-full transition-all duration-150 ease-in-out",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  selectedCatId === cat.id
                    ? "scale-110 shadow-[0_0_10px_3px_rgba(59,130,246,0.3)]" // Smaller blue glow
                    : "hover:scale-105 hover:shadow-md"
                )}
                onClick={() => onSelectCat(cat.id)}
                aria-label={`Select ${cat.name}`}
                aria-pressed={selectedCatId === cat.id}
              >
                <Avatar className={cn("h-12 w-12 border-2", selectedCatId === cat.id ? "border-primary" : "border-transparent")}>
                  {cat.photo_url && <AvatarImage src={cat.photo_url} alt={cat.name} />}
                  <AvatarFallback className="text-sm">
                    {cat.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{cat.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {/* Optional: Add button? */}
        {/* <Button variant="outline" size="icon" className="ml-2 rounded-full h-12 w-12">
          <PlusIcon className="h-5 w-5" />
          <span className="sr-only">Add new cat</span>
        </Button> */}
      </div>
    </TooltipProvider>
  );
}

export default CatAvatarStack; 
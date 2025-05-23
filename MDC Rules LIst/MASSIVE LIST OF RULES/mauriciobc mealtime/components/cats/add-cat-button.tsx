'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddCatButtonProps {
  householdId: string;
}

export function AddCatButton({ householdId }: AddCatButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/households/${householdId}/cats/new`);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size="sm"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Cat
    </Button>
  );
} 
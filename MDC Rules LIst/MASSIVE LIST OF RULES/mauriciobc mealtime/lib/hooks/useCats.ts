import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/monitoring/logger';

interface Cat {
  id: string;
  name: string;
  breed?: string;
  birth_date?: string;
  weight?: number;
  feeding_schedule?: any;
  medical_history?: any;
  created_at: string;
  updated_at: string;
}

interface CatsResponse {
  data: Cat[];
  error?: string;
}

export function useCats(householdId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const fetchCats = async (): Promise<Cat[]> => {
    try {
      const response = await fetch(`/api/households/${householdId}/cats`);
      const json = await response.json() as CatsResponse;

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          router.push('/login');
          throw new Error('Please login to continue');
        }
        if (response.status === 403) {
          router.push('/households');
          throw new Error('You do not have access to this household');
        }
        throw new Error(json.error || 'Failed to fetch cats');
      }

      return json.data;
    } catch (error) {
      logger.error('[useCats] Error fetching cats', { 
        householdId, 
        error 
      });
      throw error;
    }
  };

  const addCat = async (cat: Partial<Cat>): Promise<Cat> => {
    try {
      const response = await fetch(`/api/households/${householdId}/cats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cat),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add cat');
      }

      const newCat = await response.json();
      return newCat;
    } catch (error) {
      logger.error('[useCats] Error adding cat', {
        householdId,
        cat,
        error
      });
      throw error;
    }
  };

  const updateCat = async (catId: string, updates: Partial<Cat>): Promise<Cat> => {
    try {
      const response = await fetch(`/api/households/${householdId}/cats/${catId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update cat');
      }

      const updatedCat = await response.json();
      return updatedCat;
    } catch (error) {
      logger.error('[useCats] Error updating cat', {
        householdId,
        catId,
        updates,
        error
      });
      throw error;
    }
  };

  const deleteCat = async (catId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/households/${householdId}/cats/${catId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete cat');
      }
    } catch (error) {
      logger.error('[useCats] Error deleting cat', {
        householdId,
        catId,
        error
      });
      throw error;
    }
  };

  // Query hook for fetching cats
  const catsQuery = useQuery({
    queryKey: ['cats', householdId],
    queryFn: fetchCats,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('login') || error?.message?.includes('access')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Mutation hooks
  const addCatMutation = useMutation({
    mutationFn: addCat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cats', householdId] });
      toast.success('Cat added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ catId, updates }: { catId: string; updates: Partial<Cat> }) =>
      updateCat(catId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cats', householdId] });
      toast.success('Cat updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteCat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cats', householdId] });
      toast.success('Cat deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    cats: catsQuery.data ?? [],
    isLoading: catsQuery.isLoading,
    isError: catsQuery.isError,
    error: catsQuery.error,
    addCat: addCatMutation.mutate,
    updateCat: updateCatMutation.mutate,
    deleteCat: deleteCatMutation.mutate,
    isAdding: addCatMutation.isPending,
    isUpdating: updateCatMutation.isPending,
    isDeleting: deleteCatMutation.isPending,
  };
} 
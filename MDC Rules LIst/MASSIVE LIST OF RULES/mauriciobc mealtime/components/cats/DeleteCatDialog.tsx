import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useCats } from '@/lib/hooks/useCats';

interface DeleteCatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catId: string | null;
  householdId: string;
}

export function DeleteCatDialog({
  open,
  onOpenChange,
  catId,
  householdId,
}: DeleteCatDialogProps) {
  const { deleteCat, isDeleting, cats } = useCats(householdId);
  const cat = catId ? cats.find(c => c.id === catId) : null;

  async function onDelete() {
    if (!catId) return;

    try {
      await deleteCat(catId);
      toast.success('Cat deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete cat');
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{' '}
            {cat?.name || 'this cat'} and remove their data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 
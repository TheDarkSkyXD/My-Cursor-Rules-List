import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCats } from '@/lib/hooks/useCats';
import { toast } from 'sonner';
import { useEffect } from 'react';

const catFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(0, 'Age must be positive'),
  weight: z.coerce.number().min(0, 'Weight must be positive'),
  notes: z.string().optional(),
});

type CatFormValues = z.infer<typeof catFormSchema>;

interface EditCatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catId: string | null;
  householdId: string;
}

export function EditCatDialog({ open, onOpenChange, catId, householdId }: EditCatDialogProps) {
  const { updateCat, isUpdating, cats } = useCats(householdId);
  const cat = catId ? cats.find(c => c.id === catId) : null;

  const form = useForm<CatFormValues>({
    resolver: zodResolver(catFormSchema),
    defaultValues: {
      name: '',
      age: 0,
      weight: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (cat && open) {
      form.reset({
        name: cat.name || '',
        weight: cat.weight || 0,
        notes: cat.medical_history || '',
        age: cat.birth_date ? new Date().getFullYear() - new Date(cat.birth_date).getFullYear() : 0,
      });
    } else if (!open) {
      form.reset({
        name: '',
        age: 0,
        weight: 0,
        notes: '',
      });
    }
  }, [cat, open, form]);

  async function onSubmit(data: CatFormValues) {
    if (!catId) return;

    try {
      const updatesForApi: Partial<any> = {
        name: data.name,
        weight: data.weight,
        medical_history: data.notes,
      };
      await updateCat({ catId, updates: updatesForApi });
      toast.success('Cat updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update cat');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Cat</DialogTitle>
          <DialogDescription>
            Make changes to your cat here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age (years)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
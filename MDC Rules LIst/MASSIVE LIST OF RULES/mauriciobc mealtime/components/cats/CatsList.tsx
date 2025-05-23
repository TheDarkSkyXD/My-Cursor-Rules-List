"use client";

import { useCats } from '@/lib/hooks/useCats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { DeleteCatDialog } from './DeleteCatDialog';
import { EditCatDialog } from './EditCatDialog';
import { useState } from 'react';

interface CatsListProps {
  householdId: string;
}

export function CatsList({ householdId }: CatsListProps) {
  const { data: cats, isLoading } = useCats(householdId);
  const [catToEdit, setCatToEdit] = useState<string | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  if (isLoading) {
    return null; // Parent Suspense will show loading state
  }

  if (!cats?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No cats yet</CardTitle>
          <CardDescription>
            Add your first cat using the button above
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cats.map((cat) => (
        <Card key={cat.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {cat.name}
            </CardTitle>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCatToEdit(cat.id)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit cat</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCatToDelete(cat.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete cat</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p><strong>Age:</strong> {cat.age} years</p>
              <p><strong>Weight:</strong> {cat.weight} kg</p>
              {cat.notes && (
                <p className="mt-2 text-muted-foreground">{cat.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <EditCatDialog
        open={!!catToEdit}
        onOpenChange={(open) => !open && setCatToEdit(null)}
        catId={catToEdit}
        householdId={householdId}
      />

      <DeleteCatDialog
        open={!!catToDelete}
        onOpenChange={(open) => !open && setCatToDelete(null)}
        catId={catToDelete}
        householdId={householdId}
      />
    </div>
  );
} 
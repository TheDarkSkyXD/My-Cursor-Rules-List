import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/stores/userStore';
import { useEditorStore } from '@/lib/stores/editorStore';
import { ValidationService } from '@collabx/shared';

interface SessionFullDialogProps {
  isOpen: boolean;
  onViewReadOnly: () => void;
}

export function SessionFullDialog({ isOpen, onViewReadOnly }: SessionFullDialogProps) {
  const router = useRouter();
  const resetUser = useUserStore((state) => state.reset);
  const resetEditor = useEditorStore((state) => state.reset);

  const handleCreateNewSession = () => {
    // Reset stores
    resetUser();
    resetEditor();

    // Generate a random session ID
    const newSessionId = ValidationService.generateValidSessionId(8);
    router.push(`/${newSessionId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onViewReadOnly}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session is Full</DialogTitle>
          <DialogDescription>
            This session has reached the maximum number of users (5). You can either
            create a new session or view this one in read-only mode.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCreateNewSession}>
            Create New Session
          </Button>
          <Button onClick={onViewReadOnly}>View in Read-Only Mode</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

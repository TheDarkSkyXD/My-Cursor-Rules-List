import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ValidationService } from '@collabx/shared';

interface InvalidSessionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvalidSessionDialog({ isOpen, onOpenChange }: InvalidSessionDialogProps) {
  const router = useRouter();

  const handleCreateNewSession = (): void => {
    onOpenChange(false);
    const newSessionId = ValidationService.generateValidSessionId(8);
    router.push(`/${newSessionId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCreateNewSession}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invalid Session</DialogTitle>
          <DialogDescription>
            The session ID you're trying to join is invalid. Session IDs can only contain letters
            and numbers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleCreateNewSession}>Create New Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
}

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  teamMembers: TeamMember[];
  onAssign: (userId: string) => Promise<void>;
  isLoading?: boolean;
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  selectedCount,
  teamMembers,
  onAssign,
  isLoading = false,
}: BulkAssignDialogProps) {
  const [selectedUser, setSelectedUser] = useState('');

  const handleSubmit = async () => {
    if (!selectedUser) return;
    await onAssign(selectedUser);
    setSelectedUser('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Bulk Assign Exceptions
          </DialogTitle>
          <DialogDescription>
            Assign {selectedCount} selected exception{selectedCount !== 1 ? 's' : ''} to a team member.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedUser || isLoading}>
            {isLoading ? 'Assigning...' : `Assign ${selectedCount} Exception${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

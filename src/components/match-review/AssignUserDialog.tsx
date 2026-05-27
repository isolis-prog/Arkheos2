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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Demo users for assignment
const DEMO_USERS = [
  { id: 'user-1', name: 'Sarah Chen', role: 'Recon Analyst' },
  { id: 'user-2', name: 'Michael Torres', role: 'Operations Manager' },
  { id: 'user-3', name: 'Emily Johnson', role: 'Accounting Lead' },
  { id: 'user-4', name: 'David Kim', role: 'Integration Admin' },
];

interface AssignUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onAssign: (userId: string, userName: string) => void;
  isLoading?: boolean;
}

export function AssignUserDialog({
  open,
  onOpenChange,
  selectedCount,
  onAssign,
  isLoading = false,
}: AssignUserDialogProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleAssign = () => {
    const user = DEMO_USERS.find(u => u.id === selectedUser);
    if (user) {
      onAssign(user.id, user.name);
      setSelectedUser('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Breaks
          </DialogTitle>
          <DialogDescription>
            Assign {selectedCount} selected break{selectedCount !== 1 ? 's' : ''} to a team member for investigation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">Assign to</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger id="user">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_USERS.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedUser || isLoading}
          >
            {isLoading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { UserPlus, FileEdit, Download, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface BulkActionsBarProps {
  selectedCount: number;
  onAssign: () => void;
  onCreateAmendments: () => void;
  onExport: () => void;
  onResolve: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onAssign,
  onCreateAmendments,
  onExport,
  onResolve,
  onClearSelection,
  isLoading = false,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedCount} break{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAssign}
              disabled={isLoading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateAmendments}
              disabled={isLoading}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Create Amendments
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={onResolve}
              disabled={isLoading}
              className="bg-success hover:bg-success/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

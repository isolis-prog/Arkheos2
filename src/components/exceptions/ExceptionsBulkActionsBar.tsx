import { UserPlus, FileEdit, Download, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ExceptionsBulkActionsBarProps {
  selectedCount: number;
  totalAmount: number;
  onAssign: () => void;
  onResolve: () => void;
  onExport: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function ExceptionsBulkActionsBar({
  selectedCount,
  totalAmount,
  onAssign,
  onResolve,
  onExport,
  onClearSelection,
  isLoading = false,
}: ExceptionsBulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedCount} exception{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <span className="text-sm text-muted-foreground">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} at risk
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

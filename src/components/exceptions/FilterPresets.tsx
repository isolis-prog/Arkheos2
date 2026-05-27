import { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export interface FilterState {
  status: string;
  severity: string;
  breakType: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
  isBuiltIn?: boolean;
}

const BUILT_IN_PRESETS: FilterPreset[] = [
  {
    id: 'critical-open',
    name: 'Critical & Open',
    filters: { status: 'open', severity: 'critical', breakType: 'all' },
    isBuiltIn: true,
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    filters: { status: 'all', severity: 'high', breakType: 'all' },
    isBuiltIn: true,
  },
  {
    id: 'pending-approval',
    name: 'Pending Approval',
    filters: { status: 'pending_approval', severity: 'all', breakType: 'all' },
    isBuiltIn: true,
  },
  {
    id: 'amount-mismatches',
    name: 'Amount Mismatches',
    filters: { status: 'all', severity: 'all', breakType: 'AMOUNT_MISMATCH' },
    isBuiltIn: true,
  },
  {
    id: 'missing-records',
    name: 'Missing Records',
    filters: { status: 'all', severity: 'all', breakType: 'MISSING_IN_ERP' },
    isBuiltIn: true,
  },
];

const STORAGE_KEY = 'exception-filter-presets';

interface FilterPresetsProps {
  currentFilters: FilterState;
  onApplyPreset: (filters: FilterState) => void;
}

export function FilterPresets({ currentFilters, onApplyPreset }: FilterPresetsProps) {
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomPresets(JSON.parse(stored));
      } catch {
        // Invalid stored data
      }
    }
  }, []);

  const saveCustomPresets = (presets: FilterPreset[]) => {
    setCustomPresets(presets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: presetName.trim(),
      filters: currentFilters,
    };

    saveCustomPresets([...customPresets, newPreset]);
    toast.success(`Preset "${presetName}" saved`);
    setPresetName('');
    setSaveDialogOpen(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const preset = customPresets.find(p => p.id === id);
    saveCustomPresets(customPresets.filter(p => p.id !== id));
    toast.success(`Preset "${preset?.name}" deleted`);
    if (activePresetId === id) {
      setActivePresetId(null);
    }
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    setActivePresetId(preset.id);
    onApplyPreset(preset.filters);
    toast.success(`Applied preset: ${preset.name}`);
  };

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Presets
            {activePresetId && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-md bg-primary/10 text-primary">
                Active
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Built-in Presets
          </div>
          {BUILT_IN_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="flex items-center justify-between"
            >
              <span>{preset.name}</span>
              {activePresetId === preset.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          
          {customPresets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Custom Presets
              </div>
              {customPresets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="flex items-center justify-between group"
                >
                  <span>{preset.name}</span>
                  <div className="flex items-center gap-1">
                    {activePresetId === preset.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDeletePreset(preset.id, e)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSaveDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Save Current as Preset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Save your current filter settings as a preset for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., My Critical Exceptions"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">Current Filters:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Status: {currentFilters.status === 'all' ? 'All' : currentFilters.status.replace(/_/g, ' ')}</li>
                <li>Severity: {currentFilters.severity === 'all' ? 'All' : currentFilters.severity}</li>
                <li>Break Type: {currentFilters.breakType === 'all' ? 'All' : currentFilters.breakType.replace(/_/g, ' ')}</li>
                {currentFilters.dateFrom && (
                  <li>Date From: {currentFilters.dateFrom}</li>
                )}
                {currentFilters.dateTo && (
                  <li>Date To: {currentFilters.dateTo}</li>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>Save Preset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

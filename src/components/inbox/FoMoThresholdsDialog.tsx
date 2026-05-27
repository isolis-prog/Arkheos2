import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { useFoMoThresholds } from '@/hooks/inbox/useFoMoThresholds';
import { toast } from 'sonner';

export function FoMoThresholdsDialog() {
  const { thresholds, setThresholds, reset, defaults } = useFoMoThresholds();
  const [open, setOpen] = useState(false);
  const [warn, setWarn] = useState(String(thresholds.warnPct));
  const [crit, setCrit] = useState(String(thresholds.criticalPct));

  const onOpenChange = (next: boolean) => {
    if (next) {
      setWarn(String(thresholds.warnPct));
      setCrit(String(thresholds.criticalPct));
    }
    setOpen(next);
  };

  const onSave = () => {
    const w = Number(warn);
    const c = Number(crit);
    if (!Number.isFinite(w) || !Number.isFinite(c) || w < 0 || c < 0) {
      toast.error('Thresholds must be non-negative numbers');
      return;
    }
    if (c < w) {
      toast.error('Critical threshold must be ≥ warning threshold');
      return;
    }
    setThresholds({ warnPct: w, criticalPct: c });
    toast.success('FO–MO thresholds updated', {
      description: `Warn ≥ ${w}% · Critical ≥ ${c}%`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="fo-mo-thresholds-btn">
          <Settings2 className="h-4 w-4 mr-1" /> FO–MO thresholds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>FO–MO Δ thresholds</DialogTitle>
          <DialogDescription>
            Configure when the deal header should warn or flag a critical
            divergence between Front Office and Middle Office present values.
            Values are percentages of the larger absolute PV.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label htmlFor="fo-mo-warn">Warn ≥ (%)</Label>
            <Input
              id="fo-mo-warn"
              type="number"
              min={0}
              step={0.1}
              value={warn}
              onChange={(e) => setWarn(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fo-mo-crit">Critical ≥ (%)</Label>
            <Input
              id="fo-mo-crit"
              type="number"
              min={0}
              step={0.1}
              value={crit}
              onChange={(e) => setCrit(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              setWarn(String(defaults.warnPct));
              setCrit(String(defaults.criticalPct));
              toast.info('Reset to defaults');
            }}
          >
            Reset defaults
          </Button>
          <Button size="sm" onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

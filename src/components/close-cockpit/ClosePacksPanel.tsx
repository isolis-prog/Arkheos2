import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClosePack } from '@/hooks/useCloseCockpit';
import { Package, Download, Loader2 } from 'lucide-react';

interface Props {
  packs: ClosePack[];
}

const statusColors: Record<ClosePack['status'], string> = {
  generating: 'bg-warning/10 text-warning border-warning/30',
  ready: 'bg-success/10 text-success border-success/30',
  exported: 'bg-info/10 text-info border-info/30',
  archived: 'bg-muted text-muted-foreground',
};

export const ClosePacksPanel = ({ packs }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Package className="h-5 w-5" />
        Close Packs
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {packs.map((pack) => (
          <div key={pack.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              {pack.status === 'generating' ? (
                <Loader2 className="h-5 w-5 animate-spin text-warning" />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">{pack.legalEntity}</p>
                <p className="text-xs text-muted-foreground capitalize">{pack.packType} pack</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pack.fileSizeBytes && (
                <span className="text-xs text-muted-foreground">
                  {(pack.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                </span>
              )}
              <Badge variant="outline" className={statusColors[pack.status]}>
                {pack.status}
              </Badge>
              {(pack.status === 'ready' || pack.status === 'exported') && (
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

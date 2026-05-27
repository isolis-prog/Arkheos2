import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { HedgeAccountingPack } from '@/hooks/useHedgeAccounting';

interface Props {
  packs: HedgeAccountingPack[];
}

const statusStyles: Record<string, string> = {
  draft: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  exported: 'bg-primary/10 text-primary',
};

export const PacksGrid = ({ packs }: Props) => {
  if (packs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mb-2 opacity-50" />
        <p>No accounting packs generated yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {packs.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">{p.packRef}</p>
                <p className="text-xs text-muted-foreground">{p.designationRef} · {p.period}</p>
              </div>
              <Badge className={`text-xs ${statusStyles[p.status]}`}>{p.status}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{p.standard}</Badge>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(p.generatedAt), { addSuffix: true })}</span>
            </div>
            <div className="space-y-1">
              {p.contents.map((c) => (
                <div key={c.section} className="flex items-center gap-2 text-xs">
                  {c.included ? <CheckCircle className="h-3 w-3 text-success" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                  <span className={c.included ? '' : 'text-muted-foreground'}>{c.section}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1"><Download className="h-3 w-3 mr-1" /> Export</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClaimCase, ClaimStatus } from '@/hooks/useQuality';
import { format } from 'date-fns';
import { DollarSign, User, Calendar } from 'lucide-react';

interface Props {
  claimsByStatus: Record<string, ClaimCase[]>;
  onSelect: (id: string) => void;
}

const COLUMNS: { key: ClaimStatus; label: string; color: string }[] = [
  { key: 'draft', label: 'Draft', color: 'bg-muted' },
  { key: 'submitted', label: 'Submitted', color: 'bg-blue-500/10' },
  { key: 'under_review', label: 'Under Review', color: 'bg-yellow-500/10' },
  { key: 'accepted', label: 'Accepted', color: 'bg-green-500/10' },
  { key: 'disputed', label: 'Disputed', color: 'bg-red-500/10' },
  { key: 'settled', label: 'Settled', color: 'bg-primary/10' },
];

export const ClaimsKanban = ({ claimsByStatus, onSelect }: Props) => (
  <div className="flex gap-3 overflow-x-auto pb-4">
    {COLUMNS.map(col => (
      <div key={col.key} className="min-w-[260px] flex-shrink-0">
        <div className={`rounded-t-lg px-3 py-2 ${col.color}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{col.label}</span>
            <Badge variant="secondary" className="text-xs">{claimsByStatus[col.key]?.length || 0}</Badge>
          </div>
        </div>
        <ScrollArea className="h-[500px] border border-t-0 rounded-b-lg p-2 space-y-2">
          <div className="space-y-2">
            {(claimsByStatus[col.key] || []).map(claim => (
              <Card key={claim.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(claim.id)}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">{claim.caseRef}</span>
                    <Badge variant="outline" className="text-xs">{claim.commodity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{claim.reason}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-mono font-medium text-foreground">${claim.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{claim.owner}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(claim.dueDate), 'dd MMM')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{claim.evidenceCount} evidence(s)</span>
                    {claim.counterparty && <Badge variant="outline" className="text-xs ml-auto">{claim.counterparty.split(' ')[0]}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    ))}
  </div>
);

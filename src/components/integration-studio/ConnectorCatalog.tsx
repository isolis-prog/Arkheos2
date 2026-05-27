import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plug } from 'lucide-react';
import type { Connector } from '@/hooks/useIntegrationStudio';

const typeColors: Record<string, string> = {
  etrm: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  erp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  bank: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  market_data: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  iso: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  ops: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
};

const typeLabels: Record<string, string> = { etrm: 'ETRM', erp: 'ERP', bank: 'Bank', market_data: 'Market Data', iso: 'ISO', ops: 'Operations' };

export const ConnectorCatalog = ({ connectors }: { connectors: Connector[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {connectors.map(c => (
      <Card key={c.id} className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm">{c.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{c.vendor}</p>
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeColors[c.connectorType]}`}>
              {typeLabels[c.connectorType]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between gap-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
          <div className="flex flex-wrap gap-1">
            {c.supportedObjects.slice(0, 3).map(o => (
              <Badge key={o} variant="outline" className="text-[10px]">{o}</Badge>
            ))}
            {c.supportedObjects.length > 3 && <Badge variant="outline" className="text-[10px]">+{c.supportedObjects.length - 3}</Badge>}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">v{c.version} · {c.authMethod}</span>
            <Button size="sm" variant={c.isPublished ? 'default' : 'secondary'} className="h-7 text-xs">
              <Plug className="h-3 w-3 mr-1" />{c.isPublished ? 'Install' : 'Preview'}
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

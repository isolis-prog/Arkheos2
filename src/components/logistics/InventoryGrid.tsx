import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Thermometer, Droplets } from 'lucide-react';
import type { InventorySnapshot } from '@/hooks/useLogistics';

interface Props {
  inventory: InventorySnapshot[];
}

export const InventoryGrid = ({ inventory }: Props) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Inventory Positions</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {inventory.map(inv => (
        <Card key={inv.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{inv.location}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {inv.tank_id ? `Tank ${inv.tank_id}` : inv.warehouse_id ? `Warehouse ${inv.warehouse_id}` : ''}
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {inv.source_system}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{inv.product}</span>
              {inv.quality_grade && (
                <Badge variant="secondary" className="text-xs">{inv.quality_grade}</Badge>
              )}
            </div>
            <div className="text-2xl font-bold font-mono">
              {inv.quantity.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{inv.uom}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {inv.density != null && (
                <span className="flex items-center gap-1">
                  <Droplets className="h-3.5 w-3.5" />
                  {inv.density} g/cm³
                </span>
              )}
              {inv.temperature != null && (
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3.5 w-3.5" />
                  {inv.temperature}°F
                </span>
              )}
            </div>
            {inv.valuation_price != null && (
              <div className="pt-2 border-t text-sm">
                <span className="text-muted-foreground">Valuation: </span>
                <span className="font-semibold">
                  ${(inv.valuation_price * inv.quantity).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-muted-foreground ml-1">({inv.valuation_currency})</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Snapshot: {inv.snapshot_date}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

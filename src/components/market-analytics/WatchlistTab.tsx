import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WatchlistItem {
  id: string;
  type: string;
  name: string;
  value: string;
}

export const WatchlistTab = ({ items }: { items: WatchlistItem[] }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">Your personalized market watchlist</p>
      <Button size="sm" variant="outline">
        <Plus className="h-4 w-4 mr-1" /> Add Item
      </Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                <span className="text-sm font-mono text-foreground">{item.value}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

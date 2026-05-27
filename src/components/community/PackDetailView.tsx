import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, ArrowLeft, Clock, CheckCircle2, Package } from 'lucide-react';
import { CommunityPack, PackReview } from '@/hooks/useCommunity';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  pack: CommunityPack;
  reviews: PackReview[];
  onBack: () => void;
}

export const PackDetailView = ({ pack, reviews, onBack }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <Button variant="ghost" onClick={onBack} className="gap-1"><ArrowLeft className="h-4 w-4" /> Back to Marketplace</Button>

    {/* Header */}
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{pack.name}</h2>
          {pack.isOfficial && <Badge className="bg-primary/10 text-primary gap-0.5"><CheckCircle2 className="h-3 w-3" /> Official</Badge>}
        </div>
        <p className="text-muted-foreground max-w-2xl">{pack.longDescription}</p>
        <div className="flex items-center gap-4 text-sm">
          {pack.avgRating > 0 && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={cn('h-4 w-4', i < Math.round(pack.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
              ))}
              <span className="font-medium ml-1">{pack.avgRating}</span>
              <span className="text-muted-foreground">({pack.reviewCount} reviews)</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground"><Download className="h-4 w-4" /> {pack.installCount.toLocaleString()} installs</div>
          <span className="text-muted-foreground">by {pack.authorName}</span>
        </div>
        <div className="flex items-center gap-2">
          {pack.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Button size="lg"><Package className="h-4 w-4 mr-2" /> Install v{pack.currentVersion}</Button>
        <span className="text-xs text-muted-foreground">Free • One-click install</span>
      </div>
    </div>

    {/* Versions */}
    <Card>
      <CardHeader><CardTitle className="text-base">Version History</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {pack.versions.map(v => (
          <div key={v.id} className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">v{v.versionNumber}</span>
                {v.isLatest && <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Latest</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{v.changelog}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {v.publishedAt ? format(new Date(v.publishedAt), 'MMM dd, yyyy') : '—'}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Reviews */}
    <Card>
      <CardHeader><CardTitle className="text-base">Reviews ({reviews.length})</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this pack!</p>}
        {reviews.map(r => (
          <div key={r.id} className="border-b last:border-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn('h-3.5 w-3.5', i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                  ))}
                </div>
                <span className="font-medium text-sm">{r.title}</span>
              </div>
              <span className="text-xs text-muted-foreground">{r.reviewerName} • {format(new Date(r.createdAt), 'MMM dd')}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{r.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  </motion.div>
);

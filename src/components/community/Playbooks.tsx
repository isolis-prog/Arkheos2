import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CommunityPack } from '@/hooks/useCommunity';

const playbooks = [
  {
    id: 'pb1', title: 'Resolving Amount Mismatches',
    steps: ['Identify the variance amount and direction', 'Check for partial payments or credit notes', 'Verify FX rate applied at transaction date', 'Review rounding rules in both systems', 'Check for timing differences (T+1 vs T+0)', 'Document root cause and apply amendment'],
    tags: ['amount-mismatch', 'common'], difficulty: 'Beginner',
  },
  {
    id: 'pb2', title: 'Missing Counterparty Records',
    steps: ['Confirm trade exists in ETRM source', 'Check ingestion batch for errors', 'Verify counterparty mapping table', 'Look for name/code variations', 'Check if record was filtered by date range', 'Manually ingest or create amendment'],
    tags: ['missing-records', 'data-quality'], difficulty: 'Intermediate',
  },
  {
    id: 'pb3', title: 'Duplicate Posting Detection',
    steps: ['Run duplicate detection query on reference + amount + date', 'Identify which system created the duplicate', 'Check idempotency keys on connector', 'Verify batch was not re-run accidentally', 'Reverse duplicate entry via amendment', 'Add prevention rule to connector config'],
    tags: ['duplicates', 'posting'], difficulty: 'Intermediate',
  },
  {
    id: 'pb4', title: 'Intercompany Elimination Breaks',
    steps: ['Identify both sides of the intercompany transaction', 'Verify legal entity mapping', 'Check if both entities posted in same period', 'Review currency translation adjustments', 'Confirm elimination entries were generated', 'Escalate to consolidation team if structural'],
    tags: ['intercompany', 'close'], difficulty: 'Advanced',
  },
];

const difficultyColors: Record<string, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-600',
  Intermediate: 'bg-amber-500/10 text-amber-600',
  Advanced: 'bg-rose-500/10 text-rose-600',
};

export const Playbooks = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold">Playbooks</h3>
      <p className="text-sm text-muted-foreground">Step-by-step guides for resolving common exceptions</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {playbooks.map(pb => (
        <Card key={pb.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{pb.title}</CardTitle>
              <Badge className={difficultyColors[pb.difficulty] + ' text-xs'}>{pb.difficulty}</Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {pb.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5">
              {pb.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">{i + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}
    </div>
  </motion.div>
);

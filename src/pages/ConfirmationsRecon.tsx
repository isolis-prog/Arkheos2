import { useNavigate } from 'react-router-dom';
import { FlaskConical, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmationsKPIs } from '@/components/confirmations/ConfirmationsKPIs';
import { ConfirmationsFilters } from '@/components/confirmations/ConfirmationsFilters';
import { ConfirmationsTable } from '@/components/confirmations/ConfirmationsTable';
import { MatchResultsTable } from '@/components/confirmations/MatchResultsTable';
import { ConfDiffView } from '@/components/confirmations/ConfDiffView';
import { ReadyToInvoiceTable } from '@/components/confirmations/ReadyToInvoiceTable';
import { TopBreaksCard } from '@/components/confirmations/TopBreaksCard';
import { useConfirmationsRecon } from '@/hooks/useConfirmationsRecon';

const ConfirmationsRecon = () => {
  const navigate = useNavigate();
  const {
    confirmations, matches, filters, setFilters, kpis,
    selectedMatch, selectedMatchId, setSelectedMatchId, readyToInvoiceList,
  } = useConfirmationsRecon();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Confirmations Reconciliation"
        description="Pre-invoice matching — Confirm System ↔ ETRM trades with configurable tolerances per commodity"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/confirmations-recon/close-ready')}>
              <ShieldAlert className="h-3.5 w-3.5" />
              Close-ready report
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/confirmations-recon/simulator')}>
              <FlaskConical className="h-3.5 w-3.5" />
              Matching simulator
            </Button>
          </div>
        }
      />

      <ConfirmationsKPIs
        total={kpis.total}
        matchRate={kpis.matchRate}
        pendingReview={kpis.pendingReview}
        unmatched={kpis.unmatched}
        readyToInvoice={kpis.readyToInvoice}
        disputed={kpis.disputed}
      />

      <ConfirmationsFilters
        filters={filters}
        onChange={setFilters}
        commodityGroups={kpis.commodityGroups}
        counterparties={kpis.counterparties}
      />

      <Tabs defaultValue="confirmations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="confirmations">Confirmations ({confirmations.length})</TabsTrigger>
          <TabsTrigger value="matches">Match Results ({matches.length})</TabsTrigger>
          <TabsTrigger value="ready">Ready to Invoice ({readyToInvoiceList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="confirmations" className="space-y-4">
          <ConfirmationsTable confirmations={confirmations} />
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <MatchResultsTable matches={matches} onSelect={setSelectedMatchId} />
              {selectedMatch && (
                <ConfDiffView
                  match={selectedMatch.match}
                  confirmation={selectedMatch.confirmation}
                  onClose={() => setSelectedMatchId(null)}
                />
              )}
            </div>
            <div>
              <TopBreaksCard breaksByType={kpis.breaksByType} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ready" className="space-y-4">
          <ReadyToInvoiceTable confirmations={readyToInvoiceList} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfirmationsRecon;

import { PageHeader } from '@/components/ui/page-header';
import { ExceptionInboxKPIs } from '@/components/exception-inbox/ExceptionInboxKPIs';
import { ExceptionInboxFilters } from '@/components/exception-inbox/ExceptionInboxFilters';
import { ExceptionCasesTable } from '@/components/exception-inbox/ExceptionCasesTable';
import { useExceptionCases } from '@/hooks/useExceptionCases';

const ExceptionInbox = () => {
  const { cases, filters, setFilters, kpis } = useExceptionCases();

  return (
    <div className="space-y-6">
      <PageHeader title="Exceptions Inbox" description="Unified cross-module exception cases — filter by module, severity, owner role, status, and SLA" />
      <ExceptionInboxKPIs totalOpen={kpis.totalOpen} critical={kpis.critical} slaOverdue={kpis.slaOverdue} totalAmountAtRisk={kpis.totalAmountAtRisk} />
      <ExceptionInboxFilters filters={filters} onChange={setFilters} modules={kpis.modules} />
      <ExceptionCasesTable cases={cases} />
    </div>
  );
};

export default ExceptionInbox;

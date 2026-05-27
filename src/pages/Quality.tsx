import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QualityKPIs } from '@/components/quality/QualityKPIs';
import { QualityFilters } from '@/components/quality/QualityFilters';
import { CertificatesTable } from '@/components/quality/CertificatesTable';
import { CertificateDetailPanel } from '@/components/quality/CertificateDetailPanel';
import { ClaimsKanban } from '@/components/quality/ClaimsKanban';
import { QualityRulesTable } from '@/components/quality/QualityRulesTable';
import { TopBreachedSpecs } from '@/components/quality/TopBreachedSpecs';
import { ProvisionalVsFinalTab } from '@/components/quality/ProvisionalVsFinalTab';
import { InspectorCoordinationTab } from '@/components/quality/InspectorCoordinationTab';
import { AssayExchangeLogTab } from '@/components/quality/AssayExchangeLogTab';
import { useQuality } from '@/hooks/useQuality';
import { toast } from 'sonner';

const QualityPage = () => {
  const q = useQuality();

  if (q.selectedCert) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quality & Assay" description="Certificate detail and price adjustments" />
        <CertificateDetailPanel
          certificate={q.selectedCert}
          onBack={() => q.setSelectedCertId(null)}
          onCreateClaim={(certId) => {
            toast.success(`Claim created for certificate ${certId}`);
            q.setSelectedCertId(null);
            q.setActiveTab('claims');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quality & Assay" description="Manage quality certificates, penalties/bonuses, and counterparty claims" />
      <QualityKPIs kpis={q.kpis} />

      <Tabs value={q.activeTab} onValueChange={(v) => q.setActiveTab(v as typeof q.activeTab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="certificates">Certificates ({q.filteredCertificates.length})</TabsTrigger>
          <TabsTrigger value="claims">Claims ({q.claims.length})</TabsTrigger>
          <TabsTrigger value="rules">Quality Rules ({q.rules.length})</TabsTrigger>
          <TabsTrigger value="pricing">Prov. vs Final</TabsTrigger>
          <TabsTrigger value="inspectors">Inspectors</TabsTrigger>
          <TabsTrigger value="exchange">Assay Exchange</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          <QualityFilters
            commodityFilter={q.commodityFilter} setCommodityFilter={q.setCommodityFilter}
            statusFilter={q.statusFilter} setStatusFilter={q.setStatusFilter}
            searchQuery={q.searchQuery} setSearchQuery={q.setSearchQuery}
          />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <CertificatesTable certificates={q.filteredCertificates} onSelect={q.setSelectedCertId} />
            </div>
            <TopBreachedSpecs specs={q.kpis.topBreachedSpecs} />
          </div>
        </TabsContent>

        <TabsContent value="claims">
          <ClaimsKanban claimsByStatus={q.claimsByStatus} onSelect={q.setSelectedClaimId} />
        </TabsContent>

        <TabsContent value="rules">
          <QualityRulesTable rules={q.rules} />
        </TabsContent>

        <TabsContent value="pricing">
          <ProvisionalVsFinalTab />
        </TabsContent>

        <TabsContent value="inspectors">
          <InspectorCoordinationTab />
        </TabsContent>

        <TabsContent value="exchange">
          <AssayExchangeLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityPage;

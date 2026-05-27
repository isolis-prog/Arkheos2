import { useDocumentIntelligence } from '@/hooks/useDocumentIntelligence';
import { DocIntelKPIs } from '@/components/doc-intelligence/DocIntelKPIs';
import { DocIntelFilters } from '@/components/doc-intelligence/DocIntelFilters';
import { DocumentsTable } from '@/components/doc-intelligence/DocumentsTable';
import { ExtractionsPanel } from '@/components/doc-intelligence/ExtractionsPanel';
import { DiffEngineTable } from '@/components/doc-intelligence/DiffEngineTable';
import { DocExceptionsTable } from '@/components/doc-intelligence/DocExceptionsTable';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSearch, Brain, GitCompare, AlertTriangle } from 'lucide-react';

const DocumentIntelligence = () => {
  const {
    documents, extractions, diffs, exceptions,
    searchTerm, setSearchTerm, docTypeFilter, setDocTypeFilter,
    statusFilter, setStatusFilter, activeTab, setActiveTab, kpis,
  } = useDocumentIntelligence();

  return (
    <div className="space-y-6">
      <PageHeader title="Contract & Document Intelligence" description="AI-powered extraction, comparison, and exception management for trade documents" />
      <DocIntelKPIs kpis={kpis} />
      <DocIntelFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        docTypeFilter={docTypeFilter} setDocTypeFilter={setDocTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents" className="gap-1.5"><FileSearch className="h-4 w-4" />Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="extractions" className="gap-1.5"><Brain className="h-4 w-4" />Extractions ({extractions.length})</TabsTrigger>
          <TabsTrigger value="diffs" className="gap-1.5"><GitCompare className="h-4 w-4" />Diff Engine ({diffs.length})</TabsTrigger>
          <TabsTrigger value="exceptions" className="gap-1.5"><AlertTriangle className="h-4 w-4" />Exceptions ({exceptions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="documents"><DocumentsTable documents={documents} /></TabsContent>
        <TabsContent value="extractions"><ExtractionsPanel extractions={extractions} /></TabsContent>
        <TabsContent value="diffs"><DiffEngineTable diffs={diffs} /></TabsContent>
        <TabsContent value="exceptions"><DocExceptionsTable exceptions={exceptions} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentIntelligence;

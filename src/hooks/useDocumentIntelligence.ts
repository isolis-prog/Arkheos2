import { useState, useMemo } from 'react';

export interface DocRecord {
  id: string;
  docType: 'isda' | 'confirmation' | 'msa' | 'charter_party' | 'terminal_agreement' | 'iso_statement';
  fileName: string;
  classification: string;
  classificationConfidence: number;
  status: 'pending' | 'processing' | 'extracted' | 'failed';
  dealId: string | null;
  counterparty: string | null;
  pageCount: number;
  createdAt: string;
}

export interface DocExtraction {
  id: string;
  documentId: string;
  fieldName: string;
  fieldValue: string;
  confidence: number;
  pageNumber: number;
  extractionMethod: 'ai' | 'ocr' | 'regex';
  verified: boolean;
}

export interface DocDiff {
  id: string;
  documentId: string;
  fieldName: string;
  docValue: string;
  dealValue: string;
  diffType: 'mismatch' | 'missing_in_doc' | 'missing_in_deal' | 'value_drift';
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'accepted' | 'rejected' | 'fixed';
}

export interface DocException {
  id: string;
  documentId: string;
  diffId: string | null;
  exceptionType: 'term_mismatch' | 'missing_clause' | 'spec_deviation' | 'pricing_error';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  resolutionAction: string | null;
  createdAt: string;
}

const demoDocuments: DocRecord[] = [
  { id: 'DOC-001', docType: 'isda', fileName: 'ISDA_Master_GoldmanSachs_2025.pdf', classification: 'ISDA Master Agreement', classificationConfidence: 0.97, status: 'extracted', dealId: 'DL-4410', counterparty: 'Goldman Sachs', pageCount: 42, createdAt: '2025-02-18' },
  { id: 'DOC-002', docType: 'confirmation', fileName: 'Confirm_FX_Forward_HSBC_20250215.pdf', classification: 'Trade Confirmation', classificationConfidence: 0.94, status: 'extracted', dealId: 'DL-4388', counterparty: 'HSBC', pageCount: 3, createdAt: '2025-02-15' },
  { id: 'DOC-003', docType: 'charter_party', fileName: 'CP_Voyage_Stena_Feb2025.pdf', classification: 'Charter Party', classificationConfidence: 0.91, status: 'extracted', dealId: 'DL-4395', counterparty: 'Stena Bulk', pageCount: 18, createdAt: '2025-02-12' },
  { id: 'DOC-004', docType: 'terminal_agreement', fileName: 'Terminal_Agreement_Vopak_Rotterdam.pdf', classification: 'Terminal Agreement', classificationConfidence: 0.88, status: 'processing', dealId: 'DL-4401', counterparty: 'Vopak', pageCount: 24, createdAt: '2025-02-10' },
  { id: 'DOC-005', docType: 'msa', fileName: 'MSA_Trafigura_Glencore_2024.pdf', classification: 'Master Sales Agreement', classificationConfidence: 0.95, status: 'extracted', dealId: null, counterparty: 'Glencore', pageCount: 36, createdAt: '2025-02-08' },
  { id: 'DOC-006', docType: 'iso_statement', fileName: 'ISO_Statement_Jan2025_ERCOT.pdf', classification: 'ISO Settlement Statement', classificationConfidence: 0.99, status: 'extracted', dealId: 'DL-4350', counterparty: 'ERCOT', pageCount: 8, createdAt: '2025-02-05' },
  { id: 'DOC-007', docType: 'confirmation', fileName: 'Confirm_Swap_JPM_20250201.pdf', classification: 'Trade Confirmation', classificationConfidence: 0.92, status: 'failed', dealId: 'DL-4360', counterparty: 'JP Morgan', pageCount: 4, createdAt: '2025-02-01' },
];

const demoExtractions: DocExtraction[] = [
  { id: 'EX-001', documentId: 'DOC-001', fieldName: 'Pricing Window', fieldValue: '5 business days', confidence: 0.95, pageNumber: 12, extractionMethod: 'ai', verified: true },
  { id: 'EX-002', documentId: 'DOC-001', fieldName: 'Threshold Amount', fieldValue: 'USD 10,000,000', confidence: 0.98, pageNumber: 8, extractionMethod: 'ai', verified: true },
  { id: 'EX-003', documentId: 'DOC-002', fieldName: 'Notional Amount', fieldValue: 'EUR 5,000,000', confidence: 0.99, pageNumber: 1, extractionMethod: 'ai', verified: false },
  { id: 'EX-004', documentId: 'DOC-002', fieldName: 'Settlement Date', fieldValue: '2025-04-15', confidence: 0.97, pageNumber: 1, extractionMethod: 'ai', verified: false },
  { id: 'EX-005', documentId: 'DOC-003', fieldName: 'Laytime', fieldValue: '72 hours SHINC', confidence: 0.89, pageNumber: 5, extractionMethod: 'ai', verified: true },
  { id: 'EX-006', documentId: 'DOC-003', fieldName: 'Demurrage Rate', fieldValue: 'USD 45,000/day', confidence: 0.93, pageNumber: 7, extractionMethod: 'ai', verified: false },
  { id: 'EX-007', documentId: 'DOC-003', fieldName: 'Incoterm', fieldValue: 'FOB', confidence: 0.96, pageNumber: 3, extractionMethod: 'ai', verified: true },
];

const demoDiffs: DocDiff[] = [
  { id: 'DIF-001', documentId: 'DOC-001', fieldName: 'Threshold Amount', docValue: 'USD 10,000,000', dealValue: 'USD 15,000,000', diffType: 'mismatch', severity: 'critical', status: 'open' },
  { id: 'DIF-002', documentId: 'DOC-002', fieldName: 'Settlement Date', docValue: '2025-04-15', dealValue: '2025-04-17', diffType: 'mismatch', severity: 'high', status: 'open' },
  { id: 'DIF-003', documentId: 'DOC-003', fieldName: 'Demurrage Rate', docValue: 'USD 45,000/day', dealValue: 'USD 40,000/day', diffType: 'value_drift', severity: 'high', status: 'fixed' },
  { id: 'DIF-004', documentId: 'DOC-003', fieldName: 'Load Port', docValue: 'Fujairah', dealValue: '', diffType: 'missing_in_deal', severity: 'medium', status: 'open' },
  { id: 'DIF-005', documentId: 'DOC-005', fieldName: 'Credit Support Annex', docValue: '', dealValue: 'CSA v2.1', diffType: 'missing_in_doc', severity: 'medium', status: 'accepted' },
  { id: 'DIF-006', documentId: 'DOC-006', fieldName: 'MWh Volume', docValue: '12,450 MWh', dealValue: '12,500 MWh', diffType: 'value_drift', severity: 'low', status: 'open' },
];

const demoExceptions: DocException[] = [
  { id: 'DXC-001', documentId: 'DOC-001', diffId: 'DIF-001', exceptionType: 'term_mismatch', description: 'ISDA threshold amount mismatch: document states $10M vs ETRM $15M', severity: 'critical', status: 'open', resolutionAction: null, createdAt: '2025-02-18' },
  { id: 'DXC-002', documentId: 'DOC-002', diffId: 'DIF-002', exceptionType: 'pricing_error', description: 'FX Forward settlement date discrepancy: 2 business days gap', severity: 'high', status: 'investigating', resolutionAction: null, createdAt: '2025-02-15' },
  { id: 'DXC-003', documentId: 'DOC-003', diffId: 'DIF-004', exceptionType: 'missing_clause', description: 'Load port "Fujairah" in charter party not captured in deal', severity: 'medium', status: 'open', resolutionAction: null, createdAt: '2025-02-12' },
  { id: 'DXC-004', documentId: 'DOC-005', diffId: 'DIF-005', exceptionType: 'missing_clause', description: 'CSA reference missing from MSA document', severity: 'medium', status: 'resolved', resolutionAction: 'accept_fix', createdAt: '2025-02-08' },
  { id: 'DXC-005', documentId: 'DOC-006', diffId: 'DIF-006', exceptionType: 'spec_deviation', description: 'ISO volume drift: 50 MWh delta between statement and deal', severity: 'low', status: 'open', resolutionAction: null, createdAt: '2025-02-05' },
];

export const useDocumentIntelligence = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('documents');

  const filteredDocs = useMemo(() => {
    return demoDocuments.filter(d => {
      const matchesSearch = !searchTerm || d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || d.counterparty?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = docTypeFilter === 'all' || d.docType === docTypeFilter;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, docTypeFilter, statusFilter]);

  const openDiffs = demoDiffs.filter(d => d.status === 'open').length;
  const extractedDocs = demoDocuments.filter(d => d.status === 'extracted').length;
  const pctProcessed = Math.round((extractedDocs / demoDocuments.length) * 100);
  const openExceptions = demoExceptions.filter(e => e.status !== 'resolved').length;
  const avgConfidence = Math.round(demoExtractions.reduce((s, e) => s + e.confidence, 0) / demoExtractions.length * 100);

  return {
    documents: filteredDocs,
    extractions: demoExtractions,
    diffs: demoDiffs,
    exceptions: demoExceptions,
    searchTerm, setSearchTerm,
    docTypeFilter, setDocTypeFilter,
    statusFilter, setStatusFilter,
    activeTab, setActiveTab,
    kpis: { openDiffs, pctProcessed, openExceptions, avgConfidence, totalDocs: demoDocuments.length, extractedDocs },
  };
};

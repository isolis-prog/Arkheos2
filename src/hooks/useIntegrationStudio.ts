import { useState, useMemo } from 'react';

export interface Connector {
  id: string;
  connectorType: 'etrm' | 'erp' | 'bank' | 'market_data' | 'iso' | 'ops';
  name: string;
  vendor: string;
  description: string;
  authMethod: string;
  supportedObjects: string[];
  isPublished: boolean;
  version: string;
}

export interface ConnectorInstance {
  id: string;
  connectorId: string;
  connectorName: string;
  instanceName: string;
  environment: 'dev' | 'staging' | 'prod';
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastHealthCheck: string | null;
  isActive: boolean;
}

export interface MappingVersion {
  id: string;
  instanceId: string;
  instanceName: string;
  mappingName: string;
  sourceObject: string;
  targetObject: string;
  fieldMappings: { source: string; target: string; transform: string | null; validation: string | null }[];
  commodityTemplate: string | null;
  versionNumber: number;
  status: 'draft' | 'testing' | 'approved' | 'published' | 'deprecated';
  changeReason: string | null;
}

export interface IntegrationJob {
  id: string;
  instanceName: string;
  mappingName: string;
  jobType: 'extract' | 'transform' | 'load' | 'full_sync' | 'validate';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errorMessage: string | null;
  retryCount: number;
  startedAt: string | null;
  completedAt: string | null;
}

const demoCatalog: Connector[] = [
  { id: 'CON-01', connectorType: 'etrm', name: 'Endur ETRM', vendor: 'ION/OpenLink', description: 'Full bi-directional sync with Endur for trades, positions, settlements', authMethod: 'oauth2', supportedObjects: ['trade', 'position', 'settlement', 'cashflow'], isPublished: true, version: '2.4.0' },
  { id: 'CON-02', connectorType: 'etrm', name: 'Allegro ETRM', vendor: 'ION/Allegro', description: 'Trade capture and P&L extraction from Allegro', authMethod: 'api_key', supportedObjects: ['trade', 'pnl', 'position'], isPublished: true, version: '1.8.0' },
  { id: 'CON-03', connectorType: 'erp', name: 'SAP S/4HANA', vendor: 'SAP', description: 'GL postings, AP/AR, and master data sync', authMethod: 'oauth2', supportedObjects: ['gl_posting', 'ap_invoice', 'ar_invoice', 'vendor', 'customer'], isPublished: true, version: '3.1.0' },
  { id: 'CON-04', connectorType: 'erp', name: 'Oracle Fusion', vendor: 'Oracle', description: 'Subledger journals, intercompany, and tax modules', authMethod: 'oauth2', supportedObjects: ['journal', 'intercompany', 'tax_calc'], isPublished: true, version: '2.0.1' },
  { id: 'CON-05', connectorType: 'bank', name: 'SWIFT MT/MX', vendor: 'SWIFT', description: 'Bank statement ingestion (MT940/942, camt.053)', authMethod: 'sftp_key', supportedObjects: ['statement', 'transaction'], isPublished: true, version: '1.5.0' },
  { id: 'CON-06', connectorType: 'market_data', name: 'Platts OPIS', vendor: 'S&P Global', description: 'Commodity price curves and assessments', authMethod: 'api_key', supportedObjects: ['price_curve', 'assessment', 'forward'], isPublished: true, version: '1.2.0' },
  { id: 'CON-07', connectorType: 'iso', name: 'ERCOT MIS', vendor: 'ERCOT', description: 'Settlement statements and meter data from ERCOT', authMethod: 'api_key', supportedObjects: ['settlement_stmt', 'meter_data', 'invoice'], isPublished: true, version: '1.0.0' },
  { id: 'CON-08', connectorType: 'ops', name: 'Veson IMOS', vendor: 'Veson Nautical', description: 'Voyage accounting, laytime, and demurrage', authMethod: 'api_key', supportedObjects: ['voyage', 'laytime', 'demurrage', 'freight'], isPublished: false, version: '0.9.0' },
];

const demoInstances: ConnectorInstance[] = [
  { id: 'INS-01', connectorId: 'CON-01', connectorName: 'Endur ETRM', instanceName: 'Endur Production', environment: 'prod', healthStatus: 'healthy', lastHealthCheck: '2025-02-20T10:00:00Z', isActive: true },
  { id: 'INS-02', connectorId: 'CON-01', connectorName: 'Endur ETRM', instanceName: 'Endur UAT', environment: 'staging', healthStatus: 'healthy', lastHealthCheck: '2025-02-20T10:00:00Z', isActive: true },
  { id: 'INS-03', connectorId: 'CON-03', connectorName: 'SAP S/4HANA', instanceName: 'SAP EU Entity', environment: 'prod', healthStatus: 'degraded', lastHealthCheck: '2025-02-20T09:55:00Z', isActive: true },
  { id: 'INS-04', connectorId: 'CON-05', connectorName: 'SWIFT MT/MX', instanceName: 'SWIFT Bank Feeds', environment: 'prod', healthStatus: 'healthy', lastHealthCheck: '2025-02-20T08:00:00Z', isActive: true },
  { id: 'INS-05', connectorId: 'CON-07', connectorName: 'ERCOT MIS', instanceName: 'ERCOT Settlements', environment: 'prod', healthStatus: 'down', lastHealthCheck: '2025-02-19T22:00:00Z', isActive: false },
];

const demoMappings: MappingVersion[] = [
  { id: 'MAP-01', instanceId: 'INS-01', instanceName: 'Endur Production', mappingName: 'Trade Extract → Canonical', sourceObject: 'endur.ab_tran', targetObject: 'canonical_records', fieldMappings: [
    { source: 'deal_tracking_num', target: 'deal_id', transform: 'to_string', validation: 'not_null' },
    { source: 'trade_date', target: 'date_primary', transform: 'parse_date(yyyy-MM-dd)', validation: 'is_date' },
    { source: 'position', target: 'amount', transform: 'abs', validation: 'is_numeric' },
    { source: 'ins_type', target: 'record_type', transform: 'lookup(instrument_map)', validation: 'in_list' },
  ], commodityTemplate: 'crude', versionNumber: 4, status: 'published', changeReason: 'Added ins_type mapping' },
  { id: 'MAP-02', instanceId: 'INS-03', instanceName: 'SAP EU Entity', mappingName: 'GL Posting → Subledger', sourceObject: 'sap.bkpf_bseg', targetObject: 'canonical_records', fieldMappings: [
    { source: 'BUKRS', target: 'legal_entity', transform: 'lookup(entity_map)', validation: 'not_null' },
    { source: 'BELNR', target: 'doc_id', transform: null, validation: 'not_null' },
    { source: 'DMBTR', target: 'amount', transform: 'to_decimal(2)', validation: 'is_numeric' },
  ], commodityTemplate: null, versionNumber: 2, status: 'approved', changeReason: 'Fixed entity lookup' },
  { id: 'MAP-03', instanceId: 'INS-04', instanceName: 'SWIFT Bank Feeds', mappingName: 'MT940 → Cashflow', sourceObject: 'swift.mt940', targetObject: 'cashflow_event', fieldMappings: [
    { source: 'field_61.value_date', target: 'value_date', transform: 'parse_date(yyMMdd)', validation: 'is_date' },
    { source: 'field_61.amount', target: 'amount_original', transform: 'parse_swift_amount', validation: 'is_numeric' },
  ], commodityTemplate: null, versionNumber: 1, status: 'draft', changeReason: null },
];

const demoJobs: IntegrationJob[] = [
  { id: 'JOB-101', instanceName: 'Endur Production', mappingName: 'Trade Extract → Canonical', jobType: 'full_sync', status: 'completed', recordsProcessed: 2450, recordsSuccess: 2438, recordsFailed: 12, errorMessage: null, retryCount: 0, startedAt: '2025-02-20T06:00:00Z', completedAt: '2025-02-20T06:08:32Z' },
  { id: 'JOB-102', instanceName: 'SAP EU Entity', mappingName: 'GL Posting → Subledger', jobType: 'extract', status: 'failed', recordsProcessed: 890, recordsSuccess: 756, recordsFailed: 134, errorMessage: 'Auth token expired after 420s', retryCount: 2, startedAt: '2025-02-20T06:00:00Z', completedAt: '2025-02-20T06:07:01Z' },
  { id: 'JOB-103', instanceName: 'SWIFT Bank Feeds', mappingName: 'MT940 → Cashflow', jobType: 'extract', status: 'completed', recordsProcessed: 312, recordsSuccess: 312, recordsFailed: 0, errorMessage: null, retryCount: 0, startedAt: '2025-02-20T08:00:00Z', completedAt: '2025-02-20T08:01:15Z' },
  { id: 'JOB-104', instanceName: 'Endur Production', mappingName: 'Trade Extract → Canonical', jobType: 'validate', status: 'running', recordsProcessed: 1200, recordsSuccess: 1180, recordsFailed: 20, errorMessage: null, retryCount: 0, startedAt: '2025-02-20T10:00:00Z', completedAt: null },
  { id: 'JOB-105', instanceName: 'ERCOT Settlements', mappingName: 'ERCOT → ISO Statement', jobType: 'extract', status: 'failed', recordsProcessed: 0, recordsSuccess: 0, recordsFailed: 0, errorMessage: 'Connection refused: ERCOT MIS endpoint unreachable', retryCount: 3, startedAt: '2025-02-20T06:00:00Z', completedAt: '2025-02-20T06:00:45Z' },
];

export const useIntegrationStudio = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('catalog');

  const filteredCatalog = useMemo(() => {
    return demoCatalog.filter(c => {
      const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || c.connectorType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, typeFilter]);

  const filteredJobs = useMemo(() => {
    return demoJobs.filter(j => {
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchesStatus;
    });
  }, [statusFilter]);

  const totalJobs = demoJobs.length;
  const successJobs = demoJobs.filter(j => j.status === 'completed').length;
  const jobSuccessRate = Math.round((successJobs / totalJobs) * 100);
  const activeInstances = demoInstances.filter(i => i.isActive).length;
  const publishedMappings = demoMappings.filter(m => m.status === 'published' || m.status === 'approved').length;

  return {
    catalog: filteredCatalog,
    instances: demoInstances,
    mappings: demoMappings,
    jobs: filteredJobs,
    searchTerm, setSearchTerm,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    activeTab, setActiveTab,
    kpis: { catalogSize: demoCatalog.length, activeInstances, publishedMappings, jobSuccessRate },
  };
};

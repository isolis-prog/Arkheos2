import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { correlationContext } from "@/lib/infrastructure/correlation";
import { parseSupabaseError, getErrorStatus } from "@/lib/utils/parseSupabaseError";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

const ModuleBoundary = ({ moduleKey }: { moduleKey: string }) => (
  <ErrorBoundary moduleKey={moduleKey}>
    <Outlet />
  </ErrorBoundary>
);

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import InboxPage from "./pages/InboxPage";
import DrillUiSandboxPage from "./pages/dev/DrillUiSandboxPage";
import Reconciliations from "./pages/Reconciliations";
import TemplateBuilderPage from "./pages/TemplateBuilder";
import MatchReview from "./pages/MatchReview";
import ExceptionsUnified from "./pages/ExceptionsUnified";
import ExceptionDetails from "./pages/ExceptionDetails";
import Amendments from "./pages/Amendments";
import DataLoads from "./pages/DataLoads";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import DataExplorer from "./pages/DataExplorer";
import NotFound from "./pages/NotFound";
import ReconAgentRuns from "./pages/ReconAgentRuns";
import ReconAgentRunDetail from "./pages/ReconAgentRunDetail";
 import TradeExplorer from "./pages/TradeExplorer";
 import TradeDetail from "./pages/TradeDetail";
 import TradeLifecycle from "./pages/TradeLifecycle";
 import PositionKeeper from "./pages/PositionKeeper";
 import MarkToMarket from "./pages/MarkToMarket";
 import RiskLimitsPage from "./pages/RiskLimits";
 import VaRDashboard from "./pages/VaRDashboard";
 import PnLAttribution from "./pages/PnLAttribution";
 import FXAnalytics from "./pages/FXAnalytics";
 import ValuationConsistency from "./pages/ValuationConsistency";
 import CloseReadiness from "./pages/CloseReadiness";
 import DataQuality from "./pages/DataQuality";
 import AuditExplainability from "./pages/AuditExplainability";
import Cashflows from "./pages/Cashflows";
import CashflowsDrillLayout from "./pages/cashflows/drill/CashflowsDrillLayout";
import BucketBreakdownPage from "./pages/cashflows/drill/BucketBreakdownPage";
import CashflowEntityBreakdownPage from "./pages/cashflows/drill/CashflowEntityBreakdownPage";
import CashflowCounterpartyBreakdownPage from "./pages/cashflows/drill/CashflowCounterpartyBreakdownPage";
import CashflowDocumentListPage from "./pages/cashflows/drill/CashflowDocumentListPage";
import CashflowDocumentTradesPage from "./pages/cashflows/drill/CashflowDocumentTradesPage";
import ReconciliationRunDetail from "./pages/reconciliations/RunDetail";
import ReconBreakTypeBreakdownPage from "./pages/reconciliations/drill/ReconBreakTypeBreakdownPage";
import ReconEntityBreakdownPage from "./pages/reconciliations/drill/ReconEntityBreakdownPage";
import ReconCounterpartyBreakdownPage from "./pages/reconciliations/drill/ReconCounterpartyBreakdownPage";
import ReconDocumentListPage from "./pages/reconciliations/drill/ReconDocumentListPage";
import ReconDocumentTradesPage from "./pages/reconciliations/drill/ReconDocumentTradesPage";
import ERPConnectors from "./pages/ERPConnectors";
import ERPConnectorNew from "./pages/ERPConnectorNew";
import ERPConnectorDetailPage from "./pages/ERPConnectorDetailPage";
import TradeToCash from "./pages/TradeToCash";
import DeveloperPortal from "./pages/DeveloperPortal";
import RulesEnginePage from "./pages/RulesEngine";
import Analytics from "./pages/Analytics";
import StructuredPricing from "./pages/StructuredPricing";
import MarketAnalytics from "./pages/MarketAnalytics";
import Logistics from "./pages/Logistics";
import PlatformSettings from "./pages/PlatformSettings";
import Studio from "./pages/Studio";
import Community from "./pages/Community";
import PositionRiskHub from "./pages/PositionRiskHub";
import CloseManagementHub from "./pages/CloseManagementHub";
import Scheduling from "./pages/Scheduling";
import Measurements from "./pages/Measurements";
import Inventory from "./pages/Inventory";
import Quality from "./pages/Quality";
import LogisticsCosts from "./pages/LogisticsCosts";
import ShippingChartering from "./pages/ShippingChartering";
import ISOSettlements from "./pages/ISOSettlements";
import MarketData from "./pages/MarketData";
import HedgeAccounting from "./pages/HedgeAccounting";
import CollateralMargin from "./pages/CollateralMargin";
import TradeFinance from "./pages/TradeFinance";
import CreditExposure from "./pages/CreditExposure";
import CreditRiskManagement from "./pages/CreditRiskManagement";
import MiddleOfficeControl from "./pages/MiddleOfficeControl";
import DealToGL from "./pages/DealToGL";
import Intercompany from "./pages/Intercompany";
import TaxControls from "./pages/TaxControls";
import CloseCockpit from "./pages/CloseCockpit";
import DocumentIntelligence from "./pages/DocumentIntelligence";
import DataHealth from "./pages/DataHealth";
import IntegrationStudio from "./pages/IntegrationStudio";
import CoreMappings from "./pages/CoreMappings";
import ExceptionInbox from "./pages/ExceptionInbox";
import ConfirmationsRecon from "./pages/ConfirmationsRecon";
import TradeConfirmationListPage from "./pages/confirmations/drill/TradeConfirmationListPage";
import TradeConfirmationDetailPage from "./pages/confirmations/drill/TradeConfirmationDetailPage";
import CloseReadyReportPage from "./pages/confirmations/CloseReadyReportPage";
import MatchingSimulatorPage from "./pages/confirmations/MatchingSimulatorPage";
import TradeCaptureQA from "./pages/TradeCaptureQA";
import MDMGovernance from "./pages/MDMGovernance";
import OpsActualsLite from "./pages/OpsActualsLite";
import MarketDataControlsLite from "./pages/MarketDataControlsLite";
import CashSettlementLite from "./pages/CashSettlementLite";
import ValuationRecon from "./pages/ValuationRecon";
import ValuationReconMatchReview from "./pages/ValuationReconMatchReview";
import ValuationReconTemplateBuilderPage from "./pages/ValuationReconTemplateBuilder";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import RegulatoryCalendar from "./pages/RegulatoryCalendar";
import ReportBuilder from "./pages/ReportBuilder";
import PreSubmissionValidator from "./pages/PreSubmissionValidator";
import SubmissionTracker from "./pages/SubmissionTracker";
import InternalAudit from "./pages/InternalAudit";
import ESGModule from "./pages/ESGModule";
import SupplyChainStatus from "./pages/SupplyChainStatus";
import DeveloperHub from "./pages/DeveloperHub";
import DrillPreview from "./pages/DrillPreview";
import CashflowDrillPerfReport from "./pages/dev/CashflowDrillPerfReport";
import DealLensPage from "./pages/DealLensPage";

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

const NO_RETRY_STATUSES = new Set([400, 401, 403, 404, 422]);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const status = getErrorStatus(error);
      const message = parseSupabaseError(error);
      // eslint-disable-next-line no-console
      console.error('[QueryCache]', { queryKey: query.queryKey, status, error });

      // Only escalate true server faults to immutable audit log
      if (status !== null && status >= 500) {
        void supabase.from('audit_events').insert({
          tenant_id: TENANT_ID,
          module_key: 'react-query',
          entity_type: 'query',
          entity_id: null,
          action: 'CLIENT_ERROR' as any,
          actor_id: null,
          correlation_id: correlationContext.get(),
          summary: `Query failed (${status}): ${message}`,
          before_state: null,
          after_state: null,
          diff: null,
          metadata: {
            severity: 'high',
            status,
            query_key: query.queryKey,
            url: typeof window !== 'undefined' ? window.location.href : null,
          } as any,
        }).then(({ error: e }) => {
          if (e) console.error('[QueryCache] audit insert failed', e);
        });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      const message = parseSupabaseError(error);
      // eslint-disable-next-line no-console
      console.error('[MutationCache]', { mutationKey: mutation.options.mutationKey, error });
      // Suppress global toast if the mutation opted out via meta
      if (mutation.meta?.suppressErrorToast) return;
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status = getErrorStatus(error);
        if (status !== null && NO_RETRY_STATUSES.has(status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/dev/drill-sandbox" element={<DrillUiSandboxPage />} />
              <Route path="/position-risk" element={<PositionRiskHub />} />
              <Route path="/close-management-hub" element={<CloseManagementHub />} />
              <Route element={<ModuleBoundary moduleKey="reconciliations" />}>
                <Route path="/reconciliations" element={<Reconciliations />} />
                <Route path="/reconciliations/templates/:templateId" element={<TemplateBuilderPage />} />
                <Route path="/reconciliations/run/:id" element={<ReconciliationRunDetail />} />
                <Route path="/reconciliations/:runId" element={<MatchReview />} />
                <Route path="/reconciliations/:runId/drill/by-type" element={<ReconBreakTypeBreakdownPage />} />
                <Route path="/reconciliations/:runId/drill/by-entity" element={<ReconEntityBreakdownPage />} />
                <Route path="/reconciliations/:runId/drill/by-counterparty" element={<ReconCounterpartyBreakdownPage />} />
                <Route path="/reconciliations/:runId/drill/documents" element={<ReconDocumentListPage />} />
                <Route path="/reconciliations/:runId/drill/documents/:docId" element={<ReconDocumentTradesPage />} />
              </Route>
              <Route path="/recon-agent" element={<ReconAgentRuns />} />
              <Route path="/recon-agent/:runId" element={<ReconAgentRunDetail />} />
              <Route path="/exceptions" element={<ExceptionsUnified />} />
              <Route path="/exceptions/:exceptionId" element={<ExceptionDetails />} />
              <Route path="/amendments" element={<Amendments />} />
              <Route path="/data-loads" element={<DataLoads />} />
              <Route path="/data-explorer" element={<DataExplorer />} />
               <Route path="/trade-explorer" element={<TradeExplorer />} />
               <Route path="/trade-explorer/:dealId" element={<TradeDetail />} />
               <Route path="/trade-lifecycle" element={<TradeLifecycle />} />
               <Route path="/position-keeper" element={<PositionKeeper />} />
               <Route path="/mark-to-market" element={<MarkToMarket />} />
               <Route path="/risk-limits" element={<RiskLimitsPage />} />
               <Route path="/var-dashboard" element={<VaRDashboard />} />
               <Route path="/pnl-attribution" element={<PnLAttribution />} />
              <Route path="/fx-analytics" element={<FXAnalytics />} />
              <Route path="/close-readiness" element={<CloseReadiness />} />
              <Route path="/close-cockpit" element={<CloseCockpit />} />
               <Route path="/data-quality" element={<DataQuality />} />
               <Route path="/audit-explainability" element={<AuditExplainability />} />
              <Route element={<ModuleBoundary moduleKey="cashflows" />}>
                <Route path="/cashflows" element={<Cashflows />} />
                <Route element={<CashflowsDrillLayout />}>
                  <Route path="/cashflows/buckets" element={<BucketBreakdownPage />} />
                  <Route path="/cashflows/buckets/by-entity" element={<CashflowEntityBreakdownPage />} />
                  <Route path="/cashflows/buckets/by-counterparty" element={<CashflowCounterpartyBreakdownPage />} />
                  <Route path="/cashflows/documents" element={<CashflowDocumentListPage />} />
                  <Route path="/cashflows/documents/:cashflowId/trades" element={<CashflowDocumentTradesPage />} />
                </Route>
              </Route>
              <Route element={<ModuleBoundary moduleKey="trade-to-cash" />}>
                <Route path="/trade-to-cash" element={<TradeToCash />} />
              </Route>
              <Route path="/logistics" element={<Logistics />} />
              <Route path="/logistics-costs" element={<LogisticsCosts />} />
              <Route path="/shipping-chartering" element={<ShippingChartering />} />
              <Route path="/integrations/erp-connectors" element={<ERPConnectors />} />
              <Route path="/integrations/erp-connectors/new" element={<ERPConnectorNew />} />
              <Route path="/integrations/erp-connectors/:connectorId" element={<ERPConnectorDetailPage />} />
              <Route path="/developer" element={<Navigate to="/developer-hub?tab=api-webhooks" replace />} />
              <Route path="/developer-hub" element={<DeveloperHub />} />
              <Route path="/platform" element={<PlatformSettings />} />
              <Route path="/mappings" element={<CoreMappings />} />
              <Route path="/exception-inbox" element={<Navigate to="/exceptions" replace />} />
              <Route element={<ModuleBoundary moduleKey="confirmations" />}>
                <Route path="/confirmations-recon" element={<ConfirmationsRecon />} />
                <Route path="/confirmations-recon/close-ready" element={<CloseReadyReportPage />} />
                <Route path="/confirmations-recon/simulator" element={<MatchingSimulatorPage />} />
                <Route path="/confirmations-recon/:runId/trades" element={<TradeConfirmationListPage />} />
                <Route path="/confirmations-recon/:runId/trades/:dealId" element={<TradeConfirmationDetailPage />} />
              </Route>
              <Route path="/trade-capture-qa" element={<TradeCaptureQA />} />
              <Route path="/mdm-governance" element={<MDMGovernance />} />
              <Route path="/ops-actuals" element={<OpsActualsLite />} />
              <Route path="/market-data-controls" element={<MarketDataControlsLite />} />
              <Route path="/cash-settlement" element={<CashSettlementLite />} />
              <Route element={<ModuleBoundary moduleKey="valuation" />}>
                <Route path="/valuation" element={<ValuationConsistency />} />
                <Route path="/valuation-recon" element={<ValuationRecon />} />
                <Route path="/valuation-recon/templates/:templateId" element={<ValuationReconTemplateBuilderPage />} />
                <Route path="/valuation-recon/:runId" element={<ValuationReconMatchReview />} />
              </Route>
              <Route path="/reg-reporting" element={<ComplianceDashboard />} />
              <Route path="/reg-reporting/calendar" element={<RegulatoryCalendar />} />
              <Route path="/reg-reporting/builder" element={<ReportBuilder />} />
              <Route path="/reg-reporting/validator" element={<PreSubmissionValidator />} />
              <Route path="/reg-reporting/submissions" element={<SubmissionTracker />} />
              <Route path="/rules" element={<RulesEnginePage />} />
              <Route path="/studio" element={<Navigate to="/developer-hub?tab=workflow-builder" replace />} />
              <Route path="/middle-office" element={<MiddleOfficeControl />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/structured-pricing" element={<StructuredPricing />} />
              <Route path="/market-analytics" element={<MarketAnalytics />} />
              <Route path="/community" element={<Community />} />
              <Route path="/scheduling" element={<Scheduling />} />
              <Route path="/measurements" element={<Measurements />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/iso-settlements" element={<ISOSettlements />} />
              <Route path="/market-data" element={<MarketData />} />
              <Route path="/hedge-accounting" element={<HedgeAccounting />} />
              <Route path="/collateral-margin" element={<CollateralMargin />} />
              <Route path="/trade-finance" element={<TradeFinance />} />
              <Route path="/credit-exposure" element={<CreditExposure />} />
              <Route path="/credit-risk-management" element={<CreditRiskManagement />} />
              <Route path="/close-management" element={<DealToGL />} />
              <Route path="/intercompany" element={<Intercompany />} />
              <Route path="/tax-controls" element={<TaxControls />} />
              <Route path="/doc-intelligence" element={<DocumentIntelligence />} />
              <Route path="/data-health" element={<DataHealth />} />
              <Route path="/integration-studio" element={<Navigate to="/developer-hub?tab=connectors" replace />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/internal-audit" element={<InternalAudit />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/esg" element={<ESGModule />} />
              <Route path="/operations/supply-chain-status" element={<SupplyChainStatus />} />
              <Route path="/dev/drill-preview" element={<DrillPreview />} />
              <Route path="/dev/cashflow-drill-perf" element={<CashflowDrillPerfReport />} />
              <Route path="/deal/:dealId" element={<DealLensPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

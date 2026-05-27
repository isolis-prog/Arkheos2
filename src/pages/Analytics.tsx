import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExecutiveSummary } from '@/components/analytics/ExecutiveSummary';
import { ExceptionInsights } from '@/components/analytics/ExceptionInsights';
import { PostingHealth } from '@/components/analytics/PostingHealth';
import { AnomalyDetection } from '@/components/analytics/AnomalyDetection';
import { AlertThresholds } from '@/components/analytics/AlertThresholds';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Analytics"
        description="Executive dashboards, exception insights, posting health, and anomaly detection"
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        }
      />

      <Tabs defaultValue="executive" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
          <TabsTrigger value="exceptions">Exception Insights</TabsTrigger>
          <TabsTrigger value="posting">Posting Health</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="alerts">Alert Config</TabsTrigger>
        </TabsList>

        <TabsContent value="executive">
          <ExecutiveSummary />
        </TabsContent>
        <TabsContent value="exceptions">
          <ExceptionInsights />
        </TabsContent>
        <TabsContent value="posting">
          <PostingHealth />
        </TabsContent>
        <TabsContent value="anomalies">
          <AnomalyDetection />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertThresholds />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;

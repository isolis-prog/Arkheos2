import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiKeysPanel } from '@/components/developer/ApiKeysPanel';
import { WebhooksPanel } from '@/components/developer/WebhooksPanel';
import { ApiExplorer } from '@/components/developer/ApiExplorer';
import { useDeveloperPlatform } from '@/hooks/useDeveloperPlatform';

const DeveloperPortal = () => {
  const dev = useDeveloperPlatform();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Portal"
        description="API keys, webhooks, and OpenAPI explorer for third-party integrations"
      />

      <Tabs value={dev.activeTab} onValueChange={dev.setActiveTab}>
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="explorer">API Explorer</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <ApiKeysPanel apiKeys={dev.apiKeys} auditLogs={dev.auditLogs} auditStats={dev.auditStats} />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksPanel webhooks={dev.webhooks} deliveries={dev.deliveries} deliveryStats={dev.deliveryStats} />
        </TabsContent>

        <TabsContent value="explorer">
          <ApiExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperPortal;

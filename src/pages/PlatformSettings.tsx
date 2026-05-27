import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureFlagsPanel } from '@/components/platform/FeatureFlagsPanel';
import { BackgroundJobsPanel } from '@/components/platform/BackgroundJobsPanel';
import { EventBusPanel } from '@/components/platform/EventBusPanel';
import { ObservabilityPanel } from '@/components/platform/ObservabilityPanel';
import { AISettingsPanel } from '@/components/ail/AISettingsPanel';
import { usePlatformInfra } from '@/hooks/usePlatformInfra';
import { useState } from 'react';

const PlatformSettings = () => {
  const infra = usePlatformInfra();
  const [tab, setTab] = useState('feature-flags');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Infrastructure"
        description="Feature flags, background jobs, event bus, observability, and compliance"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="ai-settings">AI Intelligence</TabsTrigger>
          <TabsTrigger value="jobs">Background Jobs ({infra.jobStats.total})</TabsTrigger>
          <TabsTrigger value="events">Event Bus ({infra.eventStats.total})</TabsTrigger>
          <TabsTrigger value="observability">Observability & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="feature-flags">
          <FeatureFlagsPanel />
        </TabsContent>

        <TabsContent value="ai-settings">
          <AISettingsPanel />
        </TabsContent>

        <TabsContent value="jobs">
          <BackgroundJobsPanel
            jobs={infra.jobs}
            stats={infra.jobStats}
            filter={infra.jobFilter}
            setFilter={infra.setJobFilter}
          />
        </TabsContent>

        <TabsContent value="events">
          <EventBusPanel
            events={infra.events}
            stats={infra.eventStats}
            filter={infra.eventFilter}
            setFilter={infra.setEventFilter}
          />
        </TabsContent>

        <TabsContent value="observability">
          <ObservabilityPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformSettings;

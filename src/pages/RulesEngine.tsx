import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RulesetsList } from '@/components/rules-engine/RulesetsList';
import { RuleBuilder } from '@/components/rules-engine/RuleBuilder';
import { SimulationPanel } from '@/components/rules-engine/SimulationPanel';
import { useRulesEngine } from '@/hooks/useRulesEngine';
import { useState } from 'react';

const RulesEnginePage = () => {
  const engine = useRulesEngine();
  const [tab, setTab] = useState('rulesets');

  // If a ruleset is selected, show the builder
  if (engine.selectedRuleset) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rules Engine" description="Configurable matching, transform, tolerance, and exception policy rules" />
        <RuleBuilder ruleset={engine.selectedRuleset} onBack={() => engine.setSelectedRulesetId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rules Engine"
        description="Configurable matching, transform, tolerance, and exception policy rules with versioning"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="rulesets">Rulesets ({engine.stats.total})</TabsTrigger>
          <TabsTrigger value="simulation">Simulation & Execution</TabsTrigger>
        </TabsList>

        <TabsContent value="rulesets">
          <RulesetsList
            rulesets={engine.filteredRulesets}
            categoryFilter={engine.categoryFilter}
            setCategoryFilter={engine.setCategoryFilter}
            statusFilter={engine.statusFilter}
            setStatusFilter={engine.setStatusFilter}
            searchQuery={engine.searchQuery}
            setSearchQuery={engine.setSearchQuery}
            onSelect={engine.setSelectedRulesetId}
          />
        </TabsContent>

        <TabsContent value="simulation">
          <SimulationPanel executions={engine.executions} stats={engine.stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RulesEnginePage;

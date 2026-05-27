import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { Marketplace } from '@/components/community/Marketplace';
import { PackDetailView } from '@/components/community/PackDetailView';
import { Playbooks } from '@/components/community/Playbooks';
import { InstalledPacks } from '@/components/community/InstalledPacks';
import { useCommunity } from '@/hooks/useCommunity';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Store, BookOpen, Package, Lock } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect } from 'react';
import { toast } from 'sonner';

const Community = () => {
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled('module.community_marketplace')) {
    return <CommunityComingSoon />;
  }

  return <CommunityContent />;
};

const CommunityComingSoon = () => {
  useEffect(() => {
    toast.info('Community Marketplace — Coming Soon. Contact your account manager for early access.');
  }, []);

  return <Navigate to="/dashboard" replace />;
};

const CommunityContent = () => {
  const {
    packs, installations, activeTab, setActiveTab,
    selectedPack, setSelectedPack,
    typeFilter, setTypeFilter,
    categoryFilter, setCategoryFilter,
    searchQuery, setSearchQuery,
    getReviewsForPack,
  } = useCommunity();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community"
        description="Marketplace for templates, rule packs, connectors, and playbooks"
      />

      {selectedPack ? (
        <PackDetailView
          pack={selectedPack}
          reviews={getReviewsForPack(selectedPack.id)}
          onBack={() => setSelectedPack(null)}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="marketplace" className="gap-1.5"><Store className="h-4 w-4" /> Marketplace</TabsTrigger>
            <TabsTrigger value="playbooks" className="gap-1.5"><BookOpen className="h-4 w-4" /> Playbooks</TabsTrigger>
            <TabsTrigger value="installed" className="gap-1.5"><Package className="h-4 w-4" /> Installed</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace">
            <Marketplace
              packs={packs}
              typeFilter={typeFilter}
              categoryFilter={categoryFilter}
              searchQuery={searchQuery}
              onTypeChange={setTypeFilter}
              onCategoryChange={setCategoryFilter}
              onSearchChange={setSearchQuery}
              onSelect={setSelectedPack}
            />
          </TabsContent>
          <TabsContent value="playbooks"><Playbooks /></TabsContent>
          <TabsContent value="installed"><InstalledPacks installations={installations} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Community;

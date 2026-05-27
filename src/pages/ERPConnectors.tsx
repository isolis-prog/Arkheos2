import { PageHeader } from '@/components/ui/page-header';
import { ConnectorsList } from '@/components/erp-connectors/ConnectorsList';

const ERPConnectors = () => {
  return (
    <div>
      <PageHeader
        title="ERP Connectors"
        description="Native integrations with SAP, Oracle, NetSuite, Dynamics 365, and custom REST APIs"
      />
      <ConnectorsList />
    </div>
  );
};

export default ERPConnectors;

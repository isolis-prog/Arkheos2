import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QualityCertificate } from '@/hooks/useQuality';
import { format } from 'date-fns';
import { ArrowLeft, AlertTriangle, CheckCircle, FileText, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  certificate: QualityCertificate;
  onBack: () => void;
  onCreateClaim: (certId: string) => void;
}

export const CertificateDetailPanel = ({ certificate: c, onBack, onCreateClaim }: Props) => {
  const totalAttrs = c.attrs.length;
  const passCount = c.attrs.filter(a => a.status === 'pass').length;
  const passRate = totalAttrs > 0 ? (passCount / totalAttrs) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h2 className="text-lg font-semibold">Certificate {c.certificateRef}</h2>
        <Badge variant="outline" className="ml-auto">{c.status}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Delivery', c.deliveryId], ['Deal', c.dealId], ['Commodity', c.commodity], ['Counterparty', c.counterparty],
          ['Lab', c.labName], ['Sample Date', format(new Date(c.sampleDate), 'dd MMM yyyy')],
          ['Penalty', `$${c.penaltyTotal.toLocaleString()}`], ['Bonus', `$${c.bonusTotal.toLocaleString()}`],
        ].map(([label, val]) => (
          <div key={label as string}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-sm">{val}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Quality Attributes
            <span className="text-xs text-muted-foreground">{passCount}/{totalAttrs} pass</span>
          </CardTitle>
          <Progress value={passRate} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {c.attrs.map(attr => (
            <div key={attr.key} className="flex items-center gap-3 text-sm">
              {attr.status === 'pass' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className={`h-4 w-4 ${attr.status === 'fail' ? 'text-destructive' : 'text-yellow-600'}`} />}
              <span className="font-medium w-40">{attr.key}</span>
              <span className="font-mono">{attr.value} {attr.unit}</span>
              <span className="text-muted-foreground ml-auto text-xs">
                Contract: {attr.contractMin}–{attr.contractMax} {attr.unit}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Net Adjustment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Penalties − Bonuses</p>
              <p className={`text-2xl font-bold ${c.netAdjustment < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {c.netAdjustment < 0 ? '-' : '+'}${Math.abs(c.netAdjustment).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> View Certificate</Button>
              {c.penaltyTotal > 0 && (
                <Button size="sm" onClick={() => onCreateClaim(c.id)}>
                  <Plus className="h-4 w-4 mr-1" /> Create Claim
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

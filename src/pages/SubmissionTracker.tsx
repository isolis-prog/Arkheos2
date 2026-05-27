import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRegulatoryReporting, type Submission, type Agency } from '@/hooks/useRegulatoryReporting';
import { FilingStatusBadge, RegulatoryDisclaimer } from '@/pages/ComplianceDashboard';
import { FileText, Eye, RotateCcw, Download, Clock, CheckCircle, XCircle, ArrowRight, Send, Filter } from 'lucide-react';
import { toast } from 'sonner';

const SubmissionTracker = () => {
  const { submissions, agencyFilter, setAgencyFilter, statusFilter, setStatusFilter } = useRegulatoryReporting();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submission Tracker"
        description="Complete record of every regulatory submission — queued, submitted, confirmed, or rejected"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={agencyFilter} onValueChange={v => setAgencyFilter(v as Agency | 'ALL')}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Agencies</SelectItem>
            <SelectItem value="CFTC">CFTC</SelectItem>
            <SelectItem value="FERC">FERC</SelectItem>
            <SelectItem value="EIA">EIA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="LATE">Late</SelectItem>
            <SelectItem value="SUPERSEDED">Superseded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Submissions ({submissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Report</th>
                  <th className="text-left py-2 font-medium">Agency</th>
                  <th className="text-left py-2 font-medium">Period</th>
                  <th className="text-left py-2 font-medium">Submitted</th>
                  <th className="text-left py-2 font-medium">By</th>
                  <th className="text-left py-2 font-medium">Method</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Confirmation #</th>
                  <th className="text-left py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id} className={`border-b hover:bg-muted/50 ${s.status === 'REJECTED' ? 'bg-destructive/5' : ''}`}>
                    <td className="py-2 font-medium">{s.reportName}</td>
                    <td className="py-2"><Badge variant="outline">{s.agency}</Badge></td>
                    <td className="py-2 text-muted-foreground">{s.period}</td>
                    <td className="py-2 text-xs text-muted-foreground">{s.submissionDate?.split(' ')[0] || '—'}</td>
                    <td className="py-2 text-muted-foreground">{s.submittedBy || '—'}</td>
                    <td className="py-2 text-xs text-muted-foreground">{s.submissionMethod}</td>
                    <td className="py-2"><FilingStatusBadge status={s.status} /></td>
                    <td className="py-2 text-xs font-mono">{s.confirmationNumber || '—'}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(s)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {s.status === 'REJECTED' && (
                          <Button variant="ghost" size="sm" onClick={() => toast.info('Creating corrected report...')}>
                            <RotateCcw className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        {s.status === 'QUEUED' && (
                          <Button variant="ghost" size="sm" onClick={() => toast.success('Submission initiated')}>
                            <Send className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSubmission.reportName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Agency:</span> <span className="font-medium">{selectedSubmission.agency}</span></div>
                  <div><span className="text-muted-foreground">Period:</span> <span className="font-medium">{selectedSubmission.period}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <FilingStatusBadge status={selectedSubmission.status} /></div>
                  <div><span className="text-muted-foreground">Method:</span> <span className="font-medium">{selectedSubmission.submissionMethod}</span></div>
                  <div><span className="text-muted-foreground">Submitted:</span> <span className="font-medium">{selectedSubmission.submissionDate || 'Pending'}</span></div>
                  <div><span className="text-muted-foreground">By:</span> <span className="font-medium">{selectedSubmission.submittedBy || '—'}</span></div>
                  {selectedSubmission.confirmationNumber && (
                    <div className="col-span-2"><span className="text-muted-foreground">Confirmation #:</span> <span className="font-mono font-medium">{selectedSubmission.confirmationNumber}</span></div>
                  )}
                </div>

                {selectedSubmission.rejectionReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedSubmission.rejectionReason}</p>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Timeline</h4>
                  <div className="space-y-2">
                    <TimelineStep icon={<FileText className="h-4 w-4" />} label="Generated" done />
                    <TimelineStep icon={<CheckCircle className="h-4 w-4" />} label="Validated" done />
                    <TimelineStep icon={<CheckCircle className="h-4 w-4" />} label="Approved" done={selectedSubmission.status !== 'QUEUED'} />
                    <TimelineStep icon={<Send className="h-4 w-4" />} label="Submitted" done={['SUBMITTED', 'CONFIRMED', 'LATE', 'REJECTED'].includes(selectedSubmission.status)} />
                    <TimelineStep icon={<CheckCircle className="h-4 w-4" />} label="Confirmed" done={selectedSubmission.status === 'CONFIRMED'} />
                  </div>
                </div>

                {/* Notes */}
                {selectedSubmission.notes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Notes (append-only)</h4>
                    <div className="space-y-1">
                      {selectedSubmission.notes.map((n, i) => (
                        <div key={i} className="text-sm border rounded p-2 bg-muted/30">
                          <span className="text-muted-foreground">{n.date} — {n.author}:</span> {n.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" /> Download File
                  </Button>
                  {selectedSubmission.status === 'REJECTED' && (
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedSubmission(null); toast.info('Creating corrected report...'); }}>
                      <RotateCcw className="h-4 w-4 mr-1" /> Create Corrected Report
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <RegulatoryDisclaimer />
    </div>
  );
};

function TimelineStep({ icon, label, done }: { icon: React.ReactNode; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={done ? 'text-emerald-600' : 'text-muted-foreground/40'}>{icon}</div>
      <span className={done ? 'font-medium' : 'text-muted-foreground/40'}>{label}</span>
      {done && <CheckCircle className="h-3 w-3 text-emerald-600" />}
    </div>
  );
}

export default SubmissionTracker;

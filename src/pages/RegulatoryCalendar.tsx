import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRegulatoryReporting, type Agency } from '@/hooks/useRegulatoryReporting';
import { FilingStatusBadge, RegulatoryDisclaimer } from '@/pages/ComplianceDashboard';
import { Calendar, List, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { useState } from 'react';

const RegulatoryCalendar = () => {
  const { calendarEvents, agencyFilter, setAgencyFilter, statusFilter, setStatusFilter, calendarView, setCalendarView, filingLibrary } = useRegulatoryReporting();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);

  const monthEvents = calendarEvents.filter(e => {
    const d = new Date(e.dueDate);
    return d >= monthStart && d <= monthEnd;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regulatory Calendar"
        description="Filing obligations tracker — upcoming, in-progress, and completed regulatory filings"
        actions={
          <div className="flex items-center gap-2">
            <Button variant={calendarView === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setCalendarView('calendar')}>
              <Calendar className="h-4 w-4 mr-1" /> Calendar
            </Button>
            <Button variant={calendarView === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setCalendarView('list')}>
              <List className="h-4 w-4 mr-1" /> List
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
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
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="READY_FOR_REVIEW">Ready for Review</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {calendarView === 'calendar' ? (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>← Prev</Button>
            <CardTitle className="text-base">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next →</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px text-center text-xs text-muted-foreground mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-1 font-medium">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: startDow }).map((_, i) => <div key={`e-${i}`} className="h-20 bg-muted/20 rounded" />)}
              {daysInMonth.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayEvents = monthEvents.filter(e => e.dueDate === dayStr);
                return (
                  <div key={dayStr} className="h-20 border rounded p-1 text-xs overflow-hidden hover:bg-muted/30">
                    <div className="font-medium text-muted-foreground">{day.getDate()}</div>
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className={`mt-0.5 truncate rounded px-1 py-0.5 text-[10px] ${
                        e.status === 'SUBMITTED' ? 'bg-emerald-500/10 text-emerald-700' :
                        e.status === 'OVERDUE' ? 'bg-destructive/10 text-destructive' :
                        e.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-700' :
                        e.status === 'READY_FOR_REVIEW' ? 'bg-amber-500/10 text-amber-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {e.agency}: {e.filingName.substring(0, 20)}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground mt-0.5">+{dayEvents.length - 2} more</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filing Obligations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Filing Name</th>
                    <th className="text-left py-2 font-medium">Agency</th>
                    <th className="text-left py-2 font-medium">Due Date</th>
                    <th className="text-left py-2 font-medium">Period</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarEvents.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(e => (
                    <tr key={e.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 font-medium">{e.filingName}</td>
                      <td className="py-2"><Badge variant="outline">{e.agency}</Badge></td>
                      <td className="py-2">{e.dueDate}</td>
                      <td className="py-2 text-muted-foreground text-xs">{e.periodCoveredStart} — {e.periodCoveredEnd}</td>
                      <td className="py-2"><FilingStatusBadge status={e.status} /></td>
                      <td className="py-2 text-muted-foreground">{e.assignedOwner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filing Library */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filing Obligations Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Filing</th>
                  <th className="text-left py-2 font-medium">Agency</th>
                  <th className="text-left py-2 font-medium">Frequency</th>
                  <th className="text-left py-2 font-medium">Due</th>
                  <th className="text-left py-2 font-medium">Format</th>
                  <th className="text-left py-2 font-medium">Applicable</th>
                </tr>
              </thead>
              <tbody>
                {filingLibrary.map(f => (
                  <tr key={f.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 font-medium">{f.filingName}</td>
                    <td className="py-2"><Badge variant="outline">{f.agency}</Badge></td>
                    <td className="py-2 text-muted-foreground">{f.frequency}</td>
                    <td className="py-2 text-muted-foreground text-xs">{f.dueDescription}</td>
                    <td className="py-2 text-xs">{f.outputFormat}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={f.applicable === 'YES' ? 'bg-emerald-500/10 text-emerald-600' : f.applicable === 'CONDITIONAL' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted'}>
                        {f.applicable}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <RegulatoryDisclaimer />
    </div>
  );
};

export default RegulatoryCalendar;

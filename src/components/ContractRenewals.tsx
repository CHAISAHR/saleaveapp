import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiConfig } from "@/config/apiConfig";
import { Mail, Send, CheckCircle2, PlayCircle } from "lucide-react";

interface Renewal {
  renewal_id: number | null;
  user_email: string;
  user_name: string;
  department: string;
  manager_email: string | null;
  contract_termination_date: string;
  status: 'Initiated' | 'Sent to HR' | 'Completed' | null;
  initiated_by: string | null;
  initiated_at: string | null;
  sent_to_hr_by: string | null;
  sent_to_hr_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  last_reminder_sent_at: string | null;
  notes: string | null;
}

interface Props {
  userRole: 'manager' | 'admin' | 'cd' | 'employee';
}

const STATUS_STEPS: Array<'Initiated' | 'Sent to HR' | 'Completed'> = ['Initiated', 'Sent to HR', 'Completed'];

const statusColor = (s: string | null) => {
  if (s === 'Completed') return 'bg-green-100 text-green-800';
  if (s === 'Sent to HR') return 'bg-blue-100 text-blue-800';
  if (s === 'Initiated') return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

const daysUntil = (dateStr: string) => {
  const d = new Date(dateStr).getTime();
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
};

export const ContractRenewals = ({ userRole }: Props) => {
  const { toast } = useToast();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    'Content-Type': 'application/json',
  });

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiConfig.endpoints.contractRenewals, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setRenewals(data.renewals || []);
      else throw new Error(data.message);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load contract renewals", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRenewals(); }, []);

  const initiate = async (r: Renewal) => {
    try {
      const res = await fetch(`${apiConfig.endpoints.contractRenewals}/initiate`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ user_email: r.user_email })
      });
      if (!res.ok) throw new Error('Initiate failed');
      toast({ title: "Initiated", description: `Renewal initiated for ${r.user_name}` });
      fetchRenewals();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const updateStatus = async (r: Renewal, status: 'Sent to HR' | 'Completed') => {
    if (!r.renewal_id) return;
    try {
      const res = await fetch(`${apiConfig.endpoints.contractRenewals}/${r.renewal_id}/status`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Update failed');
      toast({ title: "Updated", description: `Status changed to ${status}` });
      fetchRenewals();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const sendReminders = async () => {
    try {
      const res = await fetch(`${apiConfig.endpoints.contractRenewals}/send-reminders`, {
        method: 'POST', headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Reminders sent", description: `${data.sent} reminder(s) sent for ${data.totalExpiring} expiring contract(s).` });
        fetchRenewals();
      } else throw new Error(data.message);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="p-6">Loading contract renewals...</div>;

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contract Renewals</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin
                ? "All active employees with a contract end date. Reminders are sent automatically 2 months before expiry."
                : "Your team members with an upcoming contract end date."}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={sendReminders} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" /> Run reminder job
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Contract End</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Reminder</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renewals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No contract renewals to display.
                    </TableCell>
                  </TableRow>
                )}
                {renewals.map((r) => {
                  const dl = daysUntil(r.contract_termination_date);
                  const status = r.status || 'Not started';
                  return (
                    <TableRow key={`${r.user_email}-${r.contract_termination_date}`}>
                      <TableCell>
                        <div className="font-medium">{r.user_name}</div>
                        <div className="text-xs text-muted-foreground">{r.user_email}</div>
                      </TableCell>
                      <TableCell>{r.department}</TableCell>
                      <TableCell className="text-xs">{r.manager_email || '-'}</TableCell>
                      <TableCell>{new Date(r.contract_termination_date).toLocaleDateString()}</TableCell>
                      <TableCell className={dl <= 60 ? 'font-semibold text-orange-600' : ''}>
                        {dl < 0 ? `Expired ${-dl}d ago` : `${dl} days`}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(r.status)}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.last_reminder_sent_at ? new Date(r.last_reminder_sent_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {!r.status && (isManager || isAdmin) && (
                            <Button size="sm" variant="outline" onClick={() => initiate(r)}>
                              <PlayCircle className="h-3 w-3 mr-1" /> Initiate
                            </Button>
                          )}
                          {r.status === 'Initiated' && (isManager || isAdmin) && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(r, 'Sent to HR')}>
                              <Send className="h-3 w-3 mr-1" /> Mark Sent to HR
                            </Button>
                          )}
                          {r.status === 'Sent to HR' && isAdmin && (
                            <Button size="sm" variant="default" onClick={() => updateStatus(r, 'Completed')}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Completed
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

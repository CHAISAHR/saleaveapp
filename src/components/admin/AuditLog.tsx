import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { makeApiRequest, apiConfig } from '@/config/apiConfig';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye, Clock, User } from 'lucide-react';

interface AuditEntry {
  id: number;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_by: string;
  changed_at: string;
}

export const AuditLog = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditActivity = async () => {
    try {
      setLoading(true);
      const response = await makeApiRequest(`${apiConfig.endpoints.audit}/recent?limit=100`, {
        method: 'GET'
      });

      const data = await response.json();
      if (data && data.success) {
        setAuditEntries(data.activity || []);
      } else {
        toast.error('Failed to fetch audit activity');
      }
    } catch (error) {
      console.error('Error fetching audit activity:', error);
      toast.error('Failed to fetch audit activity');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTableName = (tableName: string) => {
    return tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };


  useEffect(() => {
    fetchAuditActivity();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading audit activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all system changes and user activities
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Activity ({auditEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit entries</h3>
              <p className="text-muted-foreground">
                No system activity has been recorded yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Record ID</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Changed By</TableHead>
                        <TableHead>Changed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {entry.id}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatTableName(entry.table_name)}</span>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {entry.record_id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(entry.action)}>
                              {entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="text-sm">{entry.changed_by}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(entry.changed_at), 'MMM dd, yyyy HH:mm:ss')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
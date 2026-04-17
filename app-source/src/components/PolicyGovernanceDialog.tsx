import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { usePolicyGovernance } from '@/hooks/usePolicyGovernance';
import { useAuth } from '@/contexts/AuthContext';

interface PolicyGovernanceDialogProps {
  policy: {
    id: string;
    title: string;
    status?: string;
    version?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const stageLabel = (stageName: string) => {
  switch (stageName) {
    case 'super_user_review':
      return 'Super User Review';
    case 'department_manager_approval':
      return 'Department Manager Approval';
    case 'executive_approval':
      return 'Executive Approval';
    default:
      return stageName;
  }
};

export function PolicyGovernanceDialog({
  policy,
  open,
  onOpenChange,
  onUpdated,
}: PolicyGovernanceDialogProps) {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [changeSummary, setChangeSummary] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);

  const { summary, loading, submitForApproval, reviewApproval, archiveCurrentVersion } =
    usePolicyGovernance(policy?.id || null);

  const pendingRequests = useMemo(
    () => summary?.approvals.filter((item) => item.status === 'pending') || [],
    [summary]
  );

  const canReview = (requiredRole: string) => {
    if (!userRole) return false;
    if (userRole === 'system_admin') return true;
    return userRole === requiredRole;
  };

  const handleSubmit = async () => {
    if (!policy) return;
    try {
      await submitForApproval(changeSummary);
      setChangeSummary('');
      toast({
        title: 'Submitted',
        description: 'Policy was submitted into the approval chain.',
      });
      onUpdated?.();
    } catch (error) {
      console.error('Error submitting policy for approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit policy for approval',
        variant: 'destructive',
      });
    }
  };

  const handleArchive = async () => {
    if (!policy) return;
    try {
      await archiveCurrentVersion(changeSummary);
      toast({
        title: 'Archived',
        description: 'Current version was archived successfully.',
      });
      onUpdated?.();
    } catch (error) {
      console.error('Error archiving policy version:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive current version',
        variant: 'destructive',
      });
    }
  };

  const handleReview = async (
    requestId: string,
    decision: 'approved' | 'rejected'
  ) => {
    try {
      setBusyRequestId(requestId);
      await reviewApproval(requestId, decision, reviewComment);
      setReviewComment('');
      toast({
        title: decision === 'approved' ? 'Approved' : 'Rejected',
        description: `Approval stage ${decision} successfully.`,
      });
      onUpdated?.();
    } catch (error) {
      console.error('Error reviewing approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to review approval stage',
        variant: 'destructive',
      });
    } finally {
      setBusyRequestId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Policy Governance
            {policy ? `: ${policy.title}` : ''}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="approval" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="approval">Approval</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="approval" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="change-summary">Change Summary</Label>
                  <Textarea
                    id="change-summary"
                    value={changeSummary}
                    onChange={(event) => setChangeSummary(event.target.value)}
                    placeholder="What changed in this policy?"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmit}>Submit For Approval</Button>
                  <Button variant="outline" onClick={handleArchive}>
                    Archive Current Version
                  </Button>
                  {policy?.status && <Badge variant="secondary">{policy.status}</Badge>}
                  {policy?.version != null && (
                    <Badge variant="outline">Version {policy.version}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval Chain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading workflow...</div>
                ) : summary?.approvals.length ? (
                  <div className="space-y-3">
                    {summary.approvals.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              Step {request.stage_order}: {stageLabel(request.stage_name)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Required role: {request.required_role}
                            </div>
                          </div>
                          <Badge variant={request.status === 'approved' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Requested {format(new Date(request.requested_at), 'PPpp')}
                        </div>
                        {request.comments && (
                          <div className="text-sm">{request.comments}</div>
                        )}
                        {request.status === 'pending' && canReview(request.required_role) && (
                          <div className="space-y-2">
                            <Input
                              value={reviewComment}
                              onChange={(event) => setReviewComment(event.target.value)}
                              placeholder="Approval note or rejection reason"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={busyRequestId === request.id}
                                onClick={() => handleReview(request.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={busyRequestId === request.id}
                                onClick={() => handleReview(request.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No approval workflow exists for this policy yet.
                  </div>
                )}
              </CardContent>
            </Card>

            {!!pendingRequests.length && (
              <div className="text-sm text-muted-foreground">
                Pending stages: {pendingRequests.map((item) => stageLabel(item.stage_name)).join(', ')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="versions">
            <Card>
              <CardHeader>
                <CardTitle>Archived Versions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading versions...</div>
                ) : summary?.versions.length ? (
                  <div className="space-y-3">
                    {summary.versions.map((version) => (
                      <div key={version.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Version {version.version_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(version.archived_at), 'PPpp')}
                          </div>
                        </div>
                        {version.change_summary && (
                          <div className="text-sm text-muted-foreground mt-2">
                            {version.change_summary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No archived versions yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading audit trail...</div>
                ) : summary?.audit_logs.length ? (
                  <ScrollArea className="h-[420px] pr-4">
                    <div className="space-y-3">
                      {summary.audit_logs.map((log) => (
                        <div key={log.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium">
                              {log.action} on {log.table_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(log.created_at), 'PPpp')}
                            </div>
                          </div>
                          {log.record_id && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Record: {log.record_id}
                            </div>
                          )}
                          <div className="grid gap-2 mt-3 md:grid-cols-2">
                            {log.old_values && (
                              <div className="rounded bg-muted p-2 text-xs overflow-auto">
                                <div className="font-medium mb-1">Old</div>
                                <pre>{JSON.stringify(log.old_values, null, 2)}</pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div className="rounded bg-muted p-2 text-xs overflow-auto">
                                <div className="font-medium mb-1">New</div>
                                <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No audit logs recorded for this policy yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

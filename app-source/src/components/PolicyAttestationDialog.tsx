import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { usePolicyAttestations } from '@/hooks/usePolicyAttestations';

interface PolicyAttestationDialogProps {
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

export function PolicyAttestationDialog({
  policy,
  open,
  onOpenChange,
  onUpdated,
}: PolicyAttestationDialogProps) {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { users } = useUserData();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [acknowledgementNotes, setAcknowledgementNotes] = useState('');
  const [busyAttestationId, setBusyAttestationId] = useState<string | null>(null);

  const { summary, loading, requestAttestation, acknowledgeAttestation } =
    usePolicyAttestations(policy?.id || null);

  const canManageAttestations = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const pendingForCurrentUser = useMemo(
    () =>
      summary?.attestations.find(
        (entry) => entry.user_id === user?.id && entry.status === 'pending'
      ) || null,
    [summary, user]
  );

  const assignableUsers = useMemo(
    () =>
      users.filter(
        (entry) => entry.role === 'user' || entry.role === 'admin' || entry.role === 'super_user'
      ),
    [users]
  );

  const handleRequestAttestation = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please choose a user for acknowledgment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await requestAttestation(
        selectedUserId,
        dueAt ? new Date(dueAt).toISOString() : null,
        instructions || null
      );

      toast({
        title: 'Acknowledgment requested',
        description: 'The user has been assigned a policy acknowledgment.',
      });

      setSelectedUserId('');
      setDueAt('');
      setInstructions('');
      onUpdated?.();
    } catch (error) {
      console.error('Error requesting policy attestation:', error);
      toast({
        title: 'Error',
        description: 'Failed to request policy acknowledgment.',
        variant: 'destructive',
      });
    }
  };

  const handleAcknowledge = async (attestationId: string) => {
    try {
      setBusyAttestationId(attestationId);
      await acknowledgeAttestation(attestationId, acknowledgementNotes || null);
      setAcknowledgementNotes('');
      toast({
        title: 'Acknowledged',
        description: 'Policy acknowledgment has been recorded.',
      });
      onUpdated?.();
    } catch (error) {
      console.error('Error acknowledging policy attestation:', error);
      toast({
        title: 'Error',
        description: 'Failed to record acknowledgment.',
        variant: 'destructive',
      });
    } finally {
      setBusyAttestationId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Policy Acknowledgment
            {policy ? `: ${policy.title}` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[1.1fr,1.4fr]">
          <Card>
            <CardHeader>
              <CardTitle>Request Acknowledgment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {policy?.status && <Badge variant="secondary">{policy.status}</Badge>}
                {policy?.version != null && <Badge variant="outline">Version {policy.version}</Badge>}
              </div>

              {canManageAttestations ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="attestation-user">Assign to User</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger id="attestation-user">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers.map((entry) => (
                          <SelectItem key={entry.id} value={entry.id}>
                            {entry.name} - {entry.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attestation-due">Due At</Label>
                    <Input
                      id="attestation-due"
                      type="datetime-local"
                      value={dueAt}
                      onChange={(event) => setDueAt(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attestation-instructions">Instructions</Label>
                    <Textarea
                      id="attestation-instructions"
                      value={instructions}
                      onChange={(event) => setInstructions(event.target.value)}
                      rows={4}
                      placeholder="Tell the staff member what they need to review or confirm."
                    />
                  </div>

                  <Button
                    onClick={handleRequestAttestation}
                    disabled={!policy || policy.status !== 'approved'}
                  >
                    Request Acknowledgment
                  </Button>

                  {policy?.status !== 'approved' && (
                    <div className="text-sm text-muted-foreground">
                      Policy must be approved before staff acknowledgment can be requested.
                    </div>
                  )}
                </>
              ) : pendingForCurrentUser ? (
                <div className="space-y-4">
                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="font-medium">Pending acknowledgment assigned to you</div>
                    <div className="text-sm text-muted-foreground">
                      Requested {format(new Date(pendingForCurrentUser.requested_at), 'PPpp')}
                    </div>
                    {pendingForCurrentUser.due_at && (
                      <div className="text-sm text-muted-foreground">
                        Due {format(new Date(pendingForCurrentUser.due_at), 'PPpp')}
                      </div>
                    )}
                    {pendingForCurrentUser.instructions && (
                      <div className="text-sm">{pendingForCurrentUser.instructions}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ack-notes">Acknowledgment Notes</Label>
                    <Textarea
                      id="ack-notes"
                      value={acknowledgementNotes}
                      onChange={(event) => setAcknowledgementNotes(event.target.value)}
                      rows={4}
                      placeholder="Optional notes confirming the review."
                    />
                  </div>

                  <Button
                    onClick={() => handleAcknowledge(pendingForCurrentUser.id)}
                    disabled={busyAttestationId === pendingForCurrentUser.id}
                  >
                    Acknowledge Policy
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No pending acknowledgments are assigned to your account for this policy.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attestation History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading acknowledgment history...</div>
              ) : summary?.attestations.length ? (
                <ScrollArea className="h-[420px] pr-4">
                  <div className="space-y-3">
                    {summary.attestations.map((entry) => (
                      <div key={entry.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              {entry.user_name || entry.user_email || entry.user_id}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Requested by {entry.requested_by_name || entry.requested_by}
                            </div>
                          </div>
                          <Badge variant={entry.status === 'acknowledged' ? 'default' : 'secondary'}>
                            {entry.status}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Requested {format(new Date(entry.requested_at), 'PPpp')}
                        </div>

                        {entry.due_at && (
                          <div className="text-xs text-muted-foreground">
                            Due {format(new Date(entry.due_at), 'PPpp')}
                          </div>
                        )}

                        {entry.instructions && <div className="text-sm">{entry.instructions}</div>}

                        {entry.acknowledged_at && (
                          <div className="text-xs text-muted-foreground">
                            Acknowledged {format(new Date(entry.acknowledged_at), 'PPpp')}
                          </div>
                        )}

                        {entry.notes && (
                          <div className="rounded bg-muted p-2 text-sm">
                            {entry.notes}
                          </div>
                        )}

                        {entry.user_id === user?.id && entry.status === 'pending' && !canManageAttestations && (
                          <div className="space-y-2 pt-2">
                            <Textarea
                              value={acknowledgementNotes}
                              onChange={(event) => setAcknowledgementNotes(event.target.value)}
                              rows={3}
                              placeholder="Optional acknowledgment notes"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAcknowledge(entry.id)}
                              disabled={busyAttestationId === entry.id}
                            >
                              Acknowledge
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No acknowledgment records exist for this policy yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

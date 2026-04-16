import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useInvestigationNotes, useActionPlans } from "@/hooks/useIncidents";
import { format } from 'date-fns';
import { MessageSquare, Target, Plus, User, Calendar } from 'lucide-react';

interface InvestigateIncidentDialogProps {
  incidentId: number | null;
  open: boolean;
  onClose: () => void;
}

export function InvestigateIncidentDialog({ incidentId, open, onClose }: InvestigateIncidentDialogProps) {
  const [newNote, setNewNote] = useState('');
  const [newPlan, setNewPlan] = useState('');
  
  const { notes, isLoading: notesLoading, addNote } = useInvestigationNotes(incidentId || 0);
  const { plans, isLoading: plansLoading, addPlan, updatePlanStatus } = useActionPlans(incidentId || 0);

  if (!incidentId) return null;

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(newNote);
      setNewNote('');
    }
  };

  const handleAddPlan = () => {
    if (newPlan.trim()) {
      addPlan(newPlan);
      setNewPlan('');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      proposed: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Investigate Incident #{incidentId}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">
              <MessageSquare className="h-4 w-4 mr-2" />
              Investigation Notes
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Target className="h-4 w-4 mr-2" />
              Action Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Investigation Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter investigation findings or observations..."
                  rows={4}
                />
                <Button onClick={handleAddNote} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {notesLoading ? (
                <div className="text-center py-4">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No investigation notes yet
                </div>
              ) : (
                notes.map((note: any) => (
                  <Card key={note.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{note.profiles?.full_name || 'Unknown'}</span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm">{note.note}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Propose Action Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  placeholder="Describe the action plan to address this incident..."
                  rows={4}
                />
                <Button onClick={handleAddPlan} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action Plan
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {plansLoading ? (
                <div className="text-center py-4">Loading action plans...</div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No action plans yet
                </div>
              ) : (
                plans.map((plan: any) => (
                  <Card key={plan.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{plan.profiles?.full_name || 'Unknown'}</span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(plan.created_at), 'MMM dd, yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm mb-3">{plan.plan}</p>
                          </div>
                          {getStatusBadge(plan.status)}
                        </div>
                        
                        {plan.status === 'proposed' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updatePlanStatus({ id: plan.id, status: 'approved' })}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updatePlanStatus({ id: plan.id, status: 'rejected' })}>
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {plan.status === 'approved' && (
                          <Button size="sm" onClick={() => updatePlanStatus({ id: plan.id, status: 'in_progress' })}>
                            Start Implementation
                          </Button>
                        )}
                        
                        {plan.status === 'in_progress' && (
                          <Button size="sm" onClick={() => updatePlanStatus({ id: plan.id, status: 'completed' })}>
                            Mark as Completed
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

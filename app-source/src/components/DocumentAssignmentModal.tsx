import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useTeams } from "@/hooks/useTeams";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, FileText, Calendar, Clock } from 'lucide-react';

interface DocumentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onAssignmentComplete: () => void;
}

export function DocumentAssignmentModal({
  isOpen,
  onClose,
  document,
  onAssignmentComplete
}: DocumentAssignmentModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<string>('medium');
  const [instructions, setInstructions] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { teams } = useTeams();
  const { users } = useUserData();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAssignment = async () => {
    if (!selectedUser || !dueDate) {
      toast({
        title: 'Error',
        description: 'Please select a user and due date',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: `Process Document: ${document.title}`,
          description: instructions || `Process the uploaded document: ${document.title}`,
          assigned_to: selectedUser,
          assigned_by: user?.id,
          team_id: selectedTeam && selectedTeam !== 'no-team' ? parseInt(selectedTeam) : null,
          due_date: dueDate.toISOString(),
          priority,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document assigned successfully'
      });

      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error assigning document:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign document',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assign Document for Processing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="p-4 border border-border rounded-lg bg-muted/50">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Document Details</h4>
            <div className="space-y-2">
              <p className="font-medium">{document?.title}</p>
              <div className="flex gap-2">
                <Badge variant="outline">{document?.category}</Badge>
                <Badge variant="outline">{document?.type}</Badge>
              </div>
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Team (Optional)
            </Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-team">No specific team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name} ({team.member_count} members)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign to User *
            </Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date *
            </Label>
            <DatePicker
              selected={dueDate}
              onSelect={setDueDate}
              placeholder="Select due date"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Priority
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Low Priority
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    High Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>Processing Instructions</Label>
            <Textarea
              placeholder="Provide specific instructions for processing this document..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssignment} disabled={isLoading}>
            {isLoading ? 'Assigning...' : 'Assign Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
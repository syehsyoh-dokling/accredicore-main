import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Clock, AlertCircle, CheckCircle2, Users, User } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserData } from "@/hooks/useUserData";
import { useTeams } from "@/hooks/useTeams";
import { useRealtimeTasks, Task } from "@/hooks/useRealtimeTasks";
import { useToast } from "@/hooks/use-toast";

interface TaskAssignmentPanelProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskAssignmentPanel({ task, isOpen, onClose, onUpdate }: TaskAssignmentPanelProps) {
  const { t, language, dir } = useLanguage();
  const { users, loading: usersLoading } = useUserData();
  const { teams, loading: teamsLoading } = useTeams();
  const { updateTaskStatus } = useRealtimeTasks();
  const { toast } = useToast();
  
  const [selectedUser, setSelectedUser] = useState(task.assigned_to || '');
  const [selectedTeam, setSelectedTeam] = useState(task.team_id?.toString() || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Here you would typically call an API to update the task assignment
      // For now, we'll use the existing updateTaskStatus function as a placeholder
      const result = await updateTaskStatus(task.id, task.status);
      
      if (result.success) {
        toast({
          title: t('success'),
          description: t('taskAssignmentUpdated'),
        });
        onUpdate();
        onClose();
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToUpdateTask'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const assignedUser = users.find(user => user.id === task.assigned_to);
  const assignedTeam = teams.find(team => team.id === task.team_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${language === 'ar' ? 'text-right flex-row-reverse' : ''}`}>
            <UserCheck className="h-5 w-5" />
            {t('taskAssignment')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Overview */}
          <Card>
            <CardHeader>
              <CardTitle className={`text-lg ${language === 'ar' ? 'text-right' : ''}`}>
                {t('taskDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className={`font-medium mb-2 ${language === 'ar' ? 'text-right' : ''}`}>{task.title}</h3>
                {task.description && (
                  <p className={`text-sm text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
                    {task.description}
                  </p>
                )}
              </div>
              
              <div className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  {getStatusIcon(task.status)}
                  <span className="text-sm font-medium">{t(task.status)}</span>
                </div>
                
                <Badge className={`${getPriorityColor(task.priority)} border`}>
                  {t(task.priority)} {t('priority')}
                </Badge>
                
                {task.due_date && (
                  <span className="text-sm text-muted-foreground">
                    {t('due')}: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className={`text-lg ${language === 'ar' ? 'text-right' : ''}`}>
                {t('currentAssignment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${language === 'ar' ? 'text-right' : ''}`}>
                <div>
                  <Label className="text-sm font-medium">{t('assignedTo')}</Label>
                  <div className={`flex items-center gap-2 mt-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {assignedUser ? `${assignedUser.nameEn} (${assignedUser.email})` : t('unassigned')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">{t('assignedTeam')}</Label>
                  <div className={`flex items-center gap-2 mt-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {assignedTeam ? assignedTeam.name : t('noTeam')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle className={`text-lg ${language === 'ar' ? 'text-right' : ''}`}>
                {t('updateAssignment')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignee" className={language === 'ar' ? 'text-right' : ''}>
                    {t('assignTo')}
                  </Label>
                  <Select value={selectedUser || 'unassigned'} onValueChange={(value) => setSelectedUser(value === 'unassigned' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectUser')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                      {!usersLoading && users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <User className="h-4 w-4" />
                            {user.nameEn} ({user.email})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team" className={language === 'ar' ? 'text-right' : ''}>
                    {t('assignToTeam')}
                  </Label>
                  <Select value={selectedTeam || 'none'} onValueChange={(value) => setSelectedTeam(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectTeam')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('noTeam')}</SelectItem>
                      {!teamsLoading && teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <Users className="h-4 w-4" />
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className={language === 'ar' ? 'text-right' : ''}>
                  {t('assignmentNotes')}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('addAssignmentNotes')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? t('saving') : t('saveAssignment')}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
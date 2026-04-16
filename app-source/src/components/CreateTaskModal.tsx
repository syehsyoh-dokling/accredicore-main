import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon, Users } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserData } from "@/hooks/useUserData";
import { useTeams } from "@/hooks/useTeams";

interface CreateTaskModalProps {
  onTaskCreate: (taskData: {
    title: string;
    description?: string;
    assigned_to?: string;
    team_id?: number;
    due_date?: string;
    priority: 'low' | 'medium' | 'high';
  }) => Promise<any>;
}

export function CreateTaskModal({ onTaskCreate }: CreateTaskModalProps) {
  const { t, language, dir } = useLanguage();
  const { users, loading: usersLoading } = useUserData();
  const { teams, loading: teamsLoading } = useTeams();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    team_id: null as number | null,
    due_date: null as Date | null,
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        assigned_to: formData.assigned_to || undefined,
        team_id: formData.team_id || undefined,
        due_date: formData.due_date ? formData.due_date.toISOString().split('T')[0] : undefined,
        priority: formData.priority
      };

      const result = await onTaskCreate(taskData);
      
      if (result.success) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          assigned_to: '',
          team_id: null,
          due_date: null,
          priority: 'medium'
        });
        setOpen(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={`gap-2 bg-blue-600 hover:bg-blue-700 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Plus className="h-4 w-4" />
          {t('createTask')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            {t('createNewTask')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className={language === 'ar' ? 'text-right' : 'text-left'}>
              {t('taskTitle')} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder={t('enterTaskTitle')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={language === 'ar' ? 'text-right' : 'text-left'}>
              {t('taskDescription')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={t('enterTaskDescription')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('assignedTo')}
              </Label>
              <Select
                value={formData.assigned_to || 'unassigned'}
                onValueChange={(value) => setFormData({...formData, assigned_to: value === 'unassigned' ? '' : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectUser')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                  {!usersLoading && users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nameEn} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_id" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('assignedTeam')}
              </Label>
              <Select
                value={formData.team_id?.toString() || 'none'}
                onValueChange={(value) => setFormData({...formData, team_id: value === 'none' ? null : parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTeam')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noTeam')}</SelectItem>
                  {!teamsLoading && teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('dueDate')}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, "PPP") : <span>{t('pickDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => setFormData({...formData, due_date: date})}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('taskPriority')}
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('low')}</SelectItem>
                  <SelectItem value="medium">{t('medium')}</SelectItem>
                  <SelectItem value="high">{t('high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? t('creating') : t('createTask')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
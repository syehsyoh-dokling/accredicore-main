import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon, Clock } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleAuditModalProps {
  onAuditCreated?: () => void;
}

export function ScheduleAuditModal({ onAuditCreated }: ScheduleAuditModalProps) {
  const { t, language, dir } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const canManageAudits = ['system_admin', 'super_user', 'admin'].includes(userRole || '');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audit_type: 'internal',
    department: '',
    scheduled_date: null as Date | null,
    scheduled_time: '',
    duration_days: 1,
    priority: 'medium',
    auditor_name: '',
    auditor_company: ''
  });

  const departments = [
    'Quality Management',
    'Infection Control Unit',
    'Pharmacy',
    'Security & Safety',
    'Nursing',
    'Medical Staff',
    'Laboratory',
    'Radiology',
    'Emergency',
    'Surgery'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAudits) {
      toast({
        title: "Access denied",
        description: "Only elevated roles can schedule audits.",
        variant: "destructive"
      });
      return;
    }

    if (!user || !formData.title || !formData.department || !formData.scheduled_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('audit_schedules')
        .insert({
          title: formData.title,
          description: formData.description,
          audit_type: formData.audit_type,
          department: formData.department,
          scheduled_date: formData.scheduled_date.toISOString().split('T')[0],
          scheduled_time: formData.scheduled_time || null,
          duration_days: formData.duration_days,
          priority: formData.priority,
          auditor_name: formData.auditor_name || null,
          auditor_company: formData.auditor_company || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Audit scheduled successfully!",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        audit_type: 'internal',
        department: '',
        scheduled_date: null,
        scheduled_time: '',
        duration_days: 1,
        priority: 'medium',
        auditor_name: '',
        auditor_company: ''
      });

      setOpen(false);
      onAuditCreated?.();
    } catch (error) {
      console.error('Error scheduling audit:', error);
      toast({
        title: "Error",
        description: "Failed to schedule audit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`gap-2 bg-blue-600 hover:bg-blue-700 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
          disabled={!canManageAudits}
        >
          <Plus className="h-4 w-4" />
          {t('scheduleNewAudit')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            {t('scheduleNewAudit')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('auditTitle')} *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={t('enterAuditTitle')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="audit_type" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('auditType')} *
              </Label>
              <Select
                value={formData.audit_type}
                onValueChange={(value) => setFormData({...formData, audit_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{t('internal')}</SelectItem>
                  <SelectItem value="external">{t('external')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={language === 'ar' ? 'text-right' : 'text-left'}>
              {t('description')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={t('enterDescription')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('department')} *
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({...formData, department: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectDepartment')} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('priority')}
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('scheduledDate')} *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_date ? format(formData.scheduled_date, "PPP") : <span>{t('pickDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_date}
                    onSelect={(date) => setFormData({...formData, scheduled_date: date})}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('scheduledTime')}
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_days" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('durationDays')}
              </Label>
              <Input
                id="duration_days"
                type="number"
                min="1"
                max="30"
                value={formData.duration_days}
                onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auditor_name" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('auditorName')}
              </Label>
              <Input
                id="auditor_name"
                value={formData.auditor_name}
                onChange={(e) => setFormData({...formData, auditor_name: e.target.value})}
                placeholder={t('enterAuditorName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auditor_company" className={language === 'ar' ? 'text-right' : 'text-left'}>
                {t('auditorCompany')}
              </Label>
              <Input
                id="auditor_company"
                value={formData.auditor_company}
                onChange={(e) => setFormData({...formData, auditor_company: e.target.value})}
                placeholder={t('enterAuditorCompany')}
              />
            </div>
          </div>

          <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? t('scheduling') : t('scheduleAudit')}
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

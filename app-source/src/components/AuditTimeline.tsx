
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { ScheduleAuditModal } from "./ScheduleAuditModal";
import { useAuditSchedules } from "@/hooks/useAuditSchedules";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export function AuditTimeline() {
  const { t, language, dir } = useLanguage();
  const { userRole } = useAuth();
  const { audits, loading, fetchAudits, getAuditStats } = useAuditSchedules();
  const stats = getAuditStats();
  const canManageAudits = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const getStatusBadge = (status: string) => {
    const variants = {
      [t('scheduled')]: 'bg-blue-100 text-blue-800',
      [t('inProgress')]: 'bg-yellow-100 text-yellow-800',
      [t('completed')]: 'bg-green-100 text-green-800',
      [t('overdue')]: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} text-xs`}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      [t('high')]: 'bg-red-100 text-red-800',
      [t('medium')]: 'bg-yellow-100 text-yellow-800',
      [t('low')]: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={`${variants[priority as keyof typeof variants]} text-xs`}>
        {priority}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case t('completed'):
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case t('inProgress'):
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case t('overdue'):
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-blue-500" />;
    }
  };

  const weekDays = [
    t('sunday'), t('monday'), t('tuesday'), t('wednesday'), 
    t('thursday'), t('friday'), t('saturday')
  ];

  return (
    <div className="space-y-6" dir={dir}>
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className="text-3xl font-bold text-gray-900">{t('auditTimelineTitle')}</h2>
          <p className="text-gray-600 mt-1">{t('auditTimelineDesc')}</p>
        </div>
        {canManageAudits && <ScheduleAuditModal onAuditCreated={fetchAudits} />}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{stats.scheduled}</div>
            <div className="text-sm text-blue-600">{t('scheduledAudits')}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-900">{stats.inProgress}</div>
            <div className="text-sm text-yellow-600">{t('inProgress')}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
            <div className="text-sm text-green-600">{t('completedThisMonth')}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
            <div className="text-sm text-red-600">{t('overdue')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Calendar className="h-5 w-5 text-blue-600" />
            {t('auditSchedule')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audits.map((audit, index) => (
              <div key={audit.id} className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0">
                  {getStatusIcon(audit.status)}
                </div>
                
                <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-3 mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <h3 className="font-medium text-gray-900">{audit.title}</h3>
                    {getStatusBadge(audit.status)}
                    {getPriorityBadge(audit.priority)}
                  </div>
                  
                   <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                     <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                       <Calendar className="h-4 w-4" />
                       <span>{format(new Date(audit.scheduled_date), 'MMM dd, yyyy')}</span>
                     </div>
                     <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                       <Users className="h-4 w-4" />
                       <span>{audit.department}</span>
                     </div>
                     <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                       <Clock className="h-4 w-4" />
                       <span>{audit.duration_days} {audit.duration_days === 1 ? t('day') : t('days')}</span>
                     </div>
                   </div>
                   
                   {audit.auditor_name && (
                     <div className={`mt-2 text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                       <span className="font-medium">{t('auditor')}: </span>
                       {audit.auditor_name} {audit.auditor_company && `(${audit.auditor_company})`}
                     </div>
                   )}
                   
                   <div className="mt-2">
                     <Badge variant="outline" className="text-xs">
                       {audit.audit_type}
                     </Badge>
                   </div>
                </div>
                
                <div className={`flex-shrink-0 flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Button size="sm" variant="outline">
                    {t('viewDetails')}
                  </Button>
                  {canManageAudits && (
                    <Button size="sm" variant="outline">
                      {t('edit')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            {t('auditCalendarJune2024')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {/* Calendar Header */}
            {weekDays.map((day) => (
              <div key={day} className="p-2 font-medium text-gray-600 text-sm">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
              const hasAudit = [15, 25, 28].includes(day);
              return (
                <div
                  key={day}
                  className={`
                    p-2 text-sm border rounded cursor-pointer hover:bg-blue-50
                    ${hasAudit ? 'bg-blue-100 border-blue-300 text-blue-900' : 'bg-white border-gray-200'}
                  `}
                >
                  {day}
                  {hasAudit && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

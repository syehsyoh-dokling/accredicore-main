
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/UserManagement';
import { TeamManagement } from '@/components/TeamManagement';
import { PolicyTemplates } from '@/components/PolicyTemplates';
import { TaskManagement } from '@/components/TaskManagement';
import { AdminUserManagement } from '@/components/AdminUserManagement';
import { AdminControlsManagement } from '@/components/AdminControlsManagement';
import { Shield, Users, FileText, Settings, Database, Activity, CheckSquare, ShieldCheck } from 'lucide-react';
import { useSystemStats } from '@/hooks/useSystemStats';

export const SuperUserConsole = () => {
  const { userRole } = useAuth();
  const { language } = useLanguage();
  const { stats, loading } = useSystemStats();

  const isSuperUser = ['system_admin', 'super_user'].includes(userRole || '');
  const isAdmin = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  if (!isSuperUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {language === 'ar' ? 'غير مصرح لك بالوصول' : 'Access Denied'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'يجب أن تكون مشرف أو مدير نظام للوصول لهذه الصفحة' : 'You must be a super user or system admin to access this console'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {language === 'ar' ? 'وحدة تحكم المشرف' : 'Super User Console'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'إدارة النظام والمستخدمين والسياسات' : 'Manage system, users, and policies'}
        </p>
      </div>

      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي السياسات' : 'Total Policies'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalPolicies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'الفرق النشطة' : 'Active Teams'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'حالة النظام' : 'System Status'}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="bg-green-500">
              {language === 'ar' ? 'صحي' : 'Healthy'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'المستخدمين' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="admin-users">
            <ShieldCheck className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'إدارة المستخدمين' : 'Admin Users'}
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Users className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'الفرق' : 'Teams'}
          </TabsTrigger>
          <TabsTrigger value="controls">
            <Shield className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'المعايير' : 'Controls'}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="tasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'المهام' : 'Tasks'}
            </TabsTrigger>
          )}
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'قوالب السياسات' : 'Policy Templates'}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="admin-users" className="space-y-4">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <AdminControlsManagement />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="tasks" className="space-y-4">
            <TaskManagement />
          </TabsContent>
        )}

        <TabsContent value="templates" className="space-y-4">
          <PolicyTemplates />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إعدادات النظام' : 'System Settings'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إدارة إعدادات النظام العامة' : 'Manage general system settings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'قريباً - إعدادات النظام قيد التطوير' : 'Coming soon - System settings under development'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

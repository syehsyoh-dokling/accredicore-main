import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Heart, 
  Shield, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Stethoscope,
  Building2,
  UserCheck,
  Clipboard,
  Settings
} from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { TaskAssignmentPanel } from './TaskAssignmentPanel';
import { useRealtimeTasks, Task } from "@/hooks/useRealtimeTasks";

export function ProvisionOfCare() {
  const { t, language, dir } = useLanguage();
  const { tasks, loading } = useRealtimeTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAssignmentPanelOpen, setIsAssignmentPanelOpen] = useState(false);

  // Filter tasks related to provision of care and dental laboratory
  const careProvisionTasks = tasks.filter(task => 
    task.title.toLowerCase().includes('care') || 
    task.title.toLowerCase().includes('dental') ||
    task.title.toLowerCase().includes('patient') ||
    task.title.toLowerCase().includes('laboratory')
  );

  const dentalLabTasks = tasks.filter(task => 
    task.title.toLowerCase().includes('dental') || 
    task.title.toLowerCase().includes('laboratory') ||
    task.title.toLowerCase().includes('lab')
  );

  const handleTaskAssignment = (task: Task) => {
    setSelectedTask(task);
    setIsAssignmentPanelOpen(true);
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const careProvisionPolicies = [
    {
      id: 1,
      title: language === 'ar' ? 'سياسة رعاية المرضى' : 'Patient Care Policy',
      description: language === 'ar' ? 'المعايير والإجراءات لرعاية المرضى' : 'Standards and procedures for patient care',
      status: 'active',
      compliance: 85,
      tasks: careProvisionTasks.slice(0, 3),
      icon: <Heart className="h-5 w-5 text-red-500" />
    },
    {
      id: 2,
      title: language === 'ar' ? 'سياسة السلامة السريرية' : 'Clinical Safety Policy',
      description: language === 'ar' ? 'بروتوكولات السلامة في البيئة السريرية' : 'Safety protocols in clinical environment',
      status: 'active',
      compliance: 92,
      tasks: careProvisionTasks.slice(1, 4),
      icon: <Shield className="h-5 w-5 text-green-500" />
    },
    {
      id: 3,
      title: language === 'ar' ? 'سياسة إدارة الجودة' : 'Quality Management Policy',
      description: language === 'ar' ? 'ضمان جودة الخدمات المقدمة' : 'Ensuring quality of services provided',
      status: 'active',
      compliance: 78,
      tasks: careProvisionTasks.slice(2, 5),
      icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />
    }
  ];

  const dentalLabPolicies = [
    {
      id: 4,
      title: language === 'ar' ? 'سياسة المختبر السني' : 'Dental Laboratory Policy',
      description: language === 'ar' ? 'معايير وإجراءات المختبر السني' : 'Dental laboratory standards and procedures',
      status: 'active',
      compliance: 88,
      tasks: dentalLabTasks.slice(0, 3),
      icon: <Building2 className="h-5 w-5 text-purple-500" />
    },
    {
      id: 5,
      title: language === 'ar' ? 'سياسة مراقبة العدوى' : 'Infection Control Policy',
      description: language === 'ar' ? 'منع انتشار العدوى في المختبر' : 'Preventing infection spread in laboratory',
      status: 'active',
      compliance: 95,
      tasks: dentalLabTasks.slice(1, 4),
      icon: <Shield className="h-5 w-5 text-orange-500" />
    },
    {
      id: 6,
      title: language === 'ar' ? 'سياسة معايرة الأجهزة' : 'Equipment Calibration Policy',
      description: language === 'ar' ? 'معايرة وصيانة أجهزة المختبر' : 'Calibration and maintenance of lab equipment',
      status: 'active',
      compliance: 82,
      tasks: dentalLabTasks.slice(0, 2),
      icon: <Settings className="h-5 w-5 text-indigo-500" />
    }
  ];

  const PolicyCard = ({ policy }: { policy: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            {policy.icon}
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <CardTitle className="text-lg">{policy.title}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {policy.description}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800">{policy.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className={`flex items-center justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm font-medium">{t('compliance')}</span>
            <span className="text-sm text-muted-foreground">{policy.compliance}%</span>
          </div>
          <Progress value={policy.compliance} className="h-2" />
        </div>
        
        <div>
          <h4 className={`text-sm font-medium mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {t('relatedTasks')} ({policy.tasks.length})
          </h4>
          <div className="space-y-2">
            {policy.tasks.map((task: Task) => (
              <div 
                key={task.id}
                className={`flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors ${
                  language === 'ar' ? 'flex-row-reverse' : ''
                }`}
                onClick={() => handleTaskAssignment(task)}
              >
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{task.title}</span>
                </div>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                    {t(task.status)}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskAssignment(task);
                    }}
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">{t('loading')}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'ar' ? 'توفير الرعاية والمختبر السني' : 'Provision of Care and Dental Laboratory'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'ar' 
              ? 'إدارة سياسات الرعاية الصحية والمختبر السني مع تعيين المهام' 
              : 'Manage healthcare provision and dental laboratory policies with task assignments'
            }
          </p>
        </div>
        <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Stethoscope className="h-8 w-8 text-blue-600" />
          <Building2 className="h-8 w-8 text-purple-600" />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Heart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">{careProvisionPolicies.length}</div>
            <div className="text-sm text-blue-600">
              {language === 'ar' ? 'سياسات الرعاية' : 'Care Policies'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Building2 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">{dentalLabPolicies.length}</div>
            <div className="text-sm text-purple-600">
              {language === 'ar' ? 'سياسات المختبر' : 'Lab Policies'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">{careProvisionTasks.length}</div>
            <div className="text-sm text-green-600">
              {language === 'ar' ? 'مهام الرعاية' : 'Care Tasks'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">{dentalLabTasks.length}</div>
            <div className="text-sm text-orange-600">
              {language === 'ar' ? 'مهام المختبر' : 'Lab Tasks'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Tabs */}
      <Tabs defaultValue="care-provision" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="care-provision" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Heart className="h-4 w-4" />
            {language === 'ar' ? 'توفير الرعاية' : 'Provision of Care'}
          </TabsTrigger>
          <TabsTrigger value="dental-lab" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Building2 className="h-4 w-4" />
            {language === 'ar' ? 'المختبر السني' : 'Dental Laboratory'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="care-provision" className="space-y-4">
          <div className="grid gap-6">
            {careProvisionPolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="dental-lab" className="space-y-4">
          <div className="grid gap-6">
            {dentalLabPolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Task Assignment Panel */}
      {selectedTask && (
        <TaskAssignmentPanel
          task={selectedTask}
          isOpen={isAssignmentPanelOpen}
          onClose={() => {
            setIsAssignmentPanelOpen(false);
            setSelectedTask(null);
          }}
          onUpdate={() => {
            // Refresh tasks if needed
          }}
        />
      )}
    </div>
  );
}
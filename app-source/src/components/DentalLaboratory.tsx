import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Building2,
  Shield,
  Settings,
  Microscope,
  FlaskConical,
  Thermometer,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  UserCheck,
  Clipboard,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { TaskAssignmentPanel } from './TaskAssignmentPanel';
import { useRealtimeTasks, Task } from "@/hooks/useRealtimeTasks";

export function DentalLaboratory() {
  const { t, language, dir } = useLanguage();
  const { tasks, loading } = useRealtimeTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAssignmentPanelOpen, setIsAssignmentPanelOpen] = useState(false);

  // Filter tasks related to dental laboratory
  const dentalLabTasks = tasks.filter(task => 
    task.title.toLowerCase().includes('dental') || 
    task.title.toLowerCase().includes('laboratory') ||
    task.title.toLowerCase().includes('lab') ||
    task.title.toLowerCase().includes('equipment') ||
    task.title.toLowerCase().includes('calibration') ||
    task.title.toLowerCase().includes('quality') ||
    task.title.toLowerCase().includes('sterilization')
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

  const dentalLabPolicies = [
    {
      id: 1,
      title: language === 'ar' ? 'سياسة جودة المختبر السني' : 'Dental Laboratory Quality Policy',
      description: language === 'ar' ? 'ضمان جودة الأعمال والمنتجات في المختبر السني' : 'Ensuring quality of dental laboratory work and products',
      status: 'active',
      compliance: 88,
      tasks: dentalLabTasks.slice(0, 4),
      icon: <Building2 className="h-5 w-5 text-purple-500" />,
      category: 'quality'
    },
    {
      id: 2,
      title: language === 'ar' ? 'سياسة مراقبة العدوى في المختبر' : 'Laboratory Infection Control Policy',
      description: language === 'ar' ? 'منع انتشار العدوى وضمان السلامة الصحية' : 'Preventing infection spread and ensuring health safety',
      status: 'active',
      compliance: 95,
      tasks: dentalLabTasks.slice(1, 5),
      icon: <Shield className="h-5 w-5 text-green-500" />,
      category: 'safety'
    },
    {
      id: 3,
      title: language === 'ar' ? 'سياسة معايرة الأجهزة' : 'Equipment Calibration Policy',
      description: language === 'ar' ? 'ضمان دقة وموثوقية أجهزة المختبر' : 'Ensuring accuracy and reliability of laboratory equipment',
      status: 'active',
      compliance: 82,
      tasks: dentalLabTasks.slice(0, 3),
      icon: <Settings className="h-5 w-5 text-indigo-500" />,
      category: 'technical'
    },
    {
      id: 4,
      title: language === 'ar' ? 'سياسة التعقيم والتطهير' : 'Sterilization and Disinfection Policy',
      description: language === 'ar' ? 'إجراءات التعقيم والتطهير في المختبر' : 'Laboratory sterilization and disinfection procedures',
      status: 'active',
      compliance: 92,
      tasks: dentalLabTasks.slice(2, 6),
      icon: <Microscope className="h-5 w-5 text-orange-500" />,
      category: 'safety'
    },
    {
      id: 5,
      title: language === 'ar' ? 'سياسة إدارة المواد الكيميائية' : 'Chemical Materials Management Policy',
      description: language === 'ar' ? 'التعامل الآمن مع المواد الكيميائية' : 'Safe handling of chemical materials',
      status: 'active',
      compliance: 79,
      tasks: dentalLabTasks.slice(1, 4),
      icon: <FlaskConical className="h-5 w-5 text-red-500" />,
      category: 'safety'
    },
    {
      id: 6,
      title: language === 'ar' ? 'سياسة مراقبة درجة الحرارة' : 'Temperature Monitoring Policy',
      description: language === 'ar' ? 'مراقبة والتحكم في درجات الحرارة' : 'Temperature monitoring and control procedures',
      status: 'active',
      compliance: 86,
      tasks: dentalLabTasks.slice(0, 2),
      icon: <Thermometer className="h-5 w-5 text-blue-500" />,
      category: 'technical'
    }
  ];

  const labStats = {
    totalPolicies: dentalLabPolicies.length,
    activeTasks: dentalLabTasks.filter(t => t.status !== 'completed').length,
    completedTasks: dentalLabTasks.filter(t => t.status === 'completed').length,
    avgCompliance: Math.round(dentalLabPolicies.reduce((sum, p) => sum + p.compliance, 0) / dentalLabPolicies.length)
  };

  const PolicyCard = ({ policy }: { policy: any }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader>
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            {policy.icon}
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <CardTitle className="text-lg font-semibold">{policy.title}</CardTitle>
              <CardDescription className="text-sm mt-1 text-muted-foreground">
                {policy.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {policy.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {policy.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className={`flex items-center justify-between mb-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm font-medium text-muted-foreground">{t('compliance')}</span>
            <span className="text-lg font-bold text-primary">{policy.compliance}%</span>
          </div>
          <Progress value={policy.compliance} className="h-3" />
        </div>
        
        <div>
          <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <Clipboard className="h-4 w-4" />
            {t('relatedTasks')} ({policy.tasks.length})
          </h4>
          <div className="space-y-3">
            {policy.tasks.map((task: Task) => (
              <div 
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 cursor-pointer transition-all duration-200 border ${
                  language === 'ar' ? 'flex-row-reverse' : ''
                }`}
                onClick={() => handleTaskAssignment(task)}
              >
                <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <span className="text-sm font-medium">{task.title}</span>
                    {task.due_date && (
                      <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                    {t(task.status)}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskAssignment(task);
                    }}
                  >
                    <UserCheck className="h-3 w-3" />
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
        <div className="text-lg text-muted-foreground">{t('loading')}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={dir}>
      {/* Header */}
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'ar' ? 'إدارة المختبر السني' : 'Dental Laboratory Management'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' 
              ? 'إدارة شاملة لسياسات المختبر السني مع تعيين المهام وتتبع التقدم' 
              : 'Comprehensive dental laboratory policy management with task assignment and progress tracking'
            }
          </p>
        </div>
        <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className="p-3 rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="p-3 rounded-full bg-secondary/10">
            <Microscope className="h-8 w-8 text-secondary" />
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">{labStats.totalPolicies}</div>
            <div className="text-sm text-blue-700">
              {language === 'ar' ? 'إجمالي السياسات' : 'Total Policies'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-900">{labStats.activeTasks}</div>
            <div className="text-sm text-orange-700">
              {language === 'ar' ? 'المهام النشطة' : 'Active Tasks'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">{labStats.completedTasks}</div>
            <div className="text-sm text-green-700">
              {language === 'ar' ? 'المهام المكتملة' : 'Completed Tasks'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900">{labStats.avgCompliance}%</div>
            <div className="text-sm text-purple-700">
              {language === 'ar' ? 'متوسط الامتثال' : 'Avg. Compliance'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Categories Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <BarChart3 className="h-4 w-4" />
            {language === 'ar' ? 'الكل' : 'All'}
          </TabsTrigger>
          <TabsTrigger value="quality" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <CheckCircle2 className="h-4 w-4" />
            {language === 'ar' ? 'الجودة' : 'Quality'}
          </TabsTrigger>
          <TabsTrigger value="safety" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Shield className="h-4 w-4" />
            {language === 'ar' ? 'السلامة' : 'Safety'}
          </TabsTrigger>
          <TabsTrigger value="technical" className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Settings className="h-4 w-4" />
            {language === 'ar' ? 'التقني' : 'Technical'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6 mt-6">
          <div className="grid gap-6">
            {dentalLabPolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="quality" className="space-y-6 mt-6">
          <div className="grid gap-6">
            {dentalLabPolicies.filter(p => p.category === 'quality').map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="safety" className="space-y-6 mt-6">
          <div className="grid gap-6">
            {dentalLabPolicies.filter(p => p.category === 'safety').map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="technical" className="space-y-6 mt-6">
          <div className="grid gap-6">
            {dentalLabPolicies.filter(p => p.category === 'technical').map((policy) => (
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
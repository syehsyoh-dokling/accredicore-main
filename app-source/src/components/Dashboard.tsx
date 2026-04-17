
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { t, language, dir } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const stats = [
    {
      title: language === 'ar' ? 'إجمالي السياسات' : 'Total Policies',
      value: '147',
      change: '+12%',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: language === 'ar' ? 'المراجعات النشطة' : 'Active Audits',
      value: '23',
      change: '+8%',
      icon: Shield,
      color: 'text-green-600'
    },
    {
      title: language === 'ar' ? 'المخاطر المحددة' : 'Identified Risks',
      value: '8',
      change: '-15%',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      title: language === 'ar' ? 'معدل الامتثال' : 'Compliance Rate',
      value: '94.2%',
      change: '+3.1%',
      icon: CheckCircle,
      color: 'text-emerald-600'
    }
  ];

  const recentActivities = [
    {
      title: language === 'ar' ? 'تحديث سياسة مكافحة العدوى' : 'Infection Control Policy Updated',
      time: language === 'ar' ? 'منذ ساعتين' : '2 hours ago',
      type: 'policy',
      user: 'Dr. Ahmed Hassan'
    },
    {
      title: language === 'ar' ? 'مراجعة جديدة للسلامة' : 'New Safety Audit Scheduled',
      time: language === 'ar' ? 'منذ 4 ساعات' : '4 hours ago',
      type: 'audit',
      user: 'Fatima Al-Zahra'
    },
    {
      title: language === 'ar' ? 'تقرير المخاطر الشهري' : 'Monthly Risk Report Generated',
      time: language === 'ar' ? 'منذ 6 ساعات' : '6 hours ago',
      type: 'report',
      user: 'System'
    }
  ];

  const upcomingTasks = [
    {
      title: language === 'ar' ? 'مراجعة سياسة الجودة' : 'Quality Policy Review',
      dueDate: language === 'ar' ? 'خلال 3 أيام' : 'Due in 3 days',
      priority: 'high',
      assignee: 'Dr. Sarah Ahmed'
    },
    {
      title: language === 'ar' ? 'تحديث إجراءات الطوارئ' : 'Emergency Procedures Update',
      dueDate: language === 'ar' ? 'خلال أسبوع' : 'Due in 1 week',
      priority: 'medium',
      assignee: 'Mohammad Ali'
    },
    {
      title: language === 'ar' ? 'تدريب فريق السلامة' : 'Safety Team Training',
      dueDate: language === 'ar' ? 'خلال أسبوعين' : 'Due in 2 weeks',
      priority: 'low',
      assignee: 'Aisha Ibrahim'
    }
  ];

  const handleExportReport = () => {
    const lines = [
      'Arab Compliance Hub Dashboard Report',
      '===================================',
      `Generated At: ${new Date().toLocaleString()}`,
      `User: ${user?.email || 'Unknown'}`,
      `Role: ${userRole || 'Unknown'}`,
      '',
      'Statistics',
      ...stats.map((stat) => `${stat.title}: ${stat.value} (${stat.change})`),
      '',
      'Recent Activities',
      ...recentActivities.map((activity) => `${activity.title} | ${activity.user} | ${activity.time}`),
      '',
      'Upcoming Tasks',
      ...upcomingTasks.map((task) => `${task.title} | ${task.assignee} | ${task.dueDate} | ${task.priority}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `dashboard-report-${Date.now()}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);

    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Report exported',
      description: language === 'ar' ? 'تم تنزيل تقرير لوحة المتابعة' : 'Dashboard report downloaded successfully',
    });
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'ar' ? 'لوحة المراقبة' : 'Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'ar' ? 'نظرة عامة على أداء الامتثال والجودة' : 'Overview of compliance and quality performance'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {language === 'ar' ? 'مرحباً' : 'Welcome'}, {user?.email}
            </Badge>
            <Badge variant="outline">
              {language === 'ar' ? 'الدور' : 'Role'}: {userRole}
            </Badge>
          </div>
        </div>
        <Button
          className={`gap-2 bg-blue-600 hover:bg-blue-700 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
          onClick={handleExportReport}
        >
          <TrendingUp className="h-4 w-4" />
          {language === 'ar' ? 'تصدير التقرير' : 'Export Report'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Clock className="h-5 w-5 text-blue-600" />
              {language === 'ar' ? 'الأنشطة الأخيرة' : 'Recent Activities'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className={`flex items-center gap-4 p-3 bg-gray-50 rounded-lg ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">
                      {language === 'ar' ? 'بواسطة' : 'by'} {activity.user} • {activity.time}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Calendar className="h-5 w-5 text-orange-600" />
              {language === 'ar' ? 'المهام القادمة' : 'Upcoming Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task, index) => (
                <div key={index} className={`p-3 border rounded-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                    <Badge 
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{task.dueDate}</p>
                  <p className="text-xs text-gray-500">
                    {language === 'ar' ? 'مسند إلى' : 'Assigned to'}: {task.assignee}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <CardTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'تقدم الامتثال حسب الوحدة' : 'Compliance Progress by Department'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { dept: language === 'ar' ? 'إدارة الجودة' : 'Quality Management', progress: 95 },
              { dept: language === 'ar' ? 'مكافحة العدوى' : 'Infection Control', progress: 88 },
              { dept: language === 'ar' ? 'السلامة المهنية' : 'Occupational Safety', progress: 92 },
              { dept: language === 'ar' ? 'تقنية المعلومات' : 'Information Technology', progress: 97 }
            ].map((item, index) => (
              <div key={index} className={`flex items-center gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className={`flex justify-between items-center mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium text-gray-900">{item.dept}</span>
                    <span className="text-sm text-gray-600">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

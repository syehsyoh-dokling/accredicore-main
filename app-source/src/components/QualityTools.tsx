
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { IncidentReporting } from "@/components/IncidentReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRootCauseAnalyses } from "@/hooks/useRootCauseAnalyses";
import { useImprovementPlans } from "@/hooks/useImprovementPlans";
import { CreateRootCauseDialog } from "@/components/CreateRootCauseDialog";
import { CreateImprovementPlanDialog } from "@/components/CreateImprovementPlanDialog";
import { 
  ClipboardCheck, 
  TrendingUp, 
  Target,
  FileText,
  Plus,
  Edit,
  Download
} from 'lucide-react';

export function QualityTools() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('incident-reporting');
  const [showRCADialog, setShowRCADialog] = useState(false);
  const [showImprovementDialog, setShowImprovementDialog] = useState(false);

  const { analyses, isLoading: isLoadingAnalyses } = useRootCauseAnalyses();
  const { plans, isLoading: isLoadingPlans } = useImprovementPlans();

  // Quality Metrics State
  const metrics = [
    { name: language === 'ar' ? 'معدل رضا المرضى' : 'Patient Satisfaction Rate', value: 94.5, target: 95, unit: '%', trend: 'up' },
    { name: language === 'ar' ? 'وقت انتظار المرضى' : 'Patient Wait Time', value: 15.3, target: 15, unit: language === 'ar' ? 'دقيقة' : 'min', trend: 'down' },
    { name: language === 'ar' ? 'معدل إعادة الدخول' : 'Readmission Rate', value: 2.1, target: 2.5, unit: '%', trend: 'down' },
    { name: language === 'ar' ? 'معدل العدوى المكتسبة' : 'Hospital Acquired Infection Rate', value: 1.2, target: 1.0, unit: '%', trend: 'up' }
  ];

  const handleNewIncident = () => {
    toast({
      title: "تم إضافة الحادثة بنجاح",
      description: "تم تسجيل الحادثة الجديدة وإرسال إشعار للفريق المختص",
    });
  };

  const handleExportReport = (type: string) => {
    toast({
      title: "جاري تصدير التقرير",
      description: `جاري إعداد تقرير ${type} للتحميل`,
    });
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
      'critical': 'bg-red-600 text-white',
    };
    return <Badge className={variants[priority] || variants.medium}>{t(priority)}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'proposed': 'bg-gray-100 text-gray-800',
      'approved': 'bg-green-100 text-green-800',
    };
    return <Badge className={variants[status] || variants.in_progress}>{t(status)}</Badge>;
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('qualityToolsTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('qualityToolsDesc')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <TabsTrigger value="incident-reporting">{t('incidentReportingTitle')}</TabsTrigger>
          <TabsTrigger value="quality-metrics">{t('qualityMetrics') || 'مؤشرات الجودة'}</TabsTrigger>
          <TabsTrigger value="root-cause">{t('rootCauseAnalysis') || 'تحليل الأسباب الجذرية'}</TabsTrigger>
          <TabsTrigger value="improvement-plans">{t('improvementPlans') || 'خطط التحسين'}</TabsTrigger>
        </TabsList>

        {/* Incident Reporting Tab */}
        <TabsContent value="incident-reporting">
          <IncidentReporting />
        </TabsContent>

        <TabsContent value="quality-metrics" className="space-y-6">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <h3 className="text-xl font-semibold">{t('keyPerformanceIndicators')}</h3>
            <Button onClick={() => handleExportReport(t('qualityMetrics'))} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {t('export')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className={`flex items-center justify-between mb-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <p className="text-sm text-gray-600">{metric.name}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {metric.value} {metric.unit}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${metric.trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <TrendingUp className={`h-5 w-5 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600 transform rotate-180'}`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between text-sm ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-600">{t('target')}:</span>
                      <span className="font-medium">{metric.target} {metric.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${metric.value >= metric.target ? 'bg-green-600' : 'bg-yellow-600'}`}
                        style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="root-cause" className="space-y-6">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <h3 className="text-xl font-semibold">{t('rootCauseAnalysis')}</h3>
            <Button onClick={() => setShowRCADialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('create')}
            </Button>
          </div>

          {isLoadingAnalyses ? (
            <Card>
              <CardContent className="p-6 text-center">{t('loading')}...</CardContent>
            </Card>
          ) : analyses.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {language === 'ar' ? 'لا توجد تحليلات للأسباب الجذرية' : 'No root cause analyses yet'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {language === 'ar' ? 'ابدأ بإنشاء تحليل جديد' : 'Start by creating a new analysis'}
                  </p>
                  <Button onClick={() => setShowRCADialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('create')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {analyses.map((rca) => (
                <Card key={rca.id}>
                  <CardHeader>
                    <div className={`flex items-start justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div>
                        <CardTitle className="text-lg">{rca.title}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{rca.problem}</p>
                      </div>
                      <Target className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">{t('status')}:</span>
                        <div className="mt-1">{getStatusBadge(rca.status)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t('priority')}:</span>
                        <div className="mt-1">{getPriorityBadge(rca.priority)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t('createdAt')}:</span>
                        <p className="font-medium">{new Date(rca.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                      </div>
                    </div>
                    
                    <div className={`flex gap-2 pt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Button size="sm" variant="outline" className="gap-2">
                        <FileText className="h-4 w-4" />
                        {t('viewDetails')}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        {t('export')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="improvement-plans" className="space-y-6">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <h3 className="text-xl font-semibold">{t('improvementPlans')}</h3>
            <Button onClick={() => setShowImprovementDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('create')}
            </Button>
          </div>

          {isLoadingPlans ? (
            <Card>
              <CardContent className="p-6 text-center">{t('loading')}...</CardContent>
            </Card>
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {language === 'ar' ? 'لا توجد خطط تحسين حالياً' : 'No improvement plans yet'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {language === 'ar' ? 'ابدأ بإنشاء خطة تحسين جديدة' : 'Start by creating a new improvement plan'}
                  </p>
                  <Button onClick={() => setShowImprovementDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('createImprovementPlan')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className={`flex items-start justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div>
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
                      </div>
                      <ClipboardCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">{t('status')}:</span>
                        <div className="mt-1">{getStatusBadge(plan.status)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t('priority')}:</span>
                        <div className="mt-1">{getPriorityBadge(plan.priority)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">{t('createdAt')}:</span>
                        <p className="font-medium">{new Date(plan.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                      </div>
                      {plan.target_completion_date && (
                        <div>
                          <span className="text-sm text-gray-600">{t('targetCompletionDate')}:</span>
                          <p className="font-medium">{new Date(plan.target_completion_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex gap-2 pt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Button size="sm" variant="outline" className="gap-2">
                        <FileText className="h-4 w-4" />
                        {t('viewDetails')}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        {t('export')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateRootCauseDialog 
        open={showRCADialog} 
        onOpenChange={setShowRCADialog}
      />
      
      <CreateImprovementPlanDialog 
        open={showImprovementDialog} 
        onOpenChange={setShowImprovementDialog}
      />
    </div>
  );
}

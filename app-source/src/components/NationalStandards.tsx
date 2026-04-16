
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  Target,
  TrendingUp,
  Award,
  Shield,
  Upload,
  Users,
  BarChart3,
  Settings,
  Building,
  Activity
} from 'lucide-react';
import { AdminPanel } from './AdminPanel';

// National Standards Programs Data
const nationalPrograms = [
  {
    id: 'hospitals',
    nameEn: 'National Standards for Hospitals',
    nameAr: 'المعايير الوطنية للمستشفيات',
    totalStandards: 425,
    totalSubStandards: 1750,
    compliance: 92,
    status: 'active',
    lastUpdated: '2024-06-15'
  },
  {
    id: 'phc',
    nameEn: 'National Standards for Public Health Centers (PHC)',
    nameAr: 'المعايير الوطنية لمراكز الرعاية الصحية الأولية',
    totalStandards: 280,
    totalSubStandards: 1125,
    compliance: 88,
    status: 'active',
    lastUpdated: '2024-05-20'
  },
  {
    id: 'clbb',
    nameEn: 'National Standards for Clinical Laboratories & Blood Banks (CLBB)',
    nameAr: 'المعايير الوطنية للمختبرات الطبية وبنوك الدم',
    totalStandards: 185,
    totalSubStandards: 740,
    compliance: 95,
    status: 'active',
    lastUpdated: '2024-06-10'
  },
  {
    id: 'amb',
    nameEn: 'National Standards for Ambulatory Care Centers (AMB)',
    nameAr: 'المعايير الوطنية لمراكز الرعاية التخصصية',
    totalStandards: 220,
    totalSubStandards: 890,
    compliance: 85,
    status: 'active',
    lastUpdated: '2024-05-30'
  },
  {
    id: 'dental',
    nameEn: 'National Standards for Dental Centers',
    nameAr: 'المعايير الوطنية لمراكز طب الأسنان',
    totalStandards: 45,
    totalSubStandards: 184,
    compliance: 90,
    status: 'active',
    lastUpdated: '2024-06-05'
  },
  {
    id: 'home-health',
    nameEn: 'National Standards for Home Healthcare Services',
    nameAr: 'المعايير الوطنية لخدمات الرعاية الصحية المنزلية',
    totalStandards: 95,
    totalSubStandards: 385,
    compliance: 78,
    status: 'active',
    lastUpdated: '2024-04-15'
  },
  {
    id: 'acs',
    nameEn: 'National Standards for Acute Coronary Syndrome Services',
    nameAr: 'المعايير الوطنية لخدمات متلازمة الشريان التاجي الحادة',
    totalStandards: 75,
    totalSubStandards: 300,
    compliance: 87,
    status: 'active',
    lastUpdated: '2024-05-25'
  }
];

// Chapters Data with predefined structures
const programChapters = {
  dental: [
    { no: 1, code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة', standards: 29, subStandards: 119, compliance: 95 },
    { no: 2, code: 'PC', nameEn: 'Provision of Care', nameAr: 'معايير تقديم الرعاية', standards: 16, subStandards: 65, compliance: 85 }
  ],
  amb: [
    { no: 1, code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة', standards: 25, subStandards: 100, compliance: 88 },
    { no: 2, code: 'PC', nameEn: 'Provision of Care', nameAr: 'معايير تقديم الرعاية', standards: 35, subStandards: 145, compliance: 82 },
    { no: 3, code: 'LB', nameEn: 'Laboratory', nameAr: 'معايير المختبر', standards: 20, subStandards: 80, compliance: 90 },
    { no: 4, code: 'RD', nameEn: 'Radiology', nameAr: 'معايير الأشعة', standards: 18, subStandards: 75, compliance: 85 },
    { no: 5, code: 'DN', nameEn: 'Nutrition', nameAr: 'معايير التغذية', standards: 15, subStandards: 60, compliance: 78 },
    { no: 6, code: 'MM', nameEn: 'Medication Management', nameAr: 'إدارة الأدوية', standards: 22, subStandards: 90, compliance: 92 },
    { no: 7, code: 'MOI', nameEn: 'Management of Information', nameAr: 'إدارة المعلومات', standards: 18, subStandards: 70, compliance: 80 },
    { no: 8, code: 'IPC', nameEn: 'Infection Prevention & Control', nameAr: 'مكافحة العدوى', standards: 25, subStandards: 100, compliance: 95 },
    { no: 9, code: 'FMS', nameEn: 'Facility Management & Safety', nameAr: 'إدارة المرافق والسلامة', standards: 20, subStandards: 85, compliance: 87 },
    { no: 10, code: 'DPU', nameEn: 'Dialysis & Pulmonary Unit', nameAr: 'وحدة الغسيل الكلوي والرئوي', standards: 12, subStandards: 50, compliance: 83 },
    { no: 11, code: 'DA', nameEn: 'Day Ambulatory', nameAr: 'الرعاية النهارية', standards: 10, subStandards: 25, compliance: 88 }
  ],
  hospitals: [
    { no: 1, code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة', standards: 30, subStandards: 125, compliance: 90 },
    { no: 2, code: 'HR', nameEn: 'Human Resources', nameAr: 'الموارد البشرية', standards: 25, subStandards: 100, compliance: 88 },
    { no: 3, code: 'MS', nameEn: 'Medical Staff', nameAr: 'الطاقم الطبي', standards: 20, subStandards: 85, compliance: 92 },
    { no: 4, code: 'PC', nameEn: 'Provision of Care', nameAr: 'تقديم الرعاية', standards: 40, subStandards: 160, compliance: 89 },
    { no: 5, code: 'NR', nameEn: 'Nursing', nameAr: 'التمريض', standards: 35, subStandards: 140, compliance: 94 },
    { no: 6, code: 'QM', nameEn: 'Quality Management', nameAr: 'إدارة الجودة', standards: 28, subStandards: 115, compliance: 91 },
    { no: 7, code: 'PFE', nameEn: 'Patient & Family Education', nameAr: 'تثقيف المريض والعائلة', standards: 15, subStandards: 60, compliance: 85 },
    { no: 8, code: 'AN', nameEn: 'Anesthesia', nameAr: 'التخدير', standards: 18, subStandards: 75, compliance: 93 },
    { no: 9, code: 'OR', nameEn: 'Operating Room', nameAr: 'غرفة العمليات', standards: 22, subStandards: 90, compliance: 96 },
    { no: 10, code: 'ICU', nameEn: 'Intensive Care Units', nameAr: 'العناية المركزة', standards: 25, subStandards: 100, compliance: 89 },
    { no: 11, code: 'LD_MATERNITY', nameEn: 'Labor & Delivery', nameAr: 'الولادة والتوليد', standards: 20, subStandards: 80, compliance: 87 },
    { no: 12, code: 'HM', nameEn: 'Hazardous Materials', nameAr: 'المواد الخطرة', standards: 15, subStandards: 65, compliance: 92 },
    { no: 13, code: 'ER', nameEn: 'Emergency Services', nameAr: 'خدمات الطوارئ', standards: 30, subStandards: 120, compliance: 94 },
    { no: 14, code: 'RD', nameEn: 'Radiology', nameAr: 'الأشعة', standards: 20, subStandards: 85, compliance: 88 },
    { no: 15, code: 'BC', nameEn: 'Blood Collection', nameAr: 'سحب الدم', standards: 12, subStandards: 50, compliance: 95 },
    { no: 16, code: 'ORT', nameEn: 'Organ & Tissue', nameAr: 'الأعضاء والأنسجة', standards: 8, subStandards: 35, compliance: 90 },
    { no: 17, code: 'RS', nameEn: 'Rehabilitation Services', nameAr: 'خدمات التأهيل', standards: 18, subStandards: 75, compliance: 86 },
    { no: 18, code: 'DN', nameEn: 'Nutrition', nameAr: 'التغذية', standards: 15, subStandards: 60, compliance: 83 },
    { no: 19, code: 'MOI', nameEn: 'Management of Information', nameAr: 'إدارة المعلومات', standards: 25, subStandards: 100, compliance: 87 },
    { no: 20, code: 'IPC', nameEn: 'Infection Prevention & Control', nameAr: 'مكافحة العدوى', standards: 30, subStandards: 125, compliance: 97 },
    { no: 21, code: 'MM', nameEn: 'Medication Management', nameAr: 'إدارة الأدوية', standards: 35, subStandards: 145, compliance: 94 },
    { no: 22, code: 'LB', nameEn: 'Laboratory', nameAr: 'المختبر', standards: 25, subStandards: 105, compliance: 92 },
    { no: 23, code: 'FMS', nameEn: 'Facility Management & Safety', nameAr: 'إدارة المرافق والسلامة', standards: 28, subStandards: 115, compliance: 89 }
  ]
};

export function NationalStandards() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('programs-overview');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleViewProgram = (programId: string) => {
    setSelectedProgram(programId);
    setActiveTab('program-details');
    toast({
      title: "عرض البرنامج",
      description: `جاري عرض تفاصيل برنامج ${nationalPrograms.find(p => p.id === programId)?.nameAr}`,
    });
  };

  const handleUploadDocument = (chapterCode: string) => {
    toast({
      title: "رفع الوثيقة",
      description: `جاري رفع الوثيقة للفصل ${chapterCode}`,
    });
  };

  const handleExportReport = (programId: string) => {
    toast({
      title: "تصدير التقرير",
      description: `جاري تصدير تقرير الامتثال للبرنامج`,
    });
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return 'text-green-600';
    if (compliance >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'bg-green-100 text-green-800',
      'under-review': 'bg-yellow-100 text-yellow-800',
      'draft': 'bg-blue-100 text-blue-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    const labelsAr = {
      'active': 'نشط',
      'under-review': 'قيد المراجعة',
      'draft': 'مسودة',
      'inactive': 'غير نشط'
    };
    const labelsEn = {
      'active': 'Active',
      'under-review': 'Under Review',
      'draft': 'Draft',
      'inactive': 'Inactive'
    };
    const labels = language === 'ar' ? labelsAr : labelsEn;
    return <Badge className={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const filteredPrograms = nationalPrograms.filter(program =>
    (searchTerm === '' || program.nameAr.includes(searchTerm) || program.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || program.status === filterStatus)
  );

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {language === 'ar' ? 'المعايير الوطنية' : 'National Standards'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة ومتابعة برامج الاعتماد للمعايير الوطنية' : 'Manage and monitor national accreditation standard programs'}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setActiveTab('new-program')}>
          <Plus className="h-4 w-4" />
          {language === 'ar' ? 'إضافة برنامج جديد' : 'Add New Program'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-6 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <TabsTrigger value="programs-overview">
            {language === 'ar' ? 'نظرة عامة على البرامج' : 'Programs Overview'}
          </TabsTrigger>
          <TabsTrigger value="program-details">
            {language === 'ar' ? 'تفاصيل البرنامج' : 'Program Details'}
          </TabsTrigger>
          <TabsTrigger value="compliance-dashboard">
            {language === 'ar' ? 'لوحة الامتثال' : 'Compliance Dashboard'}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'المستخدمون' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'التصدير' : 'Export'}
          </TabsTrigger>
          <TabsTrigger value="admin-panel">
            {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
          </TabsTrigger>
        </TabsList>

        {/* Programs Overview Tab */}
        <TabsContent value="programs-overview" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className={`flex gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className="relative">
                    <Search className={`absolute top-3 h-4 w-4 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                    <Input
                      placeholder={language === 'ar' ? 'البحث في البرامج...' : 'Search programs...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'}`}
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={language === 'ar' ? 'تصفية حسب الحالة' : 'Filter by status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                    <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                    <SelectItem value="under-review">{language === 'ar' ? 'قيد المراجعة' : 'Under Review'}</SelectItem>
                    <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                    <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className={`flex items-start justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                      <CardTitle className="text-lg">{language === 'ar' ? program.nameAr : program.nameEn}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{language === 'ar' ? program.nameEn : program.nameAr}</p>
                    </div>
                    <Building className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-gray-600">{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                    {getStatusBadge(program.status)}
                  </div>
                  
                  <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-gray-600">{language === 'ar' ? 'إجمالي المعايير:' : 'Total Standards:'}</span>
                    <span className="text-sm font-medium">{program.totalStandards}</span>
                  </div>

                  <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-gray-600">{language === 'ar' ? 'المعايير الفرعية:' : 'Sub-Standards:'}</span>
                    <span className="text-sm font-medium">{program.totalSubStandards}</span>
                  </div>

                  <div className="space-y-2">
                    <div className={`flex items-center justify-between text-sm ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-gray-600">{language === 'ar' ? 'نسبة الامتثال:' : 'Compliance:'}</span>
                      <span className={`font-bold ${getComplianceColor(program.compliance)}`}>
                        {program.compliance}%
                      </span>
                    </div>
                    <Progress value={program.compliance} className="h-2" />
                  </div>

                  <div className={`flex items-center justify-between text-sm ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-gray-600">{language === 'ar' ? 'آخر تحديث:' : 'Last Updated:'}</span>
                    <span className="font-medium">{program.lastUpdated}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={() => handleViewProgram(program.id)}
                      >
                        <Eye className="h-4 w-4" />
                        {language === 'ar' ? 'عرض' : 'View'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 gap-2"
                        onClick={() => handleExportReport(program.id)}
                      >
                        <Download className="h-4 w-4" />
                        {language === 'ar' ? 'تقرير' : 'Report'}
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Program Details Tab */}
        <TabsContent value="program-details" className="space-y-6">
          {selectedProgram ? (
            <>
              <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-semibold">
                  {language === 'ar' ? nationalPrograms.find(p => p.id === selectedProgram)?.nameAr : nationalPrograms.find(p => p.id === selectedProgram)?.nameEn}
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    رفع وثيقة
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    تصدير
                  </Button>
                </div>
              </div>

              {/* Chapters Table */}
              <Card>
                <CardHeader>
                  <CardTitle>الفصول والمعايير</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>رقم</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>رمز الفصل</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>اسم الفصل</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>عدد المعايير</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>المعايير الفرعية</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>نسبة الامتثال</TableHead>
                        <TableHead className={language === 'ar' ? 'text-right' : 'text-left'}>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programChapters[selectedProgram as keyof typeof programChapters]?.map((chapter) => (
                        <TableRow key={chapter.code}>
                          <TableCell>{chapter.no}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{chapter.code}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{chapter.nameAr}</div>
                              <div className="text-sm text-gray-500">{chapter.nameEn}</div>
                            </div>
                          </TableCell>
                          <TableCell>{chapter.standards}</TableCell>
                          <TableCell>{chapter.subStandards}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getComplianceColor(chapter.compliance)}`}>
                                {chapter.compliance}%
                              </span>
                              <Progress value={chapter.compliance} className="h-2 w-20" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleUploadDocument(chapter.code)}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">اختر برنامج لعرض التفاصيل</h3>
                <p className="text-gray-500">يرجى اختيار برنامج من قائمة البرامج لعرض الفصول والمعايير</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Compliance Dashboard Tab */}
        <TabsContent value="compliance-dashboard" className="space-y-6">
          <h3 className="text-xl font-semibold">لوحة تحكم الامتثال</h3>
          
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-gray-600">إجمالي البرامج</p>
                    <p className="text-3xl font-bold text-blue-600">{nationalPrograms.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-gray-600">إجمالي المعايير</p>
                    <p className="text-3xl font-bold text-green-600">
                      {nationalPrograms.reduce((sum, p) => sum + p.totalStandards, 0)}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-gray-600">المعايير الفرعية</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {nationalPrograms.reduce((sum, p) => sum + p.totalSubStandards, 0)}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-gray-600">متوسط الامتثال</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {Math.round(nationalPrograms.reduce((sum, p) => sum + p.compliance, 0) / nationalPrograms.length)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Programs Compliance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>الامتثال حسب البرنامج</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nationalPrograms.map((program) => (
                  <div key={program.id} className="space-y-2">
                    <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-sm font-medium">{program.nameAr}</span>
                      <span className={`text-sm ${getComplianceColor(program.compliance)}`}>
                        {program.compliance}%
                      </span>
                    </div>
                    <Progress value={program.compliance} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Users className="h-5 w-5" />
                {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">24</p>
                        <p className="text-sm text-gray-600">{language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">18</p>
                        <p className="text-sm text-gray-600">{language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Shield className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">6</p>
                        <p className="text-sm text-gray-600">{language === 'ar' ? 'المدراء' : 'Administrators'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User Actions */}
              <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  {language === 'ar' ? 'تصدير قائمة المستخدمين' : 'Export User List'}
                </Button>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  {language === 'ar' ? 'إعدادات الصلاحيات' : 'Permission Settings'}
                </Button>
              </div>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'قائمة المستخدمين' : 'Users List'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                        <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                        <TableHead>{language === 'ar' ? 'القسم' : 'Department'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>أحمد محمد علي</TableCell>
                        <TableCell>ahmed.ali@hospital.gov.sa</TableCell>
                        <TableCell><Badge>مدير جودة</Badge></TableCell>
                        <TableCell>الجودة والسلامة</TableCell>
                        <TableCell><Badge variant="outline" className="bg-green-100 text-green-800">نشط</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>فاطمة سعد الحربي</TableCell>
                        <TableCell>fatima.harbi@hospital.gov.sa</TableCell>
                        <TableCell><Badge>أخصائي مكافحة عدوى</Badge></TableCell>
                        <TableCell>مكافحة العدوى</TableCell>
                        <TableCell><Badge variant="outline" className="bg-green-100 text-green-800">نشط</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Download className="h-5 w-5" />
                {language === 'ar' ? 'مركز التصدير والتقارير' : 'Export & Reports Center'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className={`text-center space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                    <h3 className="font-semibold">{language === 'ar' ? 'تقرير الامتثال الشامل' : 'Comprehensive Compliance Report'}</h3>
                    <p className="text-sm text-gray-600">{language === 'ar' ? 'تقرير شامل عن حالة الامتثال لجميع البرامج' : 'Complete report on compliance status for all programs'}</p>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      {language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className={`text-center space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <BarChart3 className="h-12 w-12 text-green-600 mx-auto" />
                    <h3 className="font-semibold">{language === 'ar' ? 'تقرير إحصائي مفصل' : 'Detailed Statistical Report'}</h3>
                    <p className="text-sm text-gray-600">{language === 'ar' ? 'إحصائيات مفصلة ومخططات بيانية' : 'Detailed statistics and data charts'}</p>
                    <Button className="w-full gap-2" variant="outline">
                      <Download className="h-4 w-4" />
                      {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className={`text-center space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <Users className="h-12 w-12 text-purple-600 mx-auto" />
                    <h3 className="font-semibold">{language === 'ar' ? 'تقرير المستخدمين والأنشطة' : 'Users & Activities Report'}</h3>
                    <p className="text-sm text-gray-600">{language === 'ar' ? 'تقرير شامل عن المستخدمين وأنشطتهم' : 'Comprehensive report on users and their activities'}</p>
                    <Button className="w-full gap-2" variant="outline">
                      <Download className="h-4 w-4" />
                      {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Custom Export */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'تصدير مخصص' : 'Custom Export'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">{language === 'ar' ? 'اختر البرنامج' : 'Select Program'}</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر برنامج...' : 'Select program...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {nationalPrograms.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              {language === 'ar' ? program.nameAr : program.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">{language === 'ar' ? 'تنسيق الملف' : 'File Format'}</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر التنسيق...' : 'Select format...'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="word">Word</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    {language === 'ar' ? 'إنشاء وتصدير التقرير' : 'Generate & Export Report'}
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Program Tab */}
        <TabsContent value="new-program" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Plus className="h-5 w-5" />
                {language === 'ar' ? 'إضافة برنامج معايير جديد' : 'Add New Standards Program'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">{language === 'ar' ? 'اسم البرنامج (العربية)' : 'Program Name (Arabic)'}</label>
                    <Input placeholder={language === 'ar' ? 'أدخل اسم البرنامج بالعربية' : 'Enter program name in Arabic'} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'ar' ? 'اسم البرنامج (الإنجليزية)' : 'Program Name (English)'}</label>
                    <Input placeholder={language === 'ar' ? 'أدخل اسم البرنامج بالإنجليزية' : 'Enter program name in English'} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'ar' ? 'نوع المرفق الصحي' : 'Healthcare Facility Type'}</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر نوع المرفق...' : 'Select facility type...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">{language === 'ar' ? 'مستشفى' : 'Hospital'}</SelectItem>
                        <SelectItem value="clinic">{language === 'ar' ? 'عيادة' : 'Clinic'}</SelectItem>
                        <SelectItem value="phc">{language === 'ar' ? 'مركز رعاية أولية' : 'Primary Care Center'}</SelectItem>
                        <SelectItem value="lab">{language === 'ar' ? 'مختبر' : 'Laboratory'}</SelectItem>
                        <SelectItem value="dental">{language === 'ar' ? 'طب أسنان' : 'Dental Center'}</SelectItem>
                        <SelectItem value="ambulatory">{language === 'ar' ? 'رعاية تخصصية' : 'Ambulatory Care'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">{language === 'ar' ? 'عدد المعايير المتوقع' : 'Expected Number of Standards'}</label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'ar' ? 'عدد الفصول' : 'Number of Chapters'}</label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{language === 'ar' ? 'حالة البرنامج' : 'Program Status'}</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر الحالة...' : 'Select status...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                        <SelectItem value="under-review">{language === 'ar' ? 'قيد المراجعة' : 'Under Review'}</SelectItem>
                        <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{language === 'ar' ? 'وصف البرنامج' : 'Program Description'}</label>
                <Input placeholder={language === 'ar' ? 'أدخل وصف مفصل للبرنامج ومجال تطبيقه' : 'Enter detailed description of the program and its scope'} />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">{language === 'ar' ? 'الفصول والمعايير' : 'Chapters & Standards'}</h4>
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input placeholder={language === 'ar' ? 'رمز الفصل' : 'Chapter Code'} />
                      <Input placeholder={language === 'ar' ? 'اسم الفصل (عربي)' : 'Chapter Name (AR)'} />
                      <Input placeholder={language === 'ar' ? 'اسم الفصل (إنجليزي)' : 'Chapter Name (EN)'} />
                      <Input type="number" placeholder={language === 'ar' ? 'عدد المعايير' : 'Standards Count'} />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      {language === 'ar' ? 'إضافة فصل' : 'Add Chapter'}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Button className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {language === 'ar' ? 'إنشاء البرنامج' : 'Create Program'}
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('programs-overview')}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Panel Tab */}
        <TabsContent value="admin-panel" className="space-y-6">
          <AdminPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

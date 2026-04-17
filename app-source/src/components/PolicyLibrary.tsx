
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddPolicyModal } from "@/components/AddPolicyModal";
import { FileUploadManager } from "@/components/FileUploadManager";
import { BulkPolicyUpload } from "@/components/BulkPolicyUpload";
import { PolicyGovernanceDialog } from "@/components/PolicyGovernanceDialog";
import { PolicyAttestationDialog } from "@/components/PolicyAttestationDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { usePolicyTemplates } from "@/hooks/usePolicyTemplates";
import { supabase } from "@/integrations/supabase/client";
import { WordDocumentService } from "@/services/WordDocumentService";
import { Search, Plus, FileText, Download, Calendar, AlertTriangle, CheckCircle, Printer, Edit, Save, X, Users, Upload, BookOpen, Globe, Filter, Files } from 'lucide-react';
import { DocumentAssignmentModal } from "@/components/DocumentAssignmentModal";

interface EditingPolicy {
  id: string;
  title: string;
  title_ar?: string;
  description?: string;
  content: string;
  content_ar?: string;
  category: string;
}

const hasReadableTitle = (value?: string | null) => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\?+[\s\d_-]*$/.test(trimmed)) return false;
  return !trimmed.includes('????');
};

const getReadableResourceTitle = (
  resource: {
    id: string;
    title?: string | null;
    title_ar?: string | null;
    description?: string | null;
  },
  language: string
) => {
  const preferredTitle = language === 'ar' ? resource.title_ar : resource.title;
  const secondaryTitle = language === 'ar' ? resource.title : resource.title_ar;

  if (hasReadableTitle(preferredTitle)) return preferredTitle!.trim();
  if (hasReadableTitle(secondaryTitle)) return secondaryTitle!.trim();
  if (resource.description?.trim()) return resource.description.trim();

  return `Policy ${resource.id.slice(0, 8)}`;
};

export function PolicyLibrary() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [storedPolicies, setStoredPolicies] = useState<any[]>([]);
  const [policyTemplates, setPolicyTemplates] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<EditingPolicy | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [documentToAssign, setDocumentToAssign] = useState<any>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [governancePolicy, setGovernancePolicy] = useState<any | null>(null);
  const [attestationPolicy, setAttestationPolicy] = useState<any | null>(null);

  const { t, language, dir } = useLanguage();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const { templates } = usePolicyTemplates();
  const canManagePolicies = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  // Comprehensive category list including resources, chapters, and departments
  const allCategories = [
    // Healthcare/Medical Categories
    'Patient Safety',
    'Quality Management', 
    'Infection Control',
    'Emergency Management',
    'Pharmacy Services',
    'Laboratory Services',
    'Radiology Services',
    'Operating Room',
    'Critical Care',
    'Ambulatory Care',
    'Dental Laboratory',
    'Provision of Care',
    
    // Operational Categories
    'Human Resources',
    'Information Management',
    'Facilities Management',
    'Governance',
    'Medical Equipment',
    'Documentation',
    'Finance',
    'Operations',
    'Information Technology',
    'Quality Assurance',
    
    // Standards/Compliance Categories  
    'JCI Standards',
    'CBAHI Standards',
    'ISO Standards',
    'WHO Guidelines',
    'Safety Standards',
    'Environmental Safety',
    'Risk Management',
    'Performance Improvement',
    
    // Existing policy categories from database
    'amb',
    'quality',
    'pharmacy',
    'infection-control',
    'safety',
    'it'
  ];

  // Fetch policies, templates, and departments from database
  useEffect(() => {
    fetchAllResources();
  }, []);

  const fetchAllResources = async () => {
    setLoading(true);
    try {
      // Fetch policies
      const { data: policiesData, error: policiesError } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (policiesError) throw policiesError;

      // Fetch policy templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('policy_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (departmentsError) throw departmentsError;

      setStoredPolicies(policiesData || []);
      setPolicyTemplates(templatesData || []);
      setDepartments(departmentsData || []);

      // Collect unique categories from all sources
      const categories = new Set<string>();
      
      // Add categories from policies and templates
      [...(policiesData || []), ...(templatesData || [])].forEach(item => {
        if (item.category) categories.add(item.category);
      });
      
      // Add department names as categories
      (departmentsData || []).forEach(dept => {
        categories.add(dept.name);
      });
      
      // Merge with predefined categories
      allCategories.forEach(cat => categories.add(cat));
      
      setAvailableCategories(Array.from(categories).sort());
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل الموارد' : 'Failed to fetch resources',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Combine all resources for search
  const allResources = useMemo(() => {
    const policies = storedPolicies.map(policy => ({
      ...policy,
      type: 'policy',
      displayTitle: getReadableResourceTitle(policy, language),
      searchableContent: `${policy.title} ${policy.title_ar || ''} ${policy.description || ''} ${policy.content || ''} ${policy.category}`
    }));

    const templates = policyTemplates.map(template => ({
      ...template,
      type: 'template',
      displayTitle: getReadableResourceTitle(template, language),
      searchableContent: `${template.title} ${template.title_ar || ''} ${template.description || ''} ${template.content || ''} ${template.category}`
    }));

    return [...policies, ...templates];
  }, [storedPolicies, policyTemplates, language]);

  // Filter resources based on search and filters
  const filteredResources = useMemo(() => {
    return allResources.filter(resource => {
      const matchesSearch = searchQuery === '' || 
        resource.searchableContent.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        resource.category === selectedCategory;
      
      const matchesStatus = selectedStatus === 'all' || 
        resource.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [allResources, searchQuery, selectedCategory, selectedStatus]);

  const handleEditPolicy = (resource: any) => {
    if (!canManagePolicies) {
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access denied',
        description: language === 'ar' ? 'يمكنك عرض السياسات فقط.' : 'Staff can view policies, but cannot edit them.',
        variant: 'destructive'
      });
      return;
    }

    setEditingPolicy({
      id: resource.id,
      title: resource.title,
      title_ar: resource.title_ar,
      description: resource.description,
      content: resource.content,
      content_ar: resource.content_ar,
      category: resource.category
    });
    setIsEditModalOpen(true);
  };

  const saveEditedPolicy = async () => {
    if (!editingPolicy) return;

    if (!canManagePolicies) {
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access denied',
        description: language === 'ar' ? 'لا تملك صلاحية تعديل السياسات.' : 'You do not have permission to edit policies.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const table = editingPolicy.id.startsWith('POL-') ? 'policies' : 'policy_templates';
      
      const { error } = await supabase
        .from(table)
        .update({
          title: editingPolicy.title,
          title_ar: editingPolicy.title_ar,
          description: editingPolicy.description,
          content: editingPolicy.content,
          content_ar: editingPolicy.content_ar,
          category: editingPolicy.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPolicy.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully'
      });

      setIsEditModalOpen(false);
      setEditingPolicy(null);
      fetchAllResources(); // Refresh data
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ التغييرات' : 'Failed to save changes',
        variant: 'destructive'
      });
    }
  };

  const handleExportToWord = async (policy: any) => {
    try {
      await WordDocumentService.exportToWord({
        id: policy.id,
        title: policy.title,
        title_ar: policy.title_ar,
        description: policy.description,
        content: policy.content || policy.description || '',
        category: policy.category,
        status: policy.status,
        created_at: policy.created_at,
        updated_at: policy.updated_at
      });
      
      toast({
        title: language === 'ar' ? 'تم التصدير' : 'Exported',
        description: language === 'ar' ? 'تم تصدير المستند بتنسيق Word' : 'Document exported to Word format'
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تصدير المستند' : 'Failed to export document',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadPolicy = (policy: any) => {
    toast({
      title: "جاري التحميل",
      description: `جاري تحميل ${policy.title}`,
    });
    
    // Create policy content
    const policyContent = `
${policy.title} (${policy.titleEn})
رقم السياسة: ${policy.id}
الإصدار: ${policy.version}
الفئة: ${policy.category}
المسؤول: ${policy.owner}
آخر مراجعة: ${policy.lastReview}
المراجعة التالية: ${policy.nextReview}
الحالة: ${policy.status}
معايير الامتثال: ${policy.compliance.join(', ')}

وصف السياسة:
هذه سياسة شاملة تهدف إلى ضمان الامتثال لأعلى معايير الجودة والسلامة في المؤسسة الصحية.

الأهداف:
1. ضمان الامتثال للمعايير الدولية
2. تحسين جودة الخدمات المقدمة
3. ضمان السلامة للمرضى والعاملين

الإجراءات:
1. مراجعة دورية للسياسة
2. تدريب الموظفين
3. متابعة التطبيق
4. تقييم الفعالية
    `;
    
    const blob = new Blob([policyContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policy.id}_${policy.title}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPolicy = (policy: any) => {
    toast({
      title: "جاري الطباعة",
      description: `جاري إعداد ${policy.title} للطباعة`,
    });
    
    const printContent = `
      <html>
        <head>
          <title>${policy.title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              direction: rtl;
              text-align: right;
            }
            h1 { color: #1e40af; margin-bottom: 20px; }
            .header { 
              border-bottom: 2px solid #1e40af; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .content { line-height: 1.8; }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 10px; 
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .label { font-weight: bold; color: #374151; }
            .value { color: #6b7280; }
            .compliance-badges { margin-top: 10px; }
            .badge { 
              display: inline-block; 
              background: #dbeafe; 
              color: #1e40af; 
              padding: 4px 8px; 
              border-radius: 4px; 
              margin-left: 5px; 
              font-size: 12px;
            }
            .section { margin-top: 30px; }
            .section h3 { color: #1e40af; margin-bottom: 15px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${policy.title}</h1>
            <p style="color: #6b7280; margin: 5px 0;">${policy.titleEn}</p>
            
            <div class="info-row">
              <span class="label">رقم السياسة:</span>
              <span class="value">${policy.id}</span>
            </div>
            
            <div class="info-row">
              <span class="label">الإصدار:</span>
              <span class="value">${policy.version}</span>
            </div>
            
            <div class="info-row">
              <span class="label">الفئة:</span>
              <span class="value">${policy.category}</span>
            </div>
            
            <div class="info-row">
              <span class="label">المسؤول:</span>
              <span class="value">${policy.owner}</span>
            </div>
            
            <div class="info-row">
              <span class="label">آخر مراجعة:</span>
              <span class="value">${policy.lastReview}</span>
            </div>
            
            <div class="info-row">
              <span class="label">المراجعة التالية:</span>
              <span class="value">${policy.nextReview}</span>
            </div>
            
            <div class="info-row">
              <span class="label">الحالة:</span>
              <span class="value">${policy.status}</span>
            </div>
            
            <div class="compliance-badges">
              <span class="label">معايير الامتثال:</span>
              ${policy.compliance.map(standard => `<span class="badge">${standard}</span>`).join('')}
            </div>
          </div>
          
          <div class="content">
            <div class="section">
              <h3>وصف السياسة</h3>
              <p>هذه سياسة شاملة تهدف إلى ضمان الامتثال لأعلى معايير الجودة والسلامة في المؤسسة الصحية وفقاً للمعايير المحلية والدولية.</p>
            </div>
            
            <div class="section">
              <h3>الأهداف</h3>
              <ul>
                <li>ضمان الامتثال للمعايير الدولية والمحلية</li>
                <li>تحسين جودة الخدمات المقدمة للمرضى</li>
                <li>ضمان السلامة للمرضى والعاملين</li>
                <li>تقليل المخاطر والحوادث</li>
              </ul>
            </div>
            
            <div class="section">
              <h3>الإجراءات الأساسية</h3>
              <ol>
                <li>مراجعة دورية للسياسة كل ستة أشهر</li>
                <li>تدريب الموظفين على تطبيق السياسة</li>
                <li>متابعة التطبيق والالتزام</li>
                <li>تقييم الفعالية وتحديث السياسة حسب الحاجة</li>
                <li>توثيق جميع الإجراءات والتغييرات</li>
              </ol>
            </div>
            
            <div class="section">
              <h3>المسؤوليات</h3>
              <p>جميع الموظفين مسؤولون عن فهم وتطبيق هذه السياسة في إطار عملهم اليومي، مع وجود مسؤول مخصص لمتابعة التطبيق والامتثال.</p>
            </div>
          </div>
          
          <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #6b7280;">
            <p>تم إنشاء هذا المستند في: ${new Date().toLocaleDateString('ar-SA')}</p>
            <p>مركز الامتثال - المؤسسة الصحية</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleAssignDocument = (resource: any) => {
    if (!canManagePolicies) {
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access denied',
        description: language === 'ar' ? 'تعيين السياسات متاح فقط للمشرفين.' : 'Only elevated roles can assign policies.',
        variant: 'destructive'
      });
      return;
    }

    setDocumentToAssign(resource);
    setIsAssignmentModalOpen(true);
  };

  const handleExportDocument = (resource: any) => {
    const readableTitle = getReadableResourceTitle(resource, language);
    const fileName = `${readableTitle.replace(/\s+/g, '_')}_${new Date().getTime()}`;
    
    // Create comprehensive export content
    const exportContent = {
      id: resource.id,
      title: readableTitle,
      title_ar: resource.title_ar,
      description: resource.description,
      content: resource.content,
      content_ar: resource.content_ar,
      category: resource.category,
      type: resource.type,
      status: resource.status,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      exported_at: new Date().toISOString(),
      export_format: 'JSON'
    };

    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportContent, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم تصدير المستند بنجاح' : 'Document exported successfully'
    });
  };

  const handleUploadUpdate = async (resourceId: string, file: File) => {
    if (!canManagePolicies) {
      toast({
        title: language === 'ar' ? 'غير مسموح' : 'Access denied',
        description: language === 'ar' ? 'رفع نسخة محدثة متاح فقط للمشرفين.' : 'Only elevated roles can re-upload policy files.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceId', resourceId);

      // For now, we'll update the content with file info
      // In a real implementation, you'd upload to storage and update the document
      const fileContent = `Updated document uploaded: ${file.name} (${file.size} bytes) at ${new Date().toISOString()}`;
      
      const table = resourceId.startsWith('POL-') ? 'policies' : 'policy_templates';
      
      const { error } = await supabase
        .from(table)
        .update({
          content: fileContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث المستند بنجاح' : 'Document updated successfully'
      });

      fetchAllResources();
    } catch (error) {
      console.error('Error uploading update:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث المستند' : 'Failed to update document',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      [t('active')]: 'bg-green-100 text-green-800',
      [t('expired')]: 'bg-red-100 text-red-800',
      [t('underReview')]: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={`${variants[status as keyof typeof variants]} text-xs`}>
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case t('active'):
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case t('expired'):
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case t('underReview'):
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const canManageGovernance = canManagePolicies;

  return (
    <div className="space-y-6" dir={dir}>
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('policyLibraryTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('institutionalPolicies')}</p>
        </div>
        {canManagePolicies && (
          <div className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button 
              className={`gap-2 bg-blue-600 hover:bg-blue-700 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t('addNewPolicy')}
            </Button>
            
            <Button 
              onClick={() => setIsBulkUploadOpen(true)} 
              variant="outline" 
              className={`gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <Files className="h-4 w-4" />
              {language === 'ar' ? 'رفع مجمع' : 'Bulk Upload'}
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="dark:bg-gray-800">
        <CardContent className="p-4">
          <div className={`flex gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="relative flex-1">
              <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <Input 
                placeholder={language === 'ar' ? 'البحث في جميع الموارد...' : 'Search all resources...'} 
                className={`${language === 'ar' ? 'pr-10 text-right' : 'pl-10'} dark:bg-gray-700`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64 dark:bg-gray-700">
                <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="all">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {language === 'ar' ? 
                      // Arabic translations for common categories
                      (category === 'Patient Safety' ? 'سلامة المرضى' :
                       category === 'Quality Management' ? 'إدارة الجودة' :
                       category === 'Infection Control' ? 'مكافحة العدوى' :
                       category === 'Emergency Management' ? 'إدارة الطوارئ' :
                       category === 'Pharmacy Services' ? 'خدمات الصيدلة' :
                       category === 'Laboratory Services' ? 'خدمات المختبر' :
                       category === 'Human Resources' ? 'الموارد البشرية' :
                       category === 'Information Technology' ? 'تقنية المعلومات' :
                       category === 'Operations' ? 'العمليات' :
                       category === 'Finance' ? 'المالية' :
                       category === 'Quality Assurance' ? 'ضمان الجودة' :
                       category === 'Dental Laboratory' ? 'مختبر الأسنان' :
                       category === 'Provision of Care' ? 'تقديم الرعاية' :
                       category) : 
                      category
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 dark:bg-gray-700">
                <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
                <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                <SelectItem value="expired">{language === 'ar' ? 'منتهي الصلاحية' : 'Expired'}</SelectItem>
                <SelectItem value="review">{language === 'ar' ? 'قيد المراجعة' : 'Under Review'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
        </div>
      )}

      {/* Resources Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className={`flex items-start justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                      <CardTitle className="text-lg">{resource.displayTitle}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {resource.type === 'template' ? 
                          (language === 'ar' ? 'قالب' : 'Template') : 
                          (language === 'ar' ? 'سياسة' : 'Policy')
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant={resource.type === 'template' ? 'secondary' : 'default'}>
                    {resource.type === 'template' ? 
                      (language === 'ar' ? 'قالب' : 'Template') : 
                      (language === 'ar' ? 'سياسة' : 'Policy')
                    }
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-600">{language === 'ar' ? 'المعرف:' : 'ID:'}</span>
                  <Badge variant="outline">{resource.id}</Badge>
                </div>
                
                {resource.category && (
                  <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-gray-600">{language === 'ar' ? 'الفئة:' : 'Category:'}</span>
                    <span className="text-sm font-medium">{resource.category}</span>
                  </div>
                )}

                {resource.status && (
                  <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-gray-600">{language === 'ar' ? 'الحالة:' : 'Status:'}</span>
                    <Badge variant={resource.status === 'active' ? 'default' : 'secondary'}>
                      {language === 'ar' ? 
                        (resource.status === 'active' ? 'نشط' : 
                         resource.status === 'draft' ? 'مسودة' : 
                         resource.status === 'expired' ? 'منتهي الصلاحية' : resource.status) :
                        resource.status
                      }
                    </Badge>
                  </div>
                )}

                {resource.description && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">{language === 'ar' ? 'الوصف:' : 'Description:'}</span>
                    <p className="text-sm text-gray-700 line-clamp-2">{resource.description}</p>
                  </div>
                )}

                <div className={`flex flex-wrap gap-2 pt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  {canManagePolicies && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={`gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    onClick={() => handleEditPolicy(resource)}
                  >
                    <Edit className="h-3 w-3" />
                    {language === 'ar' ? 'تحرير' : 'Edit'}
                  </Button>
                  )}
                  
                  {canManagePolicies && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignDocument(resource)}
                    className={`gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  >
                    <Users className="h-3 w-3" />
                    {language === 'ar' ? 'تعيين' : 'Assign'}
                  </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportDocument(resource)}
                    className={`gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  >
                    <Download className="h-3 w-3" />
                    {language === 'ar' ? 'تصدير' : 'Export'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintPolicy(resource)}
                    className={`gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  >
                    <Printer className="h-3 w-3" />
                    {language === 'ar' ? 'طباعة' : 'Print'}
                  </Button>

                  {canManagePolicies && (
                  <div className="relative">
                    <input
                      type="file"
                      id={`upload-${resource.id}`}
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadUpdate(resource.id, file);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`upload-${resource.id}`)?.click()}
                      className={`gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    >
                      <Upload className="h-3 w-3" />
                      {language === 'ar' ? 'رفع محدث' : 'Re-upload'}
                    </Button>
                  </div>
                  )}

                  {resource.type === 'policy' && canManageGovernance && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGovernancePolicy(resource)}
                      className={`gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    >
                      <BookOpen className="h-3 w-3" />
                      {language === 'ar' ? 'الحوكمة' : 'Governance'}
                    </Button>
                  )}

                  {resource.type === 'policy' && resource.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAttestationPolicy(resource)}
                      className={`gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Attestation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {!loading && filteredResources.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
          </h3>
          <p className="text-gray-600">
            {language === 'ar' ? 'جرب تغيير معايير البحث' : 'Try adjusting your search criteria'}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">127</div>
            <div className="text-sm text-blue-600">{t('totalPolicies')}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-900">98</div>
            <div className="text-sm text-green-600">{t('activePolicies')}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-900">5</div>
            <div className="text-sm text-red-600">{t('expiredPoliciesStat')}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-900">24</div>
            <div className="text-sm text-yellow-600">{t('underReviewStat')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Policy Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {language === 'ar' ? 'تحرير المستند' : 'Edit Document'}
            </DialogTitle>
          </DialogHeader>
          
          {editingPolicy && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">
                    {language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}
                  </Label>
                  <Input
                    id="edit-title"
                    value={editingPolicy.title}
                    onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className={language === 'ar' ? 'text-right' : ''}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-title-ar">
                    {language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}
                  </Label>
                  <Input
                    id="edit-title-ar"
                    value={editingPolicy.title_ar || ''}
                    onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, title_ar: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">
                  {language === 'ar' ? 'الفئة' : 'Category'}
                </Label>
                <Input
                  id="edit-category"
                  value={editingPolicy.category}
                  onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, category: e.target.value } : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingPolicy.description || ''}
                  onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">
                  {language === 'ar' ? 'المحتوى' : 'Content'}
                </Label>
                <Textarea
                  id="edit-content"
                  value={editingPolicy.content}
                  onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={8}
                  className={language === 'ar' ? 'text-right' : ''}
                />
              </div>

              {language === 'ar' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-content-ar">
                    {language === 'ar' ? 'المحتوى (عربي)' : 'Content (Arabic)'}
                  </Label>
                  <Textarea
                    id="edit-content-ar"
                    value={editingPolicy.content_ar || ''}
                    onChange={(e) => setEditingPolicy(prev => prev ? { ...prev, content_ar: e.target.value } : null)}
                    rows={8}
                    className="text-right"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className={`gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <X className="h-4 w-4" />
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={saveEditedPolicy}
              className={`gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <Save className="h-4 w-4" />
              {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Policy Modal */}
      <AddPolicyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPolicyCreated={fetchAllResources}
      />

      {/* Document Assignment Modal */}
      <DocumentAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        document={documentToAssign}
        onAssignmentComplete={fetchAllResources}
      />

      <BulkPolicyUpload
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={() => {
          setIsBulkUploadOpen(false);
          fetchAllResources();
        }}
      />

      <PolicyGovernanceDialog
        policy={governancePolicy}
        open={!!governancePolicy}
        onOpenChange={(open) => {
          if (!open) {
            setGovernancePolicy(null);
          }
        }}
        onUpdated={fetchAllResources}
      />

      <PolicyAttestationDialog
        policy={attestationPolicy}
        open={!!attestationPolicy}
        onOpenChange={(open) => {
          if (!open) {
            setAttestationPolicy(null);
          }
        }}
        onUpdated={fetchAllResources}
      />
    </div>
  );
}

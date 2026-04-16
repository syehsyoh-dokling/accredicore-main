
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Edit, Eye, Copy } from 'lucide-react';
import { usePolicyTemplates } from '@/hooks/usePolicyTemplates';

export const PolicyTemplates = () => {
  const { userRole } = useAuth();
  const { language } = useLanguage();
  const { templates, loading, createTemplate, useTemplate } = usePolicyTemplates();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const [newTemplate, setNewTemplate] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    content: '',
    contentAr: '',
    category: '',
    tags: ''
  });

  const canManageTemplates = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const handleCreateTemplate = async () => {
    const tagsArray = newTemplate.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const success = await createTemplate({
      ...newTemplate,
      tags: tagsArray
    });
    if (success) {
      setIsCreateDialogOpen(false);
      setNewTemplate({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        content: '',
        contentAr: '',
        category: '',
        tags: ''
      });
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    await useTemplate(templateId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {language === 'ar' ? 'قوالب السياسات' : 'Policy Templates'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'مكتبة قوالب السياسات للاستخدام السريع' : 'Policy template library for quick policy creation'}
          </p>
        </div>

        {canManageTemplates && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إنشاء قالب' : 'Create Template'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إنشاء قالب سياسة جديد' : 'Create New Policy Template'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' ? 'أدخل تفاصيل القالب الجديد' : 'Enter the details for the new template'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">{language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}</Label>
                    <Input
                      id="title"
                      value={newTemplate.title}
                      onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="titleAr">{language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}</Label>
                    <Input
                      id="titleAr"
                      value={newTemplate.titleAr}
                      onChange={(e) => setNewTemplate({ ...newTemplate, titleAr: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infection-control">Infection Control</SelectItem>
                      <SelectItem value="quality">Quality Management</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags">{language === 'ar' ? 'العلامات (مفصولة بفاصلة)' : 'Tags (comma separated)'}</Label>
                  <Input
                    id="tags"
                    value={newTemplate.tags}
                    onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                    placeholder="CBAHI, JCI, safety"
                  />
                </div>
                <div>
                  <Label htmlFor="description">{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
                  <Textarea
                    id="description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="content">{language === 'ar' ? 'المحتوى (إنجليزي)' : 'Content (English)'}</Label>
                  <Textarea
                    id="content"
                    rows={8}
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="# Policy Title&#10;&#10;## Purpose&#10;...&#10;&#10;## Procedures&#10;..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTemplate}>
                  {language === 'ar' ? 'إنشاء القالب' : 'Create Template'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-sm">
                    {language === 'ar' && template.title_ar ? template.title_ar : template.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {language === 'ar' && template.description_ar ? template.description_ar : template.description}
                  </CardDescription>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary">{template.category}</Badge>
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'استخدام' : 'Use'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Template Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate && (language === 'ar' && selectedTemplate.title_ar ? selectedTemplate.title_ar : selectedTemplate?.title)}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm">
              {selectedTemplate && (language === 'ar' && selectedTemplate.content_ar ? selectedTemplate.content_ar : selectedTemplate?.content)}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
            {selectedTemplate && (
              <Button onClick={() => handleUseTemplate(selectedTemplate.id)}>
                <Copy className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'استخدام هذا القالب' : 'Use This Template'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

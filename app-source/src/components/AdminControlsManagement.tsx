import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Edit, Search, Filter } from 'lucide-react';

interface Control {
  id: string;
  control_number: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  sub_category: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_standards: string[];
}

export const AdminControlsManagement = () => {
  const { language } = useLanguage();
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const [controls, setControls] = useState<Control[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState('all');
  const [newControl, setNewControl] = useState({
    control_number: '',
    title: '',
    description: '',
    domain: '',
    category: '',
    sub_category: '',
    risk_level: 'medium' as const,
    compliance_standards: [] as string[]
  });

  const canManageControls = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const domains = [
    'Leadership',
    'Human Resources', 
    'Medical Staff',
    'Provision of Care',
    'Nursing',
    'Quality Management',
    'Patient & Family Education',
    'Anesthesia',
    'Operating Room',
    'Intensive Care Units',
    'Emergency Services',
    'Radiology',
    'Laboratory',
    'Medication Management',
    'Infection Prevention & Control',
    'Facility Management & Safety'
  ];

  const riskLevels = [
    { value: 'low', label: language === 'ar' ? 'منخفض' : 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: language === 'ar' ? 'متوسط' : 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: language === 'ar' ? 'عالي' : 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: language === 'ar' ? 'حرج' : 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const handleCreateControl = async () => {
    try {
      // Create control logic would go here
      const controlId = `CTRL-${Date.now()}`;
      const newControlWithId = { ...newControl, id: controlId };
      setControls(prev => [...prev, newControlWithId]);
      
      toast({
        title: language === 'ar' ? 'تم إنشاء المعيار' : 'Control Created',
        description: language === 'ar' ? 'تم إنشاء المعيار بنجاح' : 'Control created successfully',
      });
      
      setShowCreateDialog(false);
      setNewControl({
        control_number: '',
        title: '',
        description: '',
        domain: '',
        category: '',
        sub_category: '',
        risk_level: 'medium',
        compliance_standards: []
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إنشاء المعيار' : 'Failed to create control',
        variant: 'destructive',
      });
    }
  };

  const handleEditControl = async () => {
    if (!selectedControl) return;
    
    try {
      setControls(prev => prev.map(control => 
        control.id === selectedControl.id ? selectedControl : control
      ));
      
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث المعيار بنجاح' : 'Control updated successfully',
      });
      
      setShowEditDialog(false);
      setSelectedControl(null);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث المعيار' : 'Failed to update control',
        variant: 'destructive',
      });
    }
  };

  const getRiskBadge = (risk: string) => {
    const riskInfo = riskLevels.find(r => r.value === risk);
    return (
      <Badge className={riskInfo?.color}>
        {riskInfo?.label}
      </Badge>
    );
  };

  const filteredControls = controls.filter(control =>
    (searchTerm === '' || 
     control.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     control.control_number.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterDomain === 'all' || control.domain === filterDomain)
  );

  if (!canManageControls) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {language === 'ar' ? 'غير مصرح' : 'Access Denied'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'تحتاج صلاحيات إدارية لإدارة المعايير' : 'You need admin privileges to manage controls'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div>
          <h3 className="text-lg font-semibold">
            {language === 'ar' ? 'إدارة المعايير' : 'Controls Management'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'إدارة معايير الامتثال والجودة' : 'Manage compliance and quality controls'}
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {language === 'ar' ? 'إضافة معيار' : 'Add Control'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'إضافة معيار جديد' : 'Add New Control'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'رقم المعيار' : 'Control Number'}</Label>
                  <Input
                    value={newControl.control_number}
                    onChange={(e) => setNewControl({...newControl, control_number: e.target.value})}
                    placeholder="e.g., LD.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'مستوى المخاطر' : 'Risk Level'}</Label>
                  <Select 
                    value={newControl.risk_level} 
                    onValueChange={(value: any) => setNewControl({...newControl, risk_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {riskLevels.map(risk => (
                        <SelectItem key={risk.value} value={risk.value}>
                          {risk.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'عنوان المعيار' : 'Control Title'}</Label>
                <Input
                  value={newControl.title}
                  onChange={(e) => setNewControl({...newControl, title: e.target.value})}
                  placeholder={language === 'ar' ? 'أدخل عنوان المعيار' : 'Enter control title'}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={newControl.description}
                  onChange={(e) => setNewControl({...newControl, description: e.target.value})}
                  placeholder={language === 'ar' ? 'وصف تفصيلي للمعيار' : 'Detailed description of the control'}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'المجال' : 'Domain'}</Label>
                  <Select value={newControl.domain} onValueChange={(value) => setNewControl({...newControl, domain: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر المجال' : 'Select Domain'} />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((domain) => (
                        <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                  <Input
                    value={newControl.category}
                    onChange={(e) => setNewControl({...newControl, category: e.target.value})}
                    placeholder={language === 'ar' ? 'فئة المعيار' : 'Control category'}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الفئة الفرعية' : 'Sub Category'}</Label>
                <Input
                  value={newControl.sub_category}
                  onChange={(e) => setNewControl({...newControl, sub_category: e.target.value})}
                  placeholder={language === 'ar' ? 'الفئة الفرعية' : 'Sub category'}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleCreateControl}>
                  {language === 'ar' ? 'إنشاء' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className={`flex gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1 relative">
              <Search className={`absolute top-3 h-4 w-4 text-gray-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={language === 'ar' ? 'البحث في المعايير...' : 'Search controls...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${language === 'ar' ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={language === 'ar' ? 'تصفية حسب المجال' : 'Filter by Domain'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع المجالات' : 'All Domains'}</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {language === 'ar' ? 'قائمة المعايير' : 'Controls List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'رقم المعيار' : 'Control Number'}</TableHead>
                <TableHead>{language === 'ar' ? 'العنوان' : 'Title'}</TableHead>
                <TableHead>{language === 'ar' ? 'المجال' : 'Domain'}</TableHead>
                <TableHead>{language === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                <TableHead>{language === 'ar' ? 'مستوى المخاطر' : 'Risk Level'}</TableHead>
                <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredControls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {language === 'ar' ? 'لا توجد معايير' : 'No controls found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredControls.map((control) => (
                  <TableRow key={control.id}>
                    <TableCell>
                      <Badge variant="outline">{control.control_number}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="font-medium">{control.title}</div>
                      {control.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {control.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{control.domain}</TableCell>
                    <TableCell>{control.category}</TableCell>
                    <TableCell>{getRiskBadge(control.risk_level)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedControl(control);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Control Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل المعيار' : 'Edit Control'}
            </DialogTitle>
          </DialogHeader>
          {selectedControl && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'رقم المعيار' : 'Control Number'}</Label>
                  <Input
                    value={selectedControl.control_number}
                    onChange={(e) => setSelectedControl({...selectedControl, control_number: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'مستوى المخاطر' : 'Risk Level'}</Label>
                  <Select 
                    value={selectedControl.risk_level} 
                    onValueChange={(value: any) => setSelectedControl({...selectedControl, risk_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {riskLevels.map(risk => (
                        <SelectItem key={risk.value} value={risk.value}>
                          {risk.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'عنوان المعيار' : 'Control Title'}</Label>
                <Input
                  value={selectedControl.title}
                  onChange={(e) => setSelectedControl({...selectedControl, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={selectedControl.description}
                  onChange={(e) => setSelectedControl({...selectedControl, description: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'المجال' : 'Domain'}</Label>
                  <Select 
                    value={selectedControl.domain} 
                    onValueChange={(value) => setSelectedControl({...selectedControl, domain: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((domain) => (
                        <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
                  <Input
                    value={selectedControl.category}
                    onChange={(e) => setSelectedControl({...selectedControl, category: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleEditControl}>
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
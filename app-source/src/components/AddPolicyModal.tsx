import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, FileText, Trash2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicyCreated?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

// National Standards Programs
const nationalPrograms = [
  { id: 'hospitals', nameEn: 'National Standards for Hospitals', nameAr: 'المعايير الوطنية للمستشفيات' },
  { id: 'phc', nameEn: 'National Standards for Public Health Centers (PHC)', nameAr: 'المعايير الوطنية لمراكز الرعاية الصحية الأولية' },
  { id: 'clbb', nameEn: 'National Standards for Clinical Laboratories & Blood Banks (CLBB)', nameAr: 'المعايير الوطنية للمختبرات الطبية وبنوك الدم' },
  { id: 'amb', nameEn: 'National Standards for Ambulatory Care Centers (AMB)', nameAr: 'المعايير الوطنية لمراكز الرعاية التخصصية' },
  { id: 'dental', nameEn: 'National Standards for Dental Centers', nameAr: 'المعايير الوطنية لمراكز طب الأسنان' },
  { id: 'home-health', nameEn: 'National Standards for Home Healthcare Services', nameAr: 'المعايير الوطنية لخدمات الرعاية الصحية المنزلية' },
  { id: 'acs', nameEn: 'National Standards for Acute Coronary Syndrome Services', nameAr: 'المعايير الوطنية لخدمات متلازمة الشريان التاجي الحادة' }
];

// Program Chapters
const programChapters = {
  dental: [
    { code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة' },
    { code: 'PC', nameEn: 'Provision of Care', nameAr: 'معايير تقديم الرعاية' }
  ],
  amb: [
    { code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة' },
    { code: 'PC', nameEn: 'Provision of Care', nameAr: 'معايير تقديم الرعاية' },
    { code: 'LB', nameEn: 'Laboratory', nameAr: 'معايير المختبر' },
    { code: 'RD', nameEn: 'Radiology', nameAr: 'معايير الأشعة' },
    { code: 'DN', nameEn: 'Nutrition', nameAr: 'معايير التغذية' },
    { code: 'MM', nameEn: 'Medication Management', nameAr: 'إدارة الأدوية' },
    { code: 'MOI', nameEn: 'Management of Information', nameAr: 'إدارة المعلومات' },
    { code: 'IPC', nameEn: 'Infection Prevention & Control', nameAr: 'مكافحة العدوى' },
    { code: 'FMS', nameEn: 'Facility Management & Safety', nameAr: 'إدارة المرافق والسلامة' },
    { code: 'DPU', nameEn: 'Dialysis & Pulmonary Unit', nameAr: 'وحدة الغسيل الكلوي والرئوي' },
    { code: 'DA', nameEn: 'Day Ambulatory', nameAr: 'الرعاية النهارية' }
  ],
  hospitals: [
    { code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة' },
    { code: 'HR', nameEn: 'Human Resources', nameAr: 'الموارد البشرية' },
    { code: 'MS', nameEn: 'Medical Staff', nameAr: 'الطاقم الطبي' },
    { code: 'PC', nameEn: 'Provision of Care', nameAr: 'تقديم الرعاية' },
    { code: 'NR', nameEn: 'Nursing', nameAr: 'التمريض' },
    { code: 'QM', nameEn: 'Quality Management', nameAr: 'إدارة الجودة' },
    { code: 'PFE', nameEn: 'Patient & Family Education', nameAr: 'تثقيف المريض والعائلة' },
    { code: 'AN', nameEn: 'Anesthesia', nameAr: 'التخدير' },
    { code: 'OR', nameEn: 'Operating Room', nameAr: 'غرفة العمليات' },
    { code: 'ICU', nameEn: 'Intensive Care Units', nameAr: 'العناية المركزة' },
    { code: 'LD_MATERNITY', nameEn: 'Labor & Delivery', nameAr: 'الولادة والتوليد' },
    { code: 'HM', nameEn: 'Hazardous Materials', nameAr: 'المواد الخطرة' },
    { code: 'ER', nameEn: 'Emergency Services', nameAr: 'خدمات الطوارئ' },
    { code: 'RD', nameEn: 'Radiology', nameAr: 'الأشعة' },
    { code: 'BC', nameEn: 'Blood Collection', nameAr: 'سحب الدم' },
    { code: 'ORT', nameEn: 'Organ & Tissue', nameAr: 'الأعضاء والأنسجة' },
    { code: 'RS', nameEn: 'Rehabilitation Services', nameAr: 'خدمات التأهيل' },
    { code: 'DN', nameEn: 'Nutrition', nameAr: 'التغذية' },
    { code: 'MOI', nameEn: 'Management of Information', nameAr: 'إدارة المعلومات' },
    { code: 'IPC', nameEn: 'Infection Prevention & Control', nameAr: 'مكافحة العدوى' },
    { code: 'MM', nameEn: 'Medication Management', nameAr: 'إدارة الأدوية' },
    { code: 'LB', nameEn: 'Laboratory', nameAr: 'المختبر' },
    { code: 'FMS', nameEn: 'Facility Management & Safety', nameAr: 'إدارة المرافق والسلامة' }
  ],
  phc: [
    { code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة' },
    { code: 'PC', nameEn: 'Provision of Care', nameAr: 'تقديم الرعاية' },
    { code: 'MM', nameEn: 'Medication Management', nameAr: 'إدارة الأدوية' },
    { code: 'IPC', nameEn: 'Infection Prevention & Control', nameAr: 'مكافحة العدوى' },
    { code: 'FMS', nameEn: 'Facility Management & Safety', nameAr: 'إدارة المرافق والسلامة' }
  ],
  clbb: [
    { code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة' },
    { code: 'LB', nameEn: 'Laboratory', nameAr: 'المختبر' },
    { code: 'BB', nameEn: 'Blood Bank', nameAr: 'بنك الدم' },
    { code: 'IPC', nameEn: 'Infection Prevention & Control', nameAr: 'مكافحة العدوى' },
    { code: 'FMS', nameEn: 'Facility Management & Safety', nameAr: 'إدارة المرافق والسلامة' }
  ],
  'home-health': [
    { code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة' },
    { code: 'PC', nameEn: 'Provision of Care', nameAr: 'تقديم الرعاية' },
    { code: 'MM', nameEn: 'Medication Management', nameAr: 'إدارة الأدوية' },
    { code: 'IPC', nameEn: 'Infection Prevention & Control', nameAr: 'مكافحة العدوى' }
  ],
  acs: [
    { code: 'LD', nameEn: 'Leadership', nameAr: 'معايير القيادة' },
    { code: 'PC', nameEn: 'Provision of Care', nameAr: 'تقديم الرعاية' },
    { code: 'ER', nameEn: 'Emergency Services', nameAr: 'خدمات الطوارئ' },
    { code: 'ICU', nameEn: 'Intensive Care Units', nameAr: 'العناية المركزة' }
  ]
};

export function AddPolicyModal({ isOpen, onClose, onPolicyCreated }: AddPolicyModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    accreditationType: '',
    nationalProgram: '',
    chapter: '',
    documentType: '',
    category: '',
    description: '',
    owner: '',
    reviewCycle: '',
    complianceStandards: [] as string[]
  });

  const [newStandard, setNewStandard] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accreditationTypes = [
    'CBAHI - Saudi Central Board For Accreditation Of Healthcare Institutions',
    'SCFHS - الهيئة السعودية للتخصصات الصحية',
    'JCI - Joint Commission International',
    'ISO 9001 - Quality Management',
    'ISO 27001 - Information Security',
    'Risk Management - إدارة المخاطر',
    'OSHA - Occupational Safety'
  ];

  const chapters = [
    'Chapter 1: Governance and Leadership',
    'Chapter 2: Patient Safety',
    'Chapter 3: Infection Prevention and Control',
    'Chapter 4: Medication Management',
    'Chapter 5: Clinical Care',
    'Chapter 6: Human Resources',
    'Chapter 7: Information Management',
    'Chapter 8: Facility Management'
  ];

  const documentTypes = [
    'Policy - سياسة',
    'Procedure - إجراء',
    'Form - نموذج',
    'Plan - خطة',
    'Assessment Tool - أداة تقييم',
    'Training Material - مادة تدريبية',
    'Checklist - قائمة مراجعة',
    'Guidelines - إرشادات'
  ];

  const getAvailableChapters = () => {
    if (!formData.nationalProgram) return [];
    return programChapters[formData.nationalProgram as keyof typeof programChapters] || [];
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const addComplianceStandard = () => {
    if (newStandard && !formData.complianceStandards.includes(newStandard)) {
      setFormData(prev => ({
        ...prev,
        complianceStandards: [...prev.complianceStandards, newStandard]
      }));
      setNewStandard('');
    }
  };

  const removeStandard = (standard: string) => {
    setFormData(prev => ({
      ...prev,
      complianceStandards: prev.complianceStandards.filter(s => s !== standard)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a policy",
          variant: "destructive",
        });
        return;
      }

      // Prepare content from uploaded files (simplified - in real app you'd store file URLs)
      let content = formData.description || '';
      if (uploadedFiles.length > 0) {
        content += '\n\nAttached Files:\n' + uploadedFiles.map(f => f.name).join('\n');
      }

      // Create policy object
      const policyData = {
        title: formData.title || formData.titleEn,
        description: formData.description,
        content: content,
        category: formData.nationalProgram || formData.documentType || 'general',
        status: 'draft',
        created_by: user.id,
      };

      // Insert policy into database
      const { data, error } = await supabase
        .from('policies')
        .insert([policyData])
        .select();

      if (error) {
        console.error('Error creating policy:', error);
        toast({
          title: "Error",
          description: "Failed to create policy. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // If files were uploaded, you would upload them to storage here
      // For now, we'll just log them
      if (uploadedFiles.length > 0) {
        console.log('Files to upload:', uploadedFiles);
        // TODO: Upload files to Supabase storage
      }

      toast({
        title: "Success",
        description: "Policy created successfully!",
      });

      // Reset form
      setFormData({
        title: '',
        titleEn: '',
        accreditationType: '',
        nationalProgram: '',
        chapter: '',
        documentType: '',
        category: '',
        description: '',
        owner: '',
        reviewCycle: '',
        complianceStandards: []
      });
      setUploadedFiles([]);
      
      // Call refresh callback if provided
      if (onPolicyCreated) {
        onPolicyCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Policy Document</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Policy Title (Arabic)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان السياسة بالعربية"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="titleEn">Policy Title (English)</Label>
              <Input
                id="titleEn"
                value={formData.titleEn}
                onChange={(e) => setFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                placeholder="Policy title in English"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Accreditation Type</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, accreditationType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select accreditation" />
                </SelectTrigger>
                <SelectContent>
                  {accreditationTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* National Standards Category Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">National Standards Category</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>National Standards Program</Label>
                <Select 
                  onValueChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      nationalProgram: value,
                      chapter: '' // Reset chapter when program changes
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalPrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        <div>
                          <div className="font-medium">{program.nameAr}</div>
                          <div className="text-sm text-gray-500">{program.nameEn}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chapter</Label>
                <Select 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, chapter: value }))}
                  disabled={!formData.nationalProgram}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.nationalProgram ? "Select chapter" : "Select program first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableChapters().map((chapter) => (
                      <SelectItem key={chapter.code} value={chapter.code}>
                        <div>
                          <div className="font-medium">{chapter.code} - {chapter.nameAr}</div>
                          <div className="text-sm text-gray-500">{chapter.nameEn}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.nationalProgram && formData.chapter && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100">
                    {formData.nationalProgram.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-green-100">
                    {formData.chapter}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Policy will be categorized under: {nationalPrograms.find(p => p.id === formData.nationalProgram)?.nameAr} → {getAvailableChapters().find(c => c.code === formData.chapter)?.nameAr}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Document Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="Dr. Ahmed Al-Mohammed"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reviewCycle">Review Cycle (months)</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, reviewCycle: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select review cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="18">18 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the policy..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Compliance Standards</Label>
            <div className="flex gap-2">
              <Input
                value={newStandard}
                onChange={(e) => setNewStandard(e.target.value)}
                placeholder="Add compliance standard"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComplianceStandard())}
              />
              <Button type="button" onClick={addComplianceStandard} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.complianceStandards.map((standard) => (
                <Badge key={standard} variant="secondary" className="gap-1">
                  {standard}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeStandard(standard)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-2">
            <Label>Upload Documents</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop files here or click to upload
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PDF, DOC, DOCX, XLS, XLSX up to 10MB each
                  </span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium">Uploaded Files:</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Policy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from 'lucide-react';

interface AddUserDialogProps {
  onUserAdded: () => void;
}

export function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'user',
    department: ''
  });

  const roles = [
    { value: 'user', label: t('user') || 'User', labelAr: 'مستخدم' },
    { value: 'developer', label: language === 'ar' ? 'مطور' : 'Developer', labelAr: 'مطور' },
    { value: 'admin', label: t('admin') || 'Admin', labelAr: 'مشرف' },
    { value: 'super_user', label: t('superUser') || 'Super User', labelAr: 'مستخدم متقدم' }
  ];

  const departments = [
    { value: 'quality', label: 'Quality Management', labelAr: 'إدارة الجودة' },
    { value: 'infection-control', label: 'Infection Control', labelAr: 'مكافحة العدوى' },
    { value: 'safety', label: 'Safety', labelAr: 'السلامة' },
    { value: 'it', label: 'Information Technology', labelAr: 'تقنية المعلومات' },
    { value: 'nursing', label: 'Nursing', labelAr: 'التمريض' },
    { value: 'medical', label: 'Medical', labelAr: 'طبي' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call secure Edge Function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          department: formData.department
        }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Success',
        description: `User ${formData.fullName} has been created successfully`
      });

      setFormData({ email: '', fullName: '', role: 'user', department: '' });
      setOpen(false);
      onUserAdded();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={`gap-2 bg-blue-600 hover:bg-blue-700 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Plus className="h-4 w-4" />
          {t('addNewUser') || 'Add New User'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            {t('addNewUser') || 'Add New User'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className={language === 'ar' ? 'text-right block' : ''}>
              {t('email') || 'Email'}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={language === 'ar' ? 'text-right' : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className={language === 'ar' ? 'text-right block' : ''}>
              {t('fullName') || 'Full Name'}
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={language === 'ar' ? 'text-right' : ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className={language === 'ar' ? 'text-right block' : ''}>
              {t('role') || 'Role'}
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectRole') || 'Select role'} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {language === 'ar' ? role.labelAr : role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={language === 'ar' ? 'text-right block' : ''}>
              {t('department') || 'Department'}
            </Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectDepartment') || 'Select department'} />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {language === 'ar' ? dept.labelAr : dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('createUser') || 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

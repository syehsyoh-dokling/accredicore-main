
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  nameEn: string;
  nameAr: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string;
  permissions: string[];
}

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate: (updatedUser: User & { newPassword?: string }) => void;
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdate }: EditUserDialogProps) {
  const { t, language, dir } = useLanguage();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [newPassword, setNewPassword] = React.useState('');
  
  const isAdmin = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const form = useForm({
    defaultValues: {
      nameEn: user?.nameEn || '',
      nameAr: user?.nameAr || '',
      email: user?.email || '',
      role: user?.role || '',
      department: user?.department || '',
      status: user?.status || '',
      permissions: user?.permissions || []
    }
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        nameEn: user.nameEn,
        nameAr: user.nameAr,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        permissions: user.permissions
      });
    }
  }, [user, form]);

  const onSubmit = (data: any) => {
    if (!user) return;

    const updatedUser: User & { newPassword?: string } = {
      ...user,
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      name: language === 'ar' ? data.nameAr : data.nameEn,
      email: data.email,
      role: data.role,
      department: data.department,
      status: data.status,
      permissions: data.permissions,
      newPassword: newPassword || undefined
    };

    onUserUpdate(updatedUser);
    onOpenChange(false);
    setNewPassword('');
    
    toast({
      title: t('userUpdated'),
      description: t('userUpdatedSuccess'),
    });
  };

  const roles = [
    { value: 'system_admin', label: language === 'ar' ? 'مدير النظام' : 'System Admin' },
    { value: 'super_user', label: language === 'ar' ? 'مستخدم متقدم' : 'Super User' },
    { value: 'admin', label: language === 'ar' ? 'مدير' : 'Admin' },
    { value: 'developer', label: language === 'ar' ? 'مطور' : 'Developer' },
    { value: 'user', label: language === 'ar' ? 'مستخدم' : 'User' },
    { value: 'team', label: language === 'ar' ? 'فريق' : 'Team' },
    { value: 'client', label: language === 'ar' ? 'عميل' : 'Client' },
  ];

  const departments = [
    { value: language === 'ar' ? 'إدارة الجودة' : 'Quality Management', label: t('qualityManagement') },
    { value: language === 'ar' ? 'مكافحة العدوى' : 'Infection Control', label: t('infectionControl') },
    { value: language === 'ar' ? 'السلامة والأمان' : 'Safety & Security', label: t('safetyAndSecurity') },
    { value: language === 'ar' ? 'تقنية المعلومات' : 'Information Technology', label: t('informationTechnology') },
  ];

  const permissionsList = language === 'ar' ? 
    ['قراءة', 'كتابة', 'تصدير', 'إدارة'] : 
    ['Read', 'Write', 'Export', 'Admin'];

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir={dir}>
        <DialogHeader>
          <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
            {t('editUser')}
          </DialogTitle>
          <DialogDescription className={language === 'ar' ? 'text-right' : 'text-left'}>
            {t('editUserDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameEnglish')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('nameArabic')}</FormLabel>
                    <FormControl>
                      <Input {...field} className={language === 'ar' ? 'text-right' : ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Reset - Admin Only */}
            {isAdmin && (
              <FormItem>
                <FormLabel>
                  {language === 'ar' ? 'كلمة مرور جديدة (اختياري)' : 'New Password (Optional)'}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'اترك فارغاً لعدم التغيير' : 'Leave blank to keep unchanged'}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'سيتم تعيين كلمة مرور جديدة لهذا المستخدم' : 'New password will be set for this user'}
                </p>
              </FormItem>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('role')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectRole')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('department')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectDepartment')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className={`flex items-center justify-between rounded-lg border p-3 shadow-sm ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={`space-y-0.5 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <FormLabel>{t('accountStatus')}</FormLabel>
                    <div className="text-sm text-gray-500">
                      {field.value === 'نشط' || field.value === 'Active' ? t('active') : t('inactiveUsers').replace('المستخدمين ', '').replace('Users', '')}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 'نشط' || field.value === 'Active'}
                      onCheckedChange={(checked) => {
                        field.onChange(checked ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'متوقف' : 'Inactive'));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-base font-medium">{t('permissions')}</FormLabel>
              <div className={`grid grid-cols-2 gap-2 mt-2 ${language === 'ar' ? 'text-right' : ''}`}>
                {permissionsList.map((permission) => (
                  <FormField
                    key={permission}
                    control={form.control}
                    name="permissions"
                    render={({ field }) => (
                      <FormItem className={`flex items-center space-x-2 space-y-0 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <FormControl>
                          <Switch
                            checked={field.value?.includes(permission)}
                            onCheckedChange={(checked) => {
                              const updatedPermissions = checked
                                ? [...(field.value || []), permission]
                                : (field.value || []).filter((p: string) => p !== permission);
                              field.onChange(updatedPermissions);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {permission}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {t('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

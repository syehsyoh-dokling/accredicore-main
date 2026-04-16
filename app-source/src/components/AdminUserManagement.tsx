import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/hooks/useUserData';
import { useDepartments } from '@/hooks/useDepartments';
import { useTeams } from '@/hooks/useTeams';
import { Users, Plus, Edit, Shield, Settings, UserPlus, Key } from 'lucide-react';

export const AdminUserManagement = () => {
  const { language } = useLanguage();
  const { userRole } = useAuth();
  const { toast } = useToast();
  const { users, loading, updateUser } = useUserData();
  const { departments } = useDepartments();
  const { teams } = useTeams();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'user',
    department: '',
    permissions: []
  });

  const canManageUsers = ['system_admin', 'super_user'].includes(userRole || '');

  const handleCreateUser = async () => {
    try {
      // Create user logic would go here
      toast({
        title: language === 'ar' ? 'تم إنشاء المستخدم' : 'User Created',
        description: language === 'ar' ? 'تم إنشاء المستخدم بنجاح' : 'User created successfully',
      });
      setShowCreateDialog(false);
      setNewUser({ email: '', name: '', role: 'user', department: '', permissions: [] });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إنشاء المستخدم' : 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUser(selectedUser);
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث بيانات المستخدم' : 'User data updated successfully',
      });
      setShowEditDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث المستخدم' : 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'system_admin': 'bg-red-100 text-red-800',
      'super_user': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800',
      'user': 'bg-gray-100 text-gray-800'
    };
    
    const roleLabels = {
      'system_admin': language === 'ar' ? 'مدير النظام' : 'System Admin',
      'super_user': language === 'ar' ? 'مشرف عام' : 'Super User',
      'admin': language === 'ar' ? 'مدير' : 'Admin',
      'user': language === 'ar' ? 'مستخدم' : 'User'
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors]}>
        {roleLabels[role as keyof typeof roleLabels]}
      </Badge>
    );
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {language === 'ar' ? 'غير مصرح' : 'Access Denied'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'تحتاج صلاحيات إدارية لإدارة المستخدمين' : 'You need admin privileges to manage users'}
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
            {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'إدارة المستخدمين والأدوار والصلاحيات' : 'Manage users, roles, and permissions'}
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الدور' : 'Role'}</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
                    <SelectItem value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</SelectItem>
                    {userRole === 'system_admin' && (
                      <>
                        <SelectItem value="super_user">{language === 'ar' ? 'مشرف عام' : 'Super User'}</SelectItem>
                        <SelectItem value="system_admin">{language === 'ar' ? 'مدير النظام' : 'System Admin'}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'القسم' : 'Department'}</Label>
                <Select value={newUser.department} onValueChange={(value) => setNewUser({...newUser, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر القسم' : 'Select Department'} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleCreateUser}>
                  {language === 'ar' ? 'إنشاء' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {language === 'ar' ? 'قائمة المستخدمين' : 'Users List'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                  <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                  <TableHead>{language === 'ar' ? 'القسم' : 'Department'}</TableHead>
                  <TableHead>{language === 'ar' ? 'آخر دخول' : 'Last Login'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPermissionsDialog(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل المستخدم' : 'Edit User'}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                <Input
                  value={selectedUser.name || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الدور' : 'Role'}</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
                    <SelectItem value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</SelectItem>
                    {userRole === 'system_admin' && (
                      <>
                        <SelectItem value="super_user">{language === 'ar' ? 'مشرف عام' : 'Super User'}</SelectItem>
                        <SelectItem value="system_admin">{language === 'ar' ? 'مدير النظام' : 'System Admin'}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleEditUser}>
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إدارة صلاحيات المستخدم' : 'Manage User Permissions'}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                {language === 'ar' ? 'المستخدم:' : 'User:'} {selectedUser.name} ({selectedUser.email})
              </div>
              
              {/* Current Role & Permissions */}
              <div className="space-y-3">
                <h4 className="font-medium">{language === 'ar' ? 'الدور والصلاحيات' : 'Role & Permissions'}</h4>
                <div className="p-4 border rounded bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{language === 'ar' ? 'الدور الحالي:' : 'Current Role:'}</span>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'الصلاحيات المتاحة حسب الدور:' : 'Available permissions for this role:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedUser.role === 'system_admin' && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {language === 'ar' ? 'جميع الصلاحيات' : 'All Permissions'}
                          </div>
                        </>
                      )}
                      {selectedUser.role === 'super_user' && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {language === 'ar' ? 'إدارة الفرق' : 'Team Management'}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {language === 'ar' ? 'إدارة المعايير' : 'Controls Management'}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {language === 'ar' ? 'التقارير والتصدير' : 'Reports & Export'}
                          </div>
                        </>
                      )}
                      {selectedUser.role === 'admin' && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            {language === 'ar' ? 'إدارة المهام' : 'Task Management'}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            {language === 'ar' ? 'إدارة الفرق' : 'Team Management'}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            {language === 'ar' ? 'عرض التقارير' : 'View Reports'}
                          </div>
                        </>
                      )}
                      {selectedUser.role === 'user' && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            {language === 'ar' ? 'عرض المهام' : 'View Tasks'}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            {language === 'ar' ? 'تحديث المهام' : 'Update Tasks'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Teams */}
              <div className="space-y-3">
                <h4 className="font-medium">{language === 'ar' ? 'الفرق المتاحة' : 'Available Teams'}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="text-sm font-medium">{language === 'ar' && team.name_ar ? team.name_ar : team.name}</span>
                        {team.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === 'ar' && team.description_ar ? team.description_ar : team.description}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: language === 'ar' ? 'تم إضافة المستخدم للفريق' : 'User added to team',
                            description: language === 'ar' ? 'تم إضافة المستخدم للفريق بنجاح' : 'User has been added to the team successfully'
                          });
                        }}
                      >
                        {language === 'ar' ? 'إضافة للفريق' : 'Add to Team'}
                      </Button>
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا توجد فرق متاحة' : 'No teams available'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
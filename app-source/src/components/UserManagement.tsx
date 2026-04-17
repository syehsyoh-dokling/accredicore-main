
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserCheck, UserX, Settings, Shield, Edit, LogOut } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";
import { EditUserDialog } from "./EditUserDialog";
import { AddUserDialog } from "./AddUserDialog";
import { Skeleton } from "@/components/ui/skeleton";

export function UserManagement() {
  const { t, language, dir } = useLanguage();
  const { user, signOut, userRole } = useAuth();
  const { users, loading, updateUser, refetch } = useUserData();
  const [selectedUser, setSelectedUser] = React.useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const canManageUsers = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const handleEditUser = (userToEdit: any) => {
    setSelectedUser(userToEdit);
    setIsEditDialogOpen(true);
  };

  const handleUserUpdate = async (updatedUser: any) => {
    const result = await updateUser(updatedUser);
    if (result.success) {
      console.log('User updated successfully');
    }
  };

  // Filter users based on search and filters
  const filteredUsers = React.useMemo(() => {
    return users.filter(u => {
      const matchesSearch = searchQuery === '' || 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        u.status.toLowerCase() === statusFilter.toLowerCase() ||
        (statusFilter === 'active' && (u.status === 'Active' || u.status === 'نشط'));
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const roles = [
    { 
      name: t('qualityManager'), 
      permissions: 15, 
      users: users.filter(u => u.role.includes('Quality') || u.role.includes('مدير')).length
    },
    { 
      name: t('infectionControlSpecialist'), 
      permissions: 8, 
      users: users.filter(u => u.role.includes('Infection') || u.role.includes('العدوى')).length
    },
    { 
      name: t('safetyEngineer'), 
      permissions: 6, 
      users: users.filter(u => u.role.includes('Safety') || u.role.includes('سلامة')).length
    },
    { 
      name: t('itManager'), 
      permissions: 12, 
      users: users.filter(u => u.role.includes('IT') || u.role.includes('تقنية')).length
    },
    { 
      name: t('internalAuditor'), 
      permissions: 10, 
      users: users.filter(u => u.role === 'user').length
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusKey = status === 'نشط' || status === 'Active' ? 'active' : 
                     status === 'متوقف' || status === 'Inactive' ? 'inactive' : 'suspended';
    
    const variants = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'suspended': 'bg-yellow-100 text-yellow-800'
    };
    
    const displayStatus = statusKey === 'active' ? t('active') : 
                         statusKey === 'inactive' ? t('inactiveUsers').replace('المستخدمين ', '').replace('Users', '') : 
                         t('suspended');
    
    return (
      <Badge className={`${variants[statusKey]} text-xs`}>
        {displayStatus}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6" dir={dir}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-64" dir={dir}>
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {language === 'ar' ? 'ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ùƒ Ø¨Ø§Ù„ÙˆØµÙˆÙ„' : 'Access Denied'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar'
              ? 'ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ù…Ø¯ÙŠØ± Ù„Ù„ÙˆØµÙˆÙ„ Ù„Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø©'
              : 'You must be an admin to access this panel'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={dir}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('userManagementTitle')}</h2>
          <p className="text-gray-600 mt-1 text-sm md:text-base">{t('userManagementDesc')}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">Logged in as: {user?.email}</Badge>
            <Badge variant="outline" className="text-xs">Role: {userRole}</Badge>
            <Button size="sm" variant="outline" onClick={signOut} className="gap-2 text-xs">
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
        <AddUserDialog onUserAdded={refetch} />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className={`flex flex-col sm:flex-row gap-4 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
            <div className="relative flex-1">
              <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
              <Input 
                placeholder={t('searchUsers')} 
                className={`${language === 'ar' ? 'pr-10 text-right' : 'pl-10'} text-sm`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allRoles')}</SelectItem>
                <SelectItem value="system_admin">{language === 'ar' ? 'مدير النظام' : 'System Admin'}</SelectItem>
                <SelectItem value="super_user">{language === 'ar' ? 'مستخدم متقدم' : 'Super User'}</SelectItem>
                <SelectItem value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</SelectItem>
                <SelectItem value="user">{language === 'ar' ? 'مستخدم' : 'User'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{language === 'ar' ? 'متوقف' : 'Inactive'}</SelectItem>
                <SelectItem value="suspended">{t('suspended')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-base md:text-lg ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Shield className="h-5 w-5 text-blue-600" />
            {t('usersList')} ({filteredUsers.length} {language === 'ar' ? 'من' : 'of'} {users.length} users)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </div>
            ) : (
              filteredUsers.map((user) => (
              <div key={user.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
                <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1 ${language === 'ar' ? 'sm:flex-row-reverse sm:justify-end' : ''}`}>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base">{user.name}</h3>
                    <Badge className="bg-green-100 text-green-800 text-xs w-fit">
                      {user.status}
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 mb-2">{user.email}</p>
                  
                  <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
                    <span><strong>{t('role')}:</strong> {user.role}</span>
                    <span><strong>{t('department')}:</strong> {user.department}</span>
                    <span className="hidden sm:inline"><strong>{t('lastLogin')}:</strong> {user.lastLogin}</span>
                  </div>
                  
                  <div className={`flex flex-wrap gap-1 mt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    {user.permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                    {user.permissions.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{user.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={`gap-2 text-xs ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="h-3 w-3" />
                    <span className="hidden sm:inline">{t('edit')}</span>
                  </Button>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics and Roles sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className={`text-base md:text-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('rolesManagement')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roles.map((role, index) => (
                <div key={index} className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                    <h4 className="font-medium text-gray-900 text-sm md:text-base">{role.name}</h4>
                    <p className="text-xs md:text-sm text-gray-600">
                      {role.permissions} {t('permissions')} • {role.users} {t('users')}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs">
                    {t('edit')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`text-base md:text-lg ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t('userStatistics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex justify-between items-center p-3 bg-green-50 rounded-lg ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="text-green-700 text-sm md:text-base">{t('activeUsers')}</span>
                <span className="text-xl md:text-2xl font-bold text-green-900">{users.length}</span>
              </div>
              <div className={`flex justify-between items-center p-3 bg-red-50 rounded-lg ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="text-red-700 text-sm md:text-base">{t('inactiveUsers')}</span>
                <span className="text-xl md:text-2xl font-bold text-red-900">0</span>
              </div>
              <div className={`flex justify-between items-center p-3 bg-blue-50 rounded-lg ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="text-blue-700 text-sm md:text-base">{t('definedRoles')}</span>
                <span className="text-xl md:text-2xl font-bold text-blue-900">4</span>
              </div>
              <div className={`flex justify-between items-center p-3 bg-yellow-50 rounded-lg ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="text-yellow-700 text-sm md:text-base">{t('pendingAccessRequests')}</span>
                <span className="text-xl md:text-2xl font-bold text-yellow-900">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditUserDialog
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}

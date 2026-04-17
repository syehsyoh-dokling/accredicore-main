
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Plus, Settings, UserPlus, Edit, Trash2, MoreVertical, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTeams } from '@/hooks/useTeams';

export const TeamManagement = () => {
  const { userRole } = useAuth();
  const { language, t } = useLanguage();
  const { teams, loading, createTeam, updateTeam, deleteTeam, addTeamMember } = useTeams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const [newTeam, setNewTeam] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    department: ''
  });

  const [editTeam, setEditTeam] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    department: ''
  });

  const [newMember, setNewMember] = useState({
    email: '',
    role: 'member'
  });

  const canManageTeams = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  const handleCreateTeam = async () => {
    const success = await createTeam(newTeam);
    if (success) {
      setIsCreateDialogOpen(false);
      setNewTeam({ name: '', nameAr: '', description: '', descriptionAr: '', department: '' });
    }
  };

  const handleEditTeam = (team: any) => {
    setEditTeam({
      name: team.name || '',
      nameAr: team.name_ar || '',
      description: team.description || '',
      descriptionAr: team.description_ar || '',
      department: team.department || ''
    });
    setSelectedTeamId(team.id);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTeam = async () => {
    if (selectedTeamId) {
      const success = await updateTeam(selectedTeamId, editTeam);
      if (success) {
        setIsEditDialogOpen(false);
        setEditTeam({ name: '', nameAr: '', description: '', descriptionAr: '', department: '' });
        setSelectedTeamId(null);
      }
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    await deleteTeam(teamId);
  };

  const handleAddMember = async () => {
    if (selectedTeamId) {
      const success = await addTeamMember(selectedTeamId, newMember.email, newMember.role);
      if (success) {
        setIsAddMemberDialogOpen(false);
        setNewMember({ email: '', role: 'member' });
        setSelectedTeamId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!canManageTeams) {
    return (
      <div className="flex items-center justify-center h-64">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {language === 'ar' ? 'إدارة الفرق' : 'Team Management'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة الفرق وأعضائها' : 'Manage teams and their members'}
          </p>
        </div>

        {canManageTeams && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إنشاء فريق' : 'Create Team'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إنشاء فريق جديد' : 'Create New Team'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' ? 'أدخل تفاصيل الفريق الجديد' : 'Enter the details for the new team'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{language === 'ar' ? 'اسم الفريق (إنجليزي)' : 'Team Name (English)'}</Label>
                  <Input
                    id="name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل اسم الفريق' : 'Enter team name'}
                  />
                </div>
                <div>
                  <Label htmlFor="nameAr">{language === 'ar' ? 'اسم الفريق (عربي)' : 'Team Name (Arabic)'}</Label>
                  <Input
                    id="nameAr"
                    value={newTeam.nameAr}
                    onChange={(e) => setNewTeam({ ...newTeam, nameAr: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل اسم الفريق بالعربية' : 'Enter team name in Arabic'}
                  />
                </div>
                <div>
                  <Label htmlFor="department">{language === 'ar' ? 'القسم' : 'Department'}</Label>
                  <Select value={newTeam.department} onValueChange={(value) => setNewTeam({ ...newTeam, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر القسم' : 'Select department'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quality">Quality Management</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="infection-control">Infection Control</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                  <Textarea
                    id="description"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل وصف الفريق' : 'Enter team description'}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTeam}>
                  {language === 'ar' ? 'إنشاء الفريق' : 'Create Team'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'ar' && team.name_ar ? team.name_ar : team.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {canManageTeams && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'تعديل' : 'Edit'}
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'ar' 
                                ? 'هل أنت متأكد من حذف هذا الفريق؟ سيتم إلغاء تفعيل جميع أعضاء الفريق أيضًا.'
                                : 'Are you sure you want to delete this team? All team members will also be deactivated.'
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTeam(team.id)}>
                              {language === 'ar' ? 'حذف' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' && team.description_ar ? team.description_ar : team.description}
                </p>
                {team.department && (
                  <Badge variant="secondary">{team.department}</Badge>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {team.member_count || 0} {language === 'ar' ? 'عضو' : 'members'}
                  </span>
                  {canManageTeams && (
                    <Dialog open={isAddMemberDialogOpen && selectedTeamId === team.id} onOpenChange={(open) => {
                      setIsAddMemberDialogOpen(open);
                      if (!open) setSelectedTeamId(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTeamId(team.id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {language === 'ar' ? 'إضافة عضو للفريق' : 'Add Team Member'}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newMember.email}
                              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                              placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">{language === 'ar' ? 'الدور' : 'Role'}</Label>
                            <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">{language === 'ar' ? 'عضو' : 'Member'}</SelectItem>
                                <SelectItem value="lead">{language === 'ar' ? 'قائد' : 'Lead'}</SelectItem>
                                <SelectItem value="admin">{language === 'ar' ? 'مدير' : 'Admin'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddMember}>
                            {language === 'ar' ? 'إضافة العضو' : 'Add Member'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل الفريق' : 'Edit Team'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'تعديل تفاصيل الفريق' : 'Update the team details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{language === 'ar' ? 'اسم الفريق (إنجليزي)' : 'Team Name (English)'}</Label>
              <Input
                id="edit-name"
                value={editTeam.name}
                onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل اسم الفريق' : 'Enter team name'}
              />
            </div>
            <div>
              <Label htmlFor="edit-nameAr">{language === 'ar' ? 'اسم الفريق (عربي)' : 'Team Name (Arabic)'}</Label>
              <Input
                id="edit-nameAr"
                value={editTeam.nameAr}
                onChange={(e) => setEditTeam({ ...editTeam, nameAr: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل اسم الفريق بالعربية' : 'Enter team name in Arabic'}
              />
            </div>
            <div>
              <Label htmlFor="edit-department">{language === 'ar' ? 'القسم' : 'Department'}</Label>
              <Select value={editTeam.department} onValueChange={(value) => setEditTeam({ ...editTeam, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر القسم' : 'Select department'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Quality Management</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="infection-control">Infection Control</SelectItem>
                  <SelectItem value="it">Information Technology</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
              <Textarea
                id="edit-description"
                value={editTeam.description}
                onChange={(e) => setEditTeam({ ...editTeam, description: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل وصف الفريق' : 'Enter team description'}
              />
            </div>
            <div>
              <Label htmlFor="edit-descriptionAr">{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
              <Textarea
                id="edit-descriptionAr"
                value={editTeam.descriptionAr}
                onChange={(e) => setEditTeam({ ...editTeam, descriptionAr: e.target.value })}
                placeholder={language === 'ar' ? 'أدخل وصف الفريق بالعربية' : 'Enter team description in Arabic'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateTeam}>
              {language === 'ar' ? 'تحديث الفريق' : 'Update Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

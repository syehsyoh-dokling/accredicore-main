import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Settings, 
  Shield, 
  Activity, 
  Database, 
  FileText, 
  BarChart3, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  Bell,
  Mail,
  Globe,
  Key
} from 'lucide-react';

export const AdminPanel = () => {
  const { userRole } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { logs, loading: auditLogsLoading } = useAuditLogs(25);

  const isAdmin = ['system_admin', 'super_user', 'admin'].includes(userRole || '');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            {language === 'ar' ? 'غير مصرح لك بالوصول' : 'Access Denied'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {language === 'ar' ? 'يجب أن تكون مدير للوصول لهذه الصفحة' : 'You must be an admin to access this panel'}
          </p>
        </div>
      </div>
    );
  }

  const handleSystemAction = (action: string) => {
    toast({
      title: language === 'ar' ? 'تم تنفيذ العملية' : 'Action Executed',
      description: language === 'ar' ? `تم تنفيذ ${action} بنجاح` : `${action} executed successfully`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'إدارة شاملة للنظام والمستخدمين والإعدادات' : 'Comprehensive system, user, and settings management'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </TabsTrigger>
          <TabsTrigger value="user-management">
            <Users className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'المستخدمين' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="system-settings">
            <Settings className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </TabsTrigger>
          <TabsTrigger value="audit-logs">
            <Activity className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'السجلات' : 'Audit Logs'}
          </TabsTrigger>
          <TabsTrigger value="backup-restore">
            <Database className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'النسخ الاحتياطي' : 'Backup'}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'الأمان' : 'Security'}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245</div>
                <p className="text-xs text-muted-foreground">
                  +12% {language === 'ar' ? 'من الشهر الماضي' : 'from last month'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'جلسات نشطة' : 'Active Sessions'}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'المستخدمين المتصلين الآن' : 'users online now'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'حالة النظام' : 'System Health'}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'وقت التشغيل' : 'uptime'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'ar' ? 'أنشطة اليوم' : 'Today\'s Activities'}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'إجراء تم تنفيذه' : 'actions performed'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Performance */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'أداء النظام' : 'System Performance'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'استخدام المعالج' : 'CPU Usage'}</span>
                    <span>34%</span>
                  </div>
                  <Progress value={34} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'استخدام الذاكرة' : 'Memory Usage'}</span>
                    <span>67%</span>
                  </div>
                  <Progress value={67} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'ar' ? 'مساحة التخزين' : 'Storage Usage'}</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'الأنشطة الحديثة' : 'Recent Activities'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {language === 'ar' ? 'تسجيل دخول مستخدم جديد' : 'New user login'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'منذ 5 دقائق' : '5 minutes ago'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {language === 'ar' ? 'تحديث إعدادات النظام' : 'System settings updated'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'منذ 15 دقيقة' : '15 minutes ago'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {language === 'ar' ? 'نسخ احتياطي تلقائي' : 'Automatic backup completed'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'منذ ساعة' : '1 hour ago'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="user-management" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'إدارة المستخدمين المتقدمة' : 'Advanced User Management'}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
              </Button>
            </div>
          </div>

          {/* Add Team Members Section */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إضافة أعضاء الفريق' : 'Add Team Members'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إضافة أعضاء فريق اعتماد المستشفى' : 'Add hospital accreditation team members'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="member-name">{language === 'ar' ? 'اسم العضو' : 'Member Name'}</Label>
                  <Input id="member-name" placeholder={language === 'ar' ? 'أدخل اسم العضو' : 'Enter member name'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input id="member-email" type="email" placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital_accreditation_team">{language === 'ar' ? 'دور الفريق' : 'Team Role'}</Label>
                  <Select name="hospital_accreditation_team">
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر دور الفريق' : 'Select team role'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quality_assurance_manager">
                        {language === 'ar' ? 'مدير/مدير ضمان الجودة' : 'Quality Assurance Manager/Director'}
                      </SelectItem>
                      <SelectItem value="accreditation_manager">
                        {language === 'ar' ? 'مدير الاعتماد' : 'Accreditation Manager'}
                      </SelectItem>
                      <SelectItem value="clinical_department_representatives">
                        {language === 'ar' ? 'ممثلو الأقسام الإكلينيكية' : 'Clinical Department Representatives'}
                      </SelectItem>
                      <SelectItem value="infection_control_team">
                        {language === 'ar' ? 'فريق مكافحة العدوى' : 'Infection Control Team'}
                      </SelectItem>
                      <SelectItem value="safety_team">
                        {language === 'ar' ? 'فريق السلامة' : 'Safety Team'}
                      </SelectItem>
                      <SelectItem value="support_services_representatives">
                        {language === 'ar' ? 'ممثلو الخدمات المساندة' : 'Support Services Representatives'}
                      </SelectItem>
                      <SelectItem value="medical_records">
                        {language === 'ar' ? 'السجلات الطبية/إدارة المعلومات الصحية' : 'Medical Records/Health Information Management'}
                      </SelectItem>
                      <SelectItem value="quality_improvement_team">
                        {language === 'ar' ? 'أعضاء فريق تحسين الجودة' : 'Quality Improvement Team Members'}
                      </SelectItem>
                      <SelectItem value="patient_representatives">
                        {language === 'ar' ? 'ممثلو المرضى' : 'Patient Representatives'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-department">{language === 'ar' ? 'القسم' : 'Department'}</Label>
                  <Input id="member-department" placeholder={language === 'ar' ? 'أدخل اسم القسم' : 'Enter department name'} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="gap-2" onClick={() => handleSystemAction('team member added')}>
                  <Plus className="h-4 w-4" />
                  {language === 'ar' ? 'إضافة عضو' : 'Add Member'}
                </Button>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  {language === 'ar' ? 'عرض الفريق' : 'View Team'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === 'ar' ? 'إحصائيات المستخدمين' : 'User Statistics'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{language === 'ar' ? 'مدراء النظام' : 'System Admins'}</span>
                  <Badge variant="destructive">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{language === 'ar' ? 'مشرفين عامين' : 'Super Users'}</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{language === 'ar' ? 'مدراء' : 'Admins'}</span>
                  <Badge variant="default">24</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{language === 'ar' ? 'مستخدمين' : 'Users'}</span>
                  <Badge variant="outline">210</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleSystemAction('bulk user update')}
                >
                  <Users className="h-4 w-4" />
                  {language === 'ar' ? 'تحديث جماعي' : 'Bulk Update'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleSystemAction('password reset')}
                >
                  <Key className="h-4 w-4" />
                  {language === 'ar' ? 'إعادة تعيين كلمات المرور' : 'Reset Passwords'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleSystemAction('inactive user cleanup')}
                >
                  <Trash2 className="h-4 w-4" />
                  {language === 'ar' ? 'تنظيف المستخدمين غير النشطين' : 'Cleanup Inactive Users'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {language === 'ar' ? 'تنبيهات الأمان' : 'Security Alerts'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>{language === 'ar' ? '5 محاولات دخول فاشلة' : '5 failed login attempts'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{language === 'ar' ? '12 جلسة نشطة طويلة' : '12 long active sessions'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>{language === 'ar' ? 'النظام آمن' : 'System secure'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system-settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إعدادات عامة' : 'General Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-name">{language === 'ar' ? 'اسم النظام' : 'System Name'}</Label>
                  <Input id="system-name" defaultValue="Quality Management System" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-language">{language === 'ar' ? 'اللغة الافتراضية' : 'Default Language'}</Label>
                  <Select defaultValue="ar">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">{language === 'ar' ? 'العربية' : 'Arabic'}</SelectItem>
                      <SelectItem value="en">{language === 'ar' ? 'الإنجليزية' : 'English'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="maintenance-mode" />
                  <Label htmlFor="maintenance-mode">
                    {language === 'ar' ? 'وضع الصيانة' : 'Maintenance Mode'}
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">{language === 'ar' ? 'انتهاء الجلسة (دقائق)' : 'Session Timeout (minutes)'}</Label>
                  <Input id="session-timeout" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">{language === 'ar' ? 'الحد الأقصى لمحاولات الدخول' : 'Max Login Attempts'}</Label>
                  <Input id="max-login-attempts" type="number" defaultValue="5" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="two-factor" defaultChecked />
                  <Label htmlFor="two-factor">
                    {language === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="email-notifications" defaultChecked />
                  <Label htmlFor="email-notifications">
                    {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sms-notifications" />
                  <Label htmlFor="sms-notifications">
                    {language === 'ar' ? 'إشعارات الرسائل النصية' : 'SMS Notifications'}
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-frequency">{language === 'ar' ? 'تكرار الإشعارات' : 'Notification Frequency'}</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">{language === 'ar' ? 'فوري' : 'Immediate'}</SelectItem>
                      <SelectItem value="hourly">{language === 'ar' ? 'كل ساعة' : 'Hourly'}</SelectItem>
                      <SelectItem value="daily">{language === 'ar' ? 'يومي' : 'Daily'}</SelectItem>
                      <SelectItem value="weekly">{language === 'ar' ? 'أسبوعي' : 'Weekly'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إعدادات التكامل' : 'Integration Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">{language === 'ar' ? 'نقطة الـ API' : 'API Endpoint'}</Label>
                  <Input id="api-endpoint" defaultValue="https://api.example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">{language === 'ar' ? 'رابط الـ Webhook' : 'Webhook URL'}</Label>
                  <Input id="webhook-url" placeholder="https://..." />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="external-integrations" />
                  <Label htmlFor="external-integrations">
                    {language === 'ar' ? 'التكامل الخارجي' : 'External Integrations'}
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSystemAction('settings save')}>
              {language === 'ar' ? 'حفظ جميع الإعدادات' : 'Save All Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit-logs" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'سجلات التدقيق' : 'Audit Logs'}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'بحث' : 'Search'}
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تصفية' : 'Filter'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="space-y-4 p-6">
                {auditLogsLoading ? (
                  <div className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'جاري تحميل سجلات التدقيق...' : 'Loading audit logs...'}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'لا توجد سجلات تدقيق بعد' : 'No audit logs recorded yet'}
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-2 rounded-full ${log.action === 'DELETE' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div>
                          <p className="font-medium">{log.action} on {log.table_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.record_id ? `Record ${log.record_id}` : 'System Event'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}</p>
                        <Badge variant={log.action === 'DELETE' ? 'destructive' : 'default'}>
                          {log.action}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore */}
        <TabsContent value="backup-restore" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {language === 'ar' ? 'النسخ الاحتياطي' : 'Backup System'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'تكرار النسخ الاحتياطي' : 'Backup Frequency'}</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{language === 'ar' ? 'كل ساعة' : 'Hourly'}</SelectItem>
                      <SelectItem value="daily">{language === 'ar' ? 'يومي' : 'Daily'}</SelectItem>
                      <SelectItem value="weekly">{language === 'ar' ? 'أسبوعي' : 'Weekly'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => handleSystemAction('manual backup')}
                >
                  {language === 'ar' ? 'إنشاء نسخة احتياطية الآن' : 'Create Backup Now'}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'آخر نسخة احتياطية: اليوم 03:00 ص' : 'Last backup: Today 03:00 AM'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {language === 'ar' ? 'الاستعادة' : 'Restore System'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اختر النسخة الاحتياطية' : 'Select Backup'}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر نسخة احتياطية' : 'Select a backup'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backup-1">2024-01-15 03:00 AM</SelectItem>
                      <SelectItem value="backup-2">2024-01-14 03:00 AM</SelectItem>
                      <SelectItem value="backup-3">2024-01-13 03:00 AM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleSystemAction('system restore')}
                >
                  {language === 'ar' ? 'استعادة النظام' : 'Restore System'}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'تحذير: سيؤدي هذا إلى استبدال البيانات الحالية' : 'Warning: This will replace current data'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {language === 'ar' ? 'حالة الأمان' : 'Security Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>{language === 'ar' ? 'تشفير البيانات' : 'Data Encryption'}</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>{language === 'ar' ? 'اتصال آمن (SSL)' : 'Secure Connection (SSL)'}</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>{language === 'ar' ? 'جدار الحماية' : 'Firewall'}</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>{language === 'ar' ? 'مكافحة البرمجيات الخبيثة' : 'Anti-malware'}</span>
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {language === 'ar' ? 'إدارة المفاتيح' : 'Key Management'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleSystemAction('API key regeneration')}
                >
                  <RefreshCw className="h-4 w-4" />
                  {language === 'ar' ? 'تجديد مفاتيح API' : 'Regenerate API Keys'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleSystemAction('certificate renewal')}
                >
                  <Shield className="h-4 w-4" />
                  {language === 'ar' ? 'تجديد الشهادات' : 'Renew Certificates'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleSystemAction('security scan')}
                >
                  <Search className="h-4 w-4" />
                  {language === 'ar' ? 'فحص أمني' : 'Security Scan'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserManagement } from "@/components/UserManagement";
import { ComplianceOverview } from "@/components/ComplianceOverview";
import { ControlsMatrix } from "@/components/ControlsMatrix";
import { PolicyLibrary } from "@/components/PolicyLibrary";
import { AuditTimeline } from "@/components/AuditTimeline";
import { ReportingCenter } from "@/components/ReportingCenter";
import { QualityTools } from "@/components/QualityTools";
import { NationalStandards } from "@/components/NationalStandards";
import { SuperUserConsole } from "@/components/SuperUserConsole";
import { ProvisionOfCare } from "@/components/ProvisionOfCare";
import { DentalLaboratory } from "@/components/DentalLaboratory";
import { TeamManagement } from "@/components/TeamManagement";
import { PolicyTemplates } from "@/components/PolicyTemplates";
import { AdminPanel } from "@/components/AdminPanel";
import { TaskManagement } from "@/components/TaskManagement";
import { IncidentReporting } from "@/components/IncidentReporting";
import { FileUploadManager } from "@/components/FileUploadManager";
import { ProjectQualityPlan } from "@/components/ProjectQualityPlan";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun, LogOut } from 'lucide-react';

const HeaderControls = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <img
          src="/favicon.svg"
          alt="Arab Compliance Hub"
          className="h-8 w-8 rounded-sm"
        />
        <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
          {language === 'ar' ? 'نواة الامتثال' : 'Arab Compliance Hub'}
        </h1>
        <p className="text-xs text-muted-foreground">Version 0.1.0</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="hidden sm:flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">
            {language === 'ar' ? 'English' : 'العربية'}
          </span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="hidden sm:flex items-center gap-2"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="hidden md:inline">
            {theme === 'light' ? t('darkMode') || 'Dark' : t('lightMode') || 'Light'}
          </span>
        </Button>

        <NotificationCenter />

        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

const MainContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('dashboard');
  const { language } = useLanguage();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <ComplianceOverview />;
      case 'controls-matrix':
        return <ControlsMatrix />;
      case 'policy-library':
        return <PolicyLibrary />;
      case 'audit-timeline':
        return <AuditTimeline />;
      case 'reporting':
        return <ReportingCenter />;
      case 'user-management':
        return <UserManagement />;
      case 'team-management':
        return <TeamManagement />;
      case 'task-management':
        return <TaskManagement />;
      case 'incident-reporting':
        return <IncidentReporting />;
      case 'policy-templates':
        return <PolicyTemplates />;
      case 'file-manager':
        return <FileUploadManager />;
      case 'project-quality-plan':
        return <ProjectQualityPlan />;
      case 'admin-panel':
        return <AdminPanel />;
      case 'quality-tools':
        return <QualityTools />;
      case 'national-standards':
        return <NationalStandards />;
      case 'provision-care':
        return <ProvisionOfCare />;
      case 'dental-lab':
        return <DentalLaboratory />;
      default:
        return <ComplianceOverview />;
    }
  };

  return (
    <div className={`min-h-screen w-full ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar 
            activeModule={activeModule} 
            setActiveModule={setActiveModule} 
          />
          <SidebarInset className="flex-1 min-w-0">
            <HeaderControls />
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
              {renderActiveModule()}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

const Index = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <MainContent />
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default Index;

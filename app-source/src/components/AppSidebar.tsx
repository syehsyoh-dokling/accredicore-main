
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  LayoutDashboard, 
  Shield, 
  FileText, 
  Calendar,
  BarChart3,
  Users,
  Heart,
  Microscope,
  ClipboardCheck,
  BookOpen,
  Settings,
  UsersIcon,
  CheckSquare,
  AlertTriangle,
  FileStack,
  Upload
} from 'lucide-react';

const menuItems = [
  {
    titleKey: "dashboard",
    url: "dashboard",
    icon: LayoutDashboard,
  },
  {
    titleKey: "controlsMatrix",
    url: "controls-matrix", 
    icon: Shield,
  },
  {
    titleKey: "policyLibrary",
    url: "policy-library",
    icon: FileText,
  },
  {
    titleKey: "auditTimeline",
    url: "audit-timeline",
    icon: Calendar,
  },
  {
    titleKey: "reporting",
    url: "reporting",
    icon: BarChart3,
  },
  {
    titleKey: "userManagement",
    url: "user-management",
    icon: Users,
  },
  {
    titleKey: "teamManagement",
    url: "team-management",
    icon: UsersIcon,
  },
  {
    titleKey: "taskManagement",
    url: "task-management",
    icon: CheckSquare,
  },
  {
    titleKey: "incidentReporting",
    url: "incident-reporting",
    icon: AlertTriangle,
  },
  {
    titleKey: "policyTemplates",
    url: "policy-templates",
    icon: FileStack,
  },
  {
    titleKey: "fileManager",
    url: "file-manager",
    icon: Upload,
  },
  {
    titleKey: "projectQualityPlan",
    url: "project-quality-plan",
    icon: ClipboardCheck,
  },
  {
    titleKey: "adminPanel",
    url: "admin-panel",
    icon: Settings,
  }
];

const cbahiModules = [
  {
    titleKey: "provisionOfCare",
    url: "provision-care",
    icon: Heart
  },
  {
    titleKey: "dentalLaboratory",
    url: "dental-lab",
    icon: Microscope
  },
  {
    titleKey: "qualityTools",
    url: "quality-tools",
    icon: ClipboardCheck
  },
  {
    titleKey: "nationalStandards",
    url: "national-standards", 
    icon: BookOpen
  }
];

interface AppSidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export function AppSidebar({ activeModule, setActiveModule }: AppSidebarProps) {
  const { t, language } = useLanguage();
  
  return (
    <Sidebar 
      side={language === 'ar' ? 'right' : 'left'}
      className="border-r border-blue-100"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-blue-100 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.svg"
            alt="Arab Compliance Hub"
            className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
          />
          <div className={`${language === 'ar' ? 'text-right' : 'text-left'} min-w-0 group-data-[collapsible=icon]:hidden`}>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base truncate">
              {language === 'ar' ? 'نواة الامتثال' : 'Arab Compliance Hub'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {language === 'ar' ? 'جودة الرعاية الصحية' : 'Healthcare Quality Management'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2 md:p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 dark:text-gray-300 font-medium mb-3 text-xs md:text-sm">
            {t('coreModules')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    onClick={() => setActiveModule(item.url)}
                    isActive={activeModule === item.url}
                    className={`w-full justify-start gap-3 py-2 md:py-3 px-2 md:px-3 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 transition-colors group ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    tooltip={t(item.titleKey)}
                  >
                    <item.icon className="h-4 w-4 md:h-5 md:w-5 text-blue-500 group-hover:text-blue-600 flex-shrink-0" />
                    <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'} group-data-[collapsible=icon]:hidden`}>
                      <div className="font-medium text-sm md:text-base truncate">{t(item.titleKey)}</div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 md:mt-6">
          <SidebarGroupLabel className="text-gray-600 dark:text-gray-300 font-medium mb-3 text-xs md:text-sm">
            {t('cbahiModules')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cbahiModules.map((module) => (
                <SidebarMenuItem key={module.url}>
                  <SidebarMenuButton 
                    onClick={() => setActiveModule(module.url)}
                    isActive={activeModule === module.url}
                    className={`w-full justify-start gap-3 py-2 px-2 md:px-3 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900 transition-colors group ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                    tooltip={t(module.titleKey)}
                  >
                    <module.icon className="h-3 w-3 md:h-4 md:w-4 text-teal-500 group-hover:text-teal-600 flex-shrink-0" />
                    <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'} group-data-[collapsible=icon]:hidden`}>
                      <div className="text-xs md:text-sm font-medium truncate">{t(module.titleKey)}</div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-blue-100 p-3 md:p-4 group-data-[collapsible=icon]:hidden">
        <p className={`${language === 'ar' ? 'text-right' : 'text-left'} text-xs text-muted-foreground`}>
          All rights reserved to Maknoun Consultancy - 2025
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

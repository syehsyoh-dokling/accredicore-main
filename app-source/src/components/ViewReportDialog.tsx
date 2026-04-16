import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Printer, Calendar, FileText } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";

interface Report {
  id: string;
  title: string;
  description: string;
  type: string;
  frequency: string;
  lastGenerated: string;
  format: string;
  status: string;
}

interface ViewReportDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (report: Report) => void;
  onPrint: (report: Report) => void;
}

export function ViewReportDialog({ 
  report, 
  open, 
  onOpenChange,
  onDownload,
  onPrint 
}: ViewReportDialogProps) {
  const { t, language } = useLanguage();

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {report.title}
          </DialogTitle>
          <DialogDescription>{report.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('reportNumber')}</p>
              <Badge variant="outline">{report.id}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('status')}</p>
              <Badge className={
                report.status === t('ready') 
                  ? 'bg-green-100 text-green-800'
                  : report.status === t('updating')
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }>
                {report.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('type')}</p>
              <p className="text-sm">{report.type}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('frequency')}</p>
              <p className="text-sm">{report.frequency}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('format')}</p>
              <Badge variant="outline" className={
                report.format === 'PDF'
                  ? 'bg-red-100 text-red-800'
                  : report.format === 'Excel'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }>
                {report.format}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t('lastGenerated')}</p>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" />
                {report.lastGenerated}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">{language === 'ar' ? 'محتوى التقرير' : 'Report Content'}</h4>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'هذا تقرير نموذجي يحتوي على معلومات مفصلة حول الامتثال والضوابط والسياسات. في النظام الفعلي، سيتم عرض محتوى التقرير الكامل هنا.'
                  : 'This is a sample report containing detailed information about compliance, controls, and policies. In a production system, the full report content would be displayed here.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onDownload(report)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {t('download')}
          </Button>
          <Button
            variant="outline"
            onClick={() => onPrint(report)}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            {language === 'ar' ? 'طباعة' : 'Print'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

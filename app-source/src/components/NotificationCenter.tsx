import React, { useState } from 'react';
import { format } from 'date-fns';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';

const typeLabel = (typeKey?: string) => {
  switch (typeKey) {
    case 'policy_approval':
      return 'Approval';
    case 'policy_attestation':
      return 'Attestation';
    default:
      return 'System';
  }
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications(40);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: 'Notifications updated',
        description: 'All notifications have been marked as read.',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notifications',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2"
      >
        <Bell className="h-4 w-4" />
        <span className="hidden md:inline">Notifications</span>
        {unreadCount > 0 && (
          <Badge className="absolute -right-2 -top-2 min-w-5 justify-center rounded-full px-1.5">
            {unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Notification Center</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {unreadCount} unread of {notifications.length} notifications
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchNotifications()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[420px] pr-4">
            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading notifications...</div>
              ) : notifications.length ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg border p-4 ${
                      notification.is_read ? 'bg-background' : 'bg-blue-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={notification.is_read ? 'outline' : 'default'}>
                            {typeLabel(notification.notification_type?.type_key)}
                          </Badge>
                          {!notification.is_read && <Badge variant="secondary">Unread</Badge>}
                        </div>
                        <div className="font-medium">{notification.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), 'PPpp')}
                        </div>
                        {notification.expires_at && (
                          <div className="text-xs text-muted-foreground">
                            Due by {format(new Date(notification.expires_at), 'PPpp')}
                          </div>
                        )}
                      </div>
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No notifications yet.</div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

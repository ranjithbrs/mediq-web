import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useNotifications,
} from "@/hooks/useNotifications";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { Bell, Mail, Smartphone, Calendar, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Notifications = () => {
  const { user } = useAuth();
  const { data: preferences, isLoading: prefsLoading } =
    useNotificationPreferences(user?.id);
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications(user?.id);
  const updatePreferences = useUpdateNotificationPreferences();
  const { requestPushPermission, pushEnabled } = useNotificationContext();

  if (prefsLoading || notificationsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const handlePreferenceChange = (key: string, value: boolean) => {
    updatePreferences.mutate({ [key]: value } as any);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment_confirmation":
        return <Calendar className="h-4 w-4" />;
      case "appointment_reminder":
        return <Clock className="h-4 w-4" />;
      case "queue_update":
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Only show in_app notifications to users.
  // Email/push rows are backend delivery records and must not surface here —
  // they carry delivery status ("failed" for email) that is unrelated to
  // whether the appointment itself succeeded, and would appear contradictory.
  const inAppNotifications = (notifications ?? []).filter(
    (n) => n.channel === "in_app"
  );

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how you receive updates about your appointments
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="email-enabled">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-enabled"
                  checked={preferences?.email_enabled ?? true}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("email_enabled", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="push-enabled">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in your browser
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!pushEnabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={requestPushPermission}
                    >
                      Enable
                    </Button>
                  )}
                  <Switch
                    id="push-enabled"
                    checked={preferences?.push_enabled ?? true}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange("push_enabled", checked)
                    }
                    disabled={!pushEnabled}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="appointment-reminders">
                      Appointment Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders before your appointments
                    </p>
                  </div>
                </div>
                <Switch
                  id="appointment-reminders"
                  checked={preferences?.appointment_reminders ?? true}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("appointment_reminders", checked)
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <Label htmlFor="queue-updates">Queue Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about your position in queue
                    </p>
                  </div>
                </div>
                <Switch
                  id="queue-updates"
                  checked={preferences?.queue_updates ?? true}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("queue_updates", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Notification History</h2>
          
          {inAppNotifications.length > 0 ? (
            <div className="space-y-3">
              {inAppNotifications.map((notification) => (
                <Card key={notification.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <Badge
                              variant="outline"
                              className={getStatusColor(notification.status)}
                            >
                              {notification.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(notification.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;

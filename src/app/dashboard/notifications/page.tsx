// src/app/dashboard/notifications/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { getNotificationsForUser } from './actions';
import type { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';


export default function NotificationsPage() {
  const { userProfileWithPermissions } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userNotifications = await getNotificationsForUser(userId);
      setNotifications(userNotifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      toast({
        title: "Erro ao buscar notificações",
        description: "Não foi possível carregar suas notificações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (userProfileWithPermissions?.uid) {
      fetchNotifications(userProfileWithPermissions.uid);
    } else {
      setIsLoading(false);
    }
  }, [userProfileWithPermissions, fetchNotifications]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando suas notificações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Bell className="h-7 w-7 mr-3 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>
            Sua central de mensagens e alertas importantes da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhuma Notificação</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Quando houver novas notificações, elas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative flex items-start gap-4 p-4 border rounded-lg transition-colors",
                    notification.isRead ? "bg-card text-muted-foreground" : "bg-accent/50 text-accent-foreground border-primary/20"
                  )}
                >
                  {!notification.isRead && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" title="Não lida"></div>
                  )}
                  <div className="flex-grow space-y-1">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                       <span>{format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                       {notification.link && (
                          <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary">
                              <Link href={notification.link}>Ver Detalhes</Link>
                          </Button>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

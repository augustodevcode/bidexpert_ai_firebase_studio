// src/app/dashboard/notifications/page.tsx
/**
 * @fileoverview Página de Notificações do Painel do Usuário.
 * Este componente de cliente é responsável por buscar e exibir a lista de
 * notificações do usuário logado. Ele permite que o usuário veja novas
 * mensagens e alertas, clique para navegar até o conteúdo relevante e marca
 * automaticamente as notificações como lidas após a interação.
 */
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { getNotificationsForUser, markNotificationAsRead } from './actions';
import type { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function NotificationItem({ notification, onNotificationClick }: { notification: Notification, onNotificationClick: (notification: Notification) => void }) {
    const [formattedDate, setFormattedDate] = useState('...');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (notification.createdAt) {
            setFormattedDate(format(new Date(notification.createdAt as string), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
        }
    }, [notification.createdAt]);

    return (
        <div
            key={notification.id}
            onClick={() => onNotificationClick(notification)}
            className={cn(
                "relative flex items-start gap-4 p-4 border rounded-lg transition-all cursor-pointer",
                notification.isRead ? "bg-card text-muted-foreground hover:bg-secondary/50" : "bg-accent/50 text-accent-foreground border-primary/20 hover:bg-accent"
            )}
        >
            {!notification.isRead && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" title="Não lida"></div>
            )}
            <div className="flex-grow space-y-1">
                <p className="text-sm font-medium">{notification.message}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{isClient ? formattedDate : <Skeleton className="h-4 w-28" />}</span>
                    {notification.link && (
                        <span className="text-primary font-medium">Ver Detalhes</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function NotificationsPage() {
  const { userProfileWithPermissions, unreadNotificationsCount, refetchUser } = useAuth(); // Usando refetchUser para consistência
  const { toast } = useToast();
  const router = useRouter();
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
  
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead && userProfileWithPermissions?.uid) {
      const result = await markNotificationAsRead(notification.id, userProfileWithPermissions.uid);
      if (result.success) {
        // Optimistically update the UI
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        refetchUser(); // Atualiza a contagem no header
      }
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]" data-ai-id="my-notifications-loading-spinner">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando suas notificações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-ai-id="my-notifications-page-container">
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
            <div className="text-center py-12 bg-secondary/30 rounded-lg" data-ai-id="my-notifications-empty-state">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground">Nenhuma Notificação</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Quando houver novas notificações, elas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-ai-id="my-notifications-list">
              {notifications.map(notification => (
                <NotificationItem 
                    key={notification.id}
                    notification={notification}
                    onNotificationClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

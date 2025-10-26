// src/components/dashboard/bidder/notifications-section.tsx
/**
 * @fileoverview Seção de notificações no dashboard do bidder
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Trophy,
  CreditCard,
  FileText,
  Truck,
  Settings,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { BidderNotification, BidderNotificationType } from '@/types/bidder-dashboard';

interface NotificationsSectionProps {}

export function NotificationsSection({}: NotificationsSectionProps) {
  const [notifications, setNotifications] = useState<BidderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(false);

  // TODO: Implementar hooks para buscar dados
  // const { notifications, unreadCount, loading } = useNotifications();

  const getNotificationIcon = (type: BidderNotificationType) => {
    switch (type) {
      case 'AUCTION_WON':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'PAYMENT_DUE':
        return <CreditCard className="h-4 w-4 text-orange-500" />;
      case 'PAYMENT_OVERDUE':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'DOCUMENT_APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DOCUMENT_REJECTED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'DELIVERY_UPDATE':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'AUCTION_ENDING':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'SYSTEM_UPDATE':
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTitle = (type: BidderNotificationType) => {
    switch (type) {
      case 'AUCTION_WON':
        return 'Arremate Ganho!';
      case 'PAYMENT_DUE':
        return 'Pagamento Pendente';
      case 'PAYMENT_OVERDUE':
        return 'Pagamento em Atraso';
      case 'DOCUMENT_APPROVED':
        return 'Documento Aprovado';
      case 'DOCUMENT_REJECTED':
        return 'Documento Rejeitado';
      case 'DELIVERY_UPDATE':
        return 'Atualização de Entrega';
      case 'AUCTION_ENDING':
        return 'Leilão Encerrando';
      case 'SYSTEM_UPDATE':
        return 'Atualização do Sistema';
      default:
        return 'Notificação';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    // TODO: Implementar marcação como lida
    console.log('Mark as read:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    // TODO: Implementar marcação de todas como lidas
    console.log('Mark all as read');
  };

  const handleDelete = (notificationId: string) => {
    // TODO: Implementar exclusão
    console.log('Delete notification:', notificationId);
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'read':
        return notification.isRead;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Mantenha-se atualizado sobre seus arremates e atividades
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="px-2 py-1">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                Marcar todas como lidas
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread">Não Lidas</TabsTrigger>
              <TabsTrigger value="read">Lidas</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                      <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                      </div>
                      <div className="w-16 h-6 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.createdAt.toLocaleDateString('pt-BR')} às{' '}
                          {notification.createdAt.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? 'Nenhuma notificação não lida' :
                     filter === 'read' ? 'Nenhuma notificação lida' :
                     'Nenhuma notificação encontrada'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Notification Settings */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Configurações de Notificação</h4>
                <p className="text-sm text-muted-foreground">
                  Gerencie como você recebe notificações
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {notifications.filter(n => n.type === 'AUCTION_WON').length}
              </div>
              <div className="text-xs text-green-600">Arremates Ganhos</div>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {notifications.filter(n => n.type === 'PAYMENT_DUE' || n.type === 'PAYMENT_OVERDUE').length}
              </div>
              <div className="text-xs text-orange-600">Pagamentos</div>
            </div>

            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {notifications.filter(n => n.type === 'DOCUMENT_APPROVED' || n.type === 'DOCUMENT_REJECTED').length}
              </div>
              <div className="text-xs text-blue-600">Documentos</div>
            </div>

            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {notifications.filter(n => n.type === 'DELIVERY_UPDATE').length}
              </div>
              <div className="text-xs text-purple-600">Entregas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

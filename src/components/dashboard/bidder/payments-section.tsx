// src/components/dashboard/bidder/payments-section.tsx
/**
 * @fileoverview Seção de pagamentos no dashboard do bidder
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { PaymentMethod, WonLot } from '@/types/bidder-dashboard';

interface PaymentsSectionProps {}

export function PaymentsSection({}: PaymentsSectionProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pendingPayments, setPendingPayments] = useState<WonLot[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [showAddMethod, setShowAddMethod] = useState(false);

  // TODO: Implementar hooks para buscar dados
  // const { paymentMethods, defaultMethod } = usePaymentMethods();
  // const { pendingPayments } = usePendingPayments();

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return <CreditCard className="h-4 w-4" />;
      case 'PIX':
        return <DollarSign className="h-4 w-4" />;
      case 'BOLETO':
        return <FileText className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getMethodName = (type: string) => {
    switch (type) {
      case 'CREDIT_CARD':
        return 'Cartão de Crédito';
      case 'PIX':
        return 'PIX';
      case 'BOLETO':
        return 'Boleto';
      default:
        return type;
    }
  };

  const handleAddPaymentMethod = () => {
    setShowAddMethod(true);
  };

  const handlePayLot = (lotId: string) => {
    // TODO: Implementar modal de pagamento
    console.log('Pay lot:', lotId);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="methods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="methods">Métodos de Pagamento</TabsTrigger>
          <TabsTrigger value="pending">Pagamentos Pendentes</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Métodos de Pagamento
                </CardTitle>
                <CardDescription>
                  Gerencie seus métodos de pagamento para facilitar as compras
                </CardDescription>
              </div>
              <Button onClick={handleAddPaymentMethod}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Método
              </Button>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <div className="grid gap-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getMethodIcon(method.type)}
                        </div>
                        <div>
                          <div className="font-medium">{getMethodName(method.type)}</div>
                          {method.type === 'CREDIT_CARD' && method.cardLast4 && (
                            <div className="text-sm text-muted-foreground">
                              **** **** **** {method.cardLast4}
                            </div>
                          )}
                          {method.type === 'PIX' && method.pixKey && (
                            <div className="text-sm text-muted-foreground">
                              {method.pixKeyType}: {method.pixKey}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={method.isDefault ? 'default' : 'outline'}>
                              {method.isDefault ? 'Padrão' : 'Secundário'}
                            </Badge>
                            <Badge variant={method.isActive ? 'default' : 'destructive'}>
                              {method.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                        {!method.isDefault && (
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">
                    Você ainda não tem métodos de pagamento cadastrados
                  </p>
                  <Button onClick={handleAddPaymentMethod}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Método
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pagamentos Pendentes
              </CardTitle>
              <CardDescription>
                Lotes arrematados que ainda precisam ser pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length > 0 ? (
                <div className="space-y-4">
                  {pendingPayments.map((lot) => (
                    <div key={lot.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{lot.title}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {lot.lotId.toString()} • Arrematado em {lot.wonAt.toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Valor: </span>
                            <span className="font-medium">
                              R$ {lot.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {lot.dueDate && (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              <span className={lot.dueDate < new Date() ? 'text-destructive' : 'text-muted-foreground'}>
                                Vence em {lot.dueDate.toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                        <Button onClick={() => handlePayLot(lot.id)}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pagar
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Boleto
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
                  <p className="text-muted-foreground">
                    Parabéns! Todos os seus pagamentos estão em dia.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>
                Todos os seus pagamentos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{payment.lotTitle}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.paymentMethod} • {payment.createdAt.toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.transactionId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Nenhum pagamento realizado ainda
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Payment Method Modal */}
      <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
            <DialogDescription>
              Escolha o tipo de método de pagamento que deseja adicionar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              className="w-full h-16 flex flex-col items-center justify-center space-y-2"
              variant="outline"
              onClick={() => {
                // TODO: Implementar formulário de cartão
                console.log('Add credit card');
              }}
            >
              <CreditCard className="h-6 w-6" />
              <span>Cartão de Crédito</span>
            </Button>

            <Button
              className="w-full h-16 flex flex-col items-center justify-center space-y-2"
              variant="outline"
              onClick={() => {
                // TODO: Implementar formulário PIX
                console.log('Add PIX');
              }}
            >
              <DollarSign className="h-6 w-6" />
              <span>PIX</span>
            </Button>

            <Button
              className="w-full h-16 flex flex-col items-center justify-center space-y-2"
              variant="outline"
              onClick={() => {
                // TODO: Implementar configuração de boleto
                console.log('Add Boleto');
              }}
            >
              <FileText className="h-6 w-6" />
              <span>Boleto Bancário</span>
            </Button>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAddMethod(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

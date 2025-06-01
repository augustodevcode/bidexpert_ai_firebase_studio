
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, FileText, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyWinsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <ShoppingBag className="h-7 w-7 mr-3 text-primary" />
            Meus Arremates
          </CardTitle>
          <CardDescription>
            Veja todos os lotes que você arrematou.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Arremate Encontrado</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Os lotes que você ganhar em leilões aparecerão aqui.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Esta seção listará seus arremates com ID do lote, nome, valor, data e status do pagamento.
            </p>
            <div className="mt-4 space-x-2">
                <Button disabled><FileText className="mr-2 h-4 w-4" /> Ver Detalhes (Exemplo)</Button>
                <Button variant="outline" disabled><CreditCard className="mr-2 h-4 w-4" /> Pagar (Exemplo)</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyBidsPage() {
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <Gavel className="h-7 w-7 mr-3 text-primary" />
            Meus Lances
          </CardTitle>
          <CardDescription>
            Acompanhe todos os seus lances, ativos e passados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline">
              <ListFilter className="mr-2 h-4 w-4" />
              Filtrar Lances (Em breve)
            </Button>
          </div>
          <div className="text-center py-12 bg-secondary/30 rounded-lg">
            <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Lance Encontrado</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Quando você fizer lances em itens, eles aparecerão aqui.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Esta seção listará seus lances com detalhes como ID do lote, nome, valor, status e data.
            </p>
            <Button className="mt-4" disabled>Ver Detalhes do Lote (Exemplo)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

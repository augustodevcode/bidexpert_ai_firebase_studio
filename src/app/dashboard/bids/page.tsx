
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, ListFilter, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
            Acompanhe todos os seus lances, ativos e passados. Gerencie suas disputas e veja o histórico de suas ofertas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" disabled>
              <ListFilter className="mr-2 h-4 w-4" />
              Filtrar Lances (Em breve)
            </Button>
          </div>
          
          <Alert>
            <ListChecks className="h-5 w-5" />
            <AlertTitle>Funcionalidade em Desenvolvimento</AlertTitle>
            <AlertDescription>
              <p className="mb-2">Em breve, esta seção apresentará uma tabela detalhada com todos os seus lances. Você poderá ver:</p>
              <ul className="list-disc list-inside text-sm space-y-1 pl-4 text-muted-foreground">
                <li><strong>ID do Lote e Nome do Item:</strong> Para fácil identificação.</li>
                <li><strong>Valor do Seu Lance:</strong> O montante que você ofertou.</li>
                <li><strong>Lance Atual do Lote:</strong> O maior lance no momento.</li>
                <li><strong>Status da Disputa:</strong> Informações como "Ganhando", "Perdendo", "Superado" ou "Arrematado".</li>
                <li><strong>Tempo Restante:</strong> Para lotes ainda em aberto.</li>
                <li><strong>Data do Lance:</strong> Quando você fez sua oferta.</li>
                <li><strong>Ações Rápidas:</strong> Como "Aumentar Lance" ou "Ver Detalhes do Lote".</li>
              </ul>
              <p className="mt-3">Você também poderá filtrar e ordenar seus lances para melhor organização.</p>
            </AlertDescription>
          </Alert>

          <div className="text-center py-12 bg-secondary/30 rounded-lg mt-8">
            <h3 className="text-xl font-semibold text-muted-foreground">Nenhum Lance Registrado (Exemplo)</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Quando você fizer lances em itens, eles aparecerão aqui de forma organizada.
            </p>
            <Button className="mt-4" variant="link" disabled>Ver Exemplo de Tabela (Protótipo)</Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

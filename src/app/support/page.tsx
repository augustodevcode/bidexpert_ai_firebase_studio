import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, LifeBuoy } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Central de Suporte</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-6 w-6 text-primary" />
              Abrir Novo Chamado
            </CardTitle>
            <CardDescription>
              Relate um problema técnico, dúvida ou sugestão.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-gray-600 mb-4 h-20">
               Nossa equipe está pronta para ajudar. Preencha o formulário com detalhes para agilizar seu atendimento.
             </p>
             <Button className="w-full" asChild>
               <Link href="/support/new">Abrir Ticket</Link>
             </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-6 w-6" />
              FAQ e Documentação
            </CardTitle>
            <CardDescription>
              Encontre respostas rápidas para dúvidas comuns.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-gray-600 mb-4 h-20">
               Consulte nossa base de conhecimento antes de abrir um chamado.
             </p>
             <Button variant="outline" className="w-full" asChild>
               <Link href="/faq">Acessar FAQ</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Handshake, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function SellWithUsPage() {
  const steps = [
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: '1. Cadastro Inicial',
      description: 'Preencha nosso formulário de interesse para que possamos conhecer você e os itens que deseja leiloar.',
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: '2. Análise e Avaliação',
      description: 'Nossa equipe de especialistas analisará seus itens e fornecerá uma avaliação preliminar e proposta de leilão.',
    },
    {
      icon: <Handshake className="h-8 w-8 text-primary" />,
      title: '3. Contrato e Logística',
      description: 'Com tudo acordado, formalizaremos a parceria e cuidaremos da logística para catalogação e fotografia dos seus bens.',
    },
    {
      icon: <Rocket className="h-8 w-8 text-primary" />,
      title: '4. Leilão e Venda!',
      description: 'Seus itens serão promovidos e leiloados em nossa plataforma, alcançando milhares de compradores potenciais.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <Rocket className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Venda Conosco no BidExpert</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transforme seus ativos em liquidez de forma transparente e eficiente.
        </p>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold font-headline">Como Funciona?</CardTitle>
            <CardDescription>Siga estes simples passos para começar a vender seus itens em leilão.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start gap-6 p-4 border-b last:border-b-0">
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="text-center py-8">
        <h2 className="text-2xl font-bold mb-3 font-headline">Pronto para Começar?</h2>
        <p className="text-muted-foreground mb-6">
          Entre em contato conosco para uma consulta gratuita e sem compromisso.
        </p>
        <Button size="lg" asChild>
          <Link href="/contact">Falar com um Especialista</Link>
        </Button>
      </section>
    </div>
  );
}

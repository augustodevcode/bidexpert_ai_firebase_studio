// src/app/auction-safety-tips/page.tsx
/**
 * @fileoverview Página estática com Dicas de Segurança para Leilões.
 * Este componente visa educar o usuário sobre as melhores práticas para
 * participar de leilões online de forma segura, cobrindo tópicos como
 * a verificação de documentos, inspeção de bens e cuidados com fraudes.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, ZoomIn, FileText, Users, MessageSquareWarning } from 'lucide-react';
import Link from 'next/link';

export default function AuctionSafetyTipsPage() {
  const safetyTips = [
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: 'Leia o Edital Atentamente',
      description: 'O edital do leilão é o documento mais importante. Ele contém todas as regras, prazos, condições de pagamento, taxas, e informações sobre o bem. Entenda completamente antes de dar qualquer lance.',
    },
    {
      icon: <ZoomIn className="h-6 w-6 text-primary" />,
      title: 'Inspecione o Bem (Se Possível)',
      description: 'Sempre que possível, visite o imóvel ou inspecione o bem pessoalmente. Fotos podem não revelar todos os detalhes ou problemas. Verifique o estado de conservação e quaisquer pendências.',
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'Verifique a Documentação do Lote',
      description: 'Para imóveis, analise a matrícula atualizada no Cartório de Registro de Imóveis. Verifique por ônus, penhoras, hipotecas ou outras pendências. Para veículos, consulte débitos de IPVA, multas e o histórico do veículo.',
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: 'Conheça o Leiloeiro e o Comitente',
      description: 'Pesquise a reputação do leiloeiro e do comitente (vendedor). Leiloeiros oficiais são registrados na Junta Comercial. Empresas e bancos geralmente são comitentes confiáveis, mas sempre verifique.',
    },
    {
      icon: <MessageSquareWarning className="h-6 w-6 text-primary" />,
      title: 'Cuidado com Fraudes e Phishing',
      description: 'Nunca faça pagamentos fora da plataforma oficial do leilão. Desconfie de e-mails ou mensagens solicitando depósitos em contas de terceiros. Comunique-se sempre através dos canais oficiais.',
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: 'Entenda os Custos Adicionais',
      description: 'Além do valor do lance, podem haver custos como comissão do leiloeiro (geralmente 5%), taxas administrativas, ITBI (para imóveis), custos de registro e transporte. Calcule todos os custos antes de dar um lance.',
    },
     {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: 'Utilize Conexões Seguras',
      description: 'Ao participar de leilões online, certifique-se de que sua conexão com a internet é segura (HTTPS) e evite redes Wi-Fi públicas não confiáveis para transações financeiras.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Dicas de Segurança em Leilões</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Participe de leilões com mais confiança e segurança seguindo nossas recomendações.
        </p>
      </section>

      <div className="space-y-6">
        {safetyTips.map((tip, index) => (
          <Card key={index} className="shadow-md">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="flex-shrink-0 mt-1">{tip.icon}</div>
              <div>
                <CardTitle className="text-xl font-semibold">{tip.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{tip.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Em caso de dúvidas, entre em contato com nossa equipe de suporte ou com o leiloeiro responsável.
        </p>
        <Link href="/contact" className="text-primary hover:underline font-medium">
          Fale Conosco
        </Link>
      </section>
    </div>
  );
}

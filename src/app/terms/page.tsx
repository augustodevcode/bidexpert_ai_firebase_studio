// src/app/terms/page.tsx
/**
 * @fileoverview Página de Termos de Serviço da plataforma.
 * Este componente estático renderiza o conteúdo legal dos termos de uso,
 * detalhando as regras e responsabilidades de usuários, vendedores e da
 * própria plataforma. É uma página essencial para a conformidade legal
 * do serviço.
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { formatInSaoPaulo } from '@/lib/timezone';
import { useState, useEffect } from 'react';

export default function TermsPage() {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    // Para evitar hydration mismatch, a data é formatada no lado do cliente
    setLastUpdated(formatInSaoPaulo(new Date(), 'dd/MM/yyyy'));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Termos de Serviço</h1>
        <p className="text-lg text-muted-foreground">
          Por favor, leia estes termos cuidadosamente antes de usar o BidExpert.
        </p>
        <p className="text-sm text-muted-foreground mt-2">Última Atualização: {lastUpdated || '...'}</p>
      </section>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">1. Aceitação dos Termos</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Ao acessar ou usar a plataforma BidExpert (&quot;Serviço&quot;), você concorda em se vincular a estes Termos de Serviço (&quot;Termos&quot;). Se você não concorda com qualquer parte dos termos, então você não pode acessar o Serviço.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">2. Contas de Usuário</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Ao criar uma conta conosco, você deve fornecer informações precisas, completas e atuais em todos os momentos. A falha em fazer isso constitui uma violação dos Termos, o que pode resultar na rescisão imediata de sua conta em nosso Serviço.</p>
          <p>Você é responsável por proteger a senha que você usa para acessar o Serviço e por quaisquer atividades ou ações sob sua senha, quer sua senha esteja com nosso Serviço ou com um serviço de terceiros.</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">3. Leilões e Lances</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Os vendedores são responsáveis pela precisão de seus anúncios. Os compradores são responsáveis por revisar as descrições dos itens e dar lances com cuidado. Todos os lances são vinculativos.</p>
          <p>O BidExpert se reserva o direito de cancelar leilões ou lances a seu critério se houver suspeita de atividade fraudulenta ou se houver violação destes Termos.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">4. Orientação por IA</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>As ferramentas de orientação para leilões alimentadas por IA são fornecidas apenas para fins informativos. O BidExpert não oferece garantias quanto à precisão ou eficácia dessas sugestões. Os vendedores são os responsáveis finais pelos detalhes de seus anúncios e estratégias de leilão.</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">5. Limitação de Responsabilidade</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Em nenhum caso o BidExpert, nem seus diretores, funcionários, parceiros, agentes, fornecedores ou afiliados, serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes de seu acesso ou uso ou incapacidade de acessar ou usar o Serviço.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">6. Alterações nos Termos</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Tentaremos fornecer um aviso de pelo menos 30 dias antes que quaisquer novos termos entrem em vigor. O que constitui uma alteração material será determinado a nosso exclusivo critério.</p>
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">7. Contato</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco em suporte@bidexpert.com.</p>
        </CardContent>
      </Card>
    </div>
  );
}

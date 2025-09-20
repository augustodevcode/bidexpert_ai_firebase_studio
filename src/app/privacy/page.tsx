// src/app/privacy/page.tsx
/**
 * @fileoverview Página de Política de Privacidade da plataforma.
 * Este componente estático renderiza o conteúdo legal sobre como os dados
 * dos usuários são coletados, usados e protegidos. É uma página essencial
 * para a conformidade com regulamentações de proteção de dados como a LGPD.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone'; // Import timezone functions

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="text-center py-12">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-4 font-headline">Política de Privacidade</h1>
        <p className="text-lg text-muted-foreground">
          Sua privacidade é importante para nós. Esta política explica como lidamos com suas informações pessoais.
        </p>
        <p className="text-sm text-muted-foreground mt-2">Última Atualização: {formatInSaoPaulo(nowInSaoPaulo(), 'dd/MM/yyyy')}</p>
      </section>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">1. Informações que Coletamos</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Coletamos informações que você nos fornece diretamente, como quando cria uma conta, anuncia um item, dá um lance ou se comunica conosco. Isso pode incluir seu nome, endereço de e-mail, endereço postal, número de telefone e informações de pagamento.</p>
          <p>Também coletamos informações automaticamente quando você usa nosso Serviço, como seu endereço IP, informações do dispositivo, histórico de navegação e interações com nossa plataforma.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">2. Como Usamos Suas Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Usamos suas informações para:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Fornecer, manter e melhorar nosso Serviço.</li>
            <li>Processar transações e enviar informações relacionadas, incluindo confirmações e faturas.</li>
            <li>Comunicar com você sobre produtos, serviços, ofertas, promoções e eventos.</li>
            <li>Monitorar e analisar tendências, uso e atividades em conexão com nosso Serviço.</li>
            <li>Personalizar o Serviço e fornecer anúncios, conteúdo ou recursos que correspondam aos perfis ou interesses dos usuários.</li>
            <li>Detectar, investigar e prevenir transações fraudulentas e outras atividades ilegais e proteger os direitos e a propriedade da BidExpert e de outros.</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">3. Compartilhamento de Informações</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Podemos compartilhar suas informações com fornecedores de serviços terceirizados que realizam serviços em nosso nome, como processamento de pagamentos e análise de dados.</p>
          <p>Também podemos compartilhar informações entre compradores e vendedores conforme necessário para facilitar as transações (por exemplo, informações de envio).</p>
          <p>Não venderemos suas informações pessoais a terceiros.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">4. Segurança dos Dados</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Tomamos medidas razoáveis para ajudar a proteger as informações sobre você contra perda, roubo, uso indevido e acesso não autorizado, divulgação, alteração e destruição.</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">5. Suas Escolhas</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Você pode atualizar, corrigir ou excluir informações sobre você a qualquer momento, fazendo login em sua conta ou entrando em contato conosco. Se desejar excluir sua conta, entre em contato conosco, mas observe que podemos reter certas informações conforme exigido por lei ou para fins comerciais legítimos.</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">6. Alterações a Esta Política</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Podemos alterar esta Política de Privacidade de tempos em tempos. Se fizermos alterações, notificaremos você revisando a data no topo da política e, em alguns casos, podemos fornecer um aviso adicional (como adicionar uma declaração à nossa página inicial ou enviar uma notificação).</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">7. Contato</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco em privacy@bidexpert.com.</p>
        </CardContent>
      </Card>
    </div>
  );
}

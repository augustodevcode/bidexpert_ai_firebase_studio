// src/app/faq/page.tsx
/**
 * @fileoverview Página de FAQ em português otimizada para SEO e descoberta orgânica no Google.
 * Organiza dúvidas por perfil (arrematante, vendedor/comitente, leiloeiro e usuário em geral),
 * com âncoras indexáveis e dados estruturados JSON-LD no padrão FAQPage.
 */
import Script from 'next/script';
import type { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Building2,
  CreditCard,
  Gavel,
  HelpCircle,
  Shield,
  ShoppingCart,
  Users,
} from 'lucide-react';

type FaqQuestion = {
  question: string;
  answer: string;
};

type FaqSection = {
  id: string;
  seoAliasId?: string;
  title: string;
  description: string;
  icon: typeof HelpCircle;
  items: FaqQuestion[];
};

export const metadata: Metadata = {
  title: 'FAQ de Leilão Online | BidExpert Brasil',
  description:
    'Perguntas frequentes sobre leilão online no Brasil: como dar lance, arrematar, vender bens, taxas, segurança e gestão para leiloeiros.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'FAQ de Leilão Online | BidExpert Brasil',
    description:
      'Guia completo para arrematante, vendedor, comitente e leiloeiro. Entenda regras, pagamentos, segurança e operação de leilões online.',
    url: '/faq',
    type: 'website',
  },
};

const faqSections: FaqSection[] = [
  {
    id: 'como-funciona',
    seoAliasId: 'como-funciona-leilao-online',
    title: 'Como Funciona o Leilão Online',
    description:
      'Conceitos essenciais para quem está começando ou quer entender melhor o processo de leilão digital no Brasil.',
    icon: HelpCircle,
    items: [
      {
        question: 'Como funciona um leilão online na prática?',
        answer:
          'Você se cadastra, se habilita no leilão desejado e dá lances nos lotes. No encerramento, vence o maior lance válido, conforme edital e regras do leiloeiro oficial.',
      },
      {
        question: 'Leilão online tem validade legal no Brasil?',
        answer:
          'Sim. O leilão online é uma modalidade válida, conduzida por leiloeiro oficial e com regras claras em edital, incluindo responsabilidades do arrematante e condições de pagamento.',
      },
      {
        question: 'Qual a diferença entre leilão judicial e extrajudicial?',
        answer:
          'No judicial, a venda decorre de processo judicial. No extrajudicial, a venda ocorre por iniciativa privada, banco, empresa, seguradora ou comitente, com regras definidas no edital.',
      },
      {
        question: 'Preciso visitar o bem antes de dar lance?',
        answer:
          'É altamente recomendado. Sempre leia o edital, consulte as informações do lote e aproveite períodos de visitação quando disponíveis para reduzir risco de surpresa.',
      },
    ],
  },
  {
    id: 'como-comprar',
    seoAliasId: 'como-comprar-em-leilao',
    title: 'Dúvidas de Arrematante (Como Comprar)',
    description:
      'Perguntas mais comuns para quem quer arrematar com segurança e previsibilidade de custos.',
    icon: ShoppingCart,
    items: [
      {
        question: 'Como dar lance em um lote?',
        answer:
          'Após habilitação aprovada, abra o lote, informe seu lance respeitando o incremento mínimo e confirme. O sistema registra horário e valor para garantir ordem correta dos lances.',
      },
      {
        question: 'Posso cancelar um lance depois de confirmado?',
        answer:
          'Em regra, não. Lance é compromisso. Por isso, revise edital, custos, prazos e documentação antes de ofertar.',
      },
      {
        question: 'O que acontece quando eu arremato?',
        answer:
          'Você recebe confirmação e instruções de pagamento. Depois da quitação e validações aplicáveis, ocorre a liberação para retirada ou transferência do bem.',
      },
      {
        question: 'Quais custos além do lance eu devo considerar?',
        answer:
          'Comissão do leiloeiro, eventuais taxas administrativas, impostos, regularizações, transporte e custos de documentação. Sempre confira a composição exata no edital.',
      },
      {
        question: 'Existe lance automático?',
        answer:
          'Quando habilitado pelo leilão, você define um teto e o sistema disputa por você até esse limite, mantendo o menor valor necessário para liderança.',
      },
    ],
  },
  {
    id: 'como-vender',
    seoAliasId: 'como-vender-em-leilao',
    title: 'Dúvidas de Comitente e Vendedor',
    description:
      'Informações para quem deseja vender ativos em leilão com apoio profissional e alcance digital.',
    icon: Building2,
    items: [
      {
        question: 'Como vender um bem em leilão pela plataforma?',
        answer:
          'Você inicia o processo com o leiloeiro parceiro, envia documentos e dados do ativo, aprova condições comerciais e publica o lote com estratégia de divulgação.',
      },
      {
        question: 'Como é definido o valor de saída (lance inicial)?',
        answer:
          'Normalmente por avaliação técnica, liquidez do ativo, histórico de mercado e objetivo de venda. A decisão final deve equilibrar atratividade e retorno esperado.',
      },
      {
        question: 'Quem cuida da divulgação do lote?',
        answer:
          'A operação pode combinar divulgação do leiloeiro, do comitente e da plataforma, com calendário, segmentação e materiais específicos para aumentar alcance.',
      },
      {
        question: 'Como eu acompanho o desempenho do meu leilão?',
        answer:
          'Pelo painel e relatórios, você acompanha visitas, habilitações, lances, conversão e resultados por lote e por praça.',
      },
    ],
  },
  {
    id: 'para-leiloeiros',
    seoAliasId: 'para-leiloeiros-oficiais',
    title: 'Dúvidas de Leiloeiro e Dono de Empresa de Leilões',
    description:
      'Recursos de operação, controle e escala para empresas leiloeiras em ambiente multi-tenant.',
    icon: Gavel,
    items: [
      {
        question: 'A plataforma atende operação de leiloeira profissional?',
        answer:
          'Sim. A BidExpert suporta gestão de leilões, lotes, praças, usuários, conteúdo, trilha de auditoria e workflows operacionais para escalar a operação com controle.',
      },
      {
        question: 'Consigo separar ambientes e marcas por tenant?',
        answer:
          'Sim. A arquitetura multi-tenant permite isolamento de dados e personalização por operação, essencial para grupos com mais de uma marca ou unidade.',
      },
      {
        question: 'Há recursos para controle e compliance?',
        answer:
          'A plataforma prioriza rastreabilidade e integridade de dados, com logs e mecanismos de governança para reduzir risco operacional.',
      },
      {
        question: 'É possível integrar com sistemas externos?',
        answer:
          'Dependendo do escopo, é possível estruturar integrações com CRM, ERP, gateways e ferramentas de marketing para unificar operação comercial e financeira.',
      },
    ],
  },
  {
    id: 'pagamentos-e-taxas',
    seoAliasId: 'pagamentos-taxas-leilao',
    title: 'Pagamentos, Comissões e Taxas',
    description:
      'Pontos financeiros que mais geram dúvida antes e depois da arrematação.',
    icon: CreditCard,
    items: [
      {
        question: 'Quais formas de pagamento podem ser aceitas?',
        answer:
          'As formas variam por edital: PIX, transferência, boleto e outras modalidades previstas pelo leiloeiro. Sempre valide as regras do lote antes de ofertar.',
      },
      {
        question: 'Em quanto tempo preciso pagar após arrematar?',
        answer:
          'O prazo é definido no edital e deve ser seguido rigorosamente para evitar multa, perda do lote ou outras penalidades previstas.',
      },
      {
        question: 'A comissão do leiloeiro é fixa?',
        answer:
          'Não necessariamente. A comissão e demais encargos podem variar por tipo de leilão, natureza do ativo e regras contratuais.',
      },
      {
        question: 'Posso participar como pessoa jurídica?',
        answer:
          'Sim, quando o edital permitir. A habilitação exige documentação da empresa e do representante legal conforme as regras da operação.',
      },
    ],
  },
  {
    id: 'seguranca-e-suporte',
    seoAliasId: 'seguranca-leilao-online',
    title: 'Segurança, Confiabilidade e Suporte',
    description:
      'Diretrizes para operar com confiança e saber como agir em caso de dúvida ou problema.',
    icon: Shield,
    items: [
      {
        question: 'Como saber se um anúncio de leilão é confiável?',
        answer:
          'Verifique edital, documentação, identificação do leiloeiro oficial, informações do comitente e histórico da operação. Desconfie de urgência sem transparência.',
      },
      {
        question: 'A plataforma protege meus dados?',
        answer:
          'A BidExpert adota boas práticas de segurança e políticas de proteção de dados. Use senha forte, autenticação adequada e nunca compartilhe credenciais.',
      },
      {
        question: 'O que faço se tiver problema após arrematar?',
        answer:
          'Registre o ocorrido com evidências, abra atendimento no suporte e siga os canais formais da operação. O edital e os registros do sistema orientam a tratativa.',
      },
      {
        question: 'Sou curioso e quero aprender antes de investir. Por onde começo?',
        answer:
          'Comece pelos lotes com edital bem detalhado, acompanhe leilões encerrados para entender dinâmica de preço e estude custos totais antes do primeiro lance.',
      },
    ],
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqSections.flatMap((section) =>
    section.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  ),
};

export default function FAQPage() {
  return (
    <>
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-4xl mx-auto" data-ai-id="faq-page-container">
        <section className="text-center py-12" data-ai-id="faq-page-hero-section">
          <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-4 font-headline">
            FAQ BidExpert: Leilão Online no Brasil
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Conteúdo para arrematante, leiloeiro, comitente, vendedor e usuário
            curioso: regras, custos, segurança e como operar melhor em leilão.
          </p>
        </section>

        <section
          className="bg-secondary/30 rounded-lg p-5 mb-10 shadow-md"
          data-ai-id="faq-index-section"
        >
          <h2 className="text-xl font-semibold mb-4 font-headline flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Navegação rápida por tema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {faqSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm text-foreground/90 hover:text-primary transition-colors"
                data-ai-id={`faq-index-link-${section.id}`}
              >
                {section.title}
              </a>
            ))}
          </div>
        </section>

        <div className="space-y-10" data-ai-id="faq-sections-wrapper">
          {faqSections.map((section, sectionIndex) => {
            const SectionIcon = section.icon;

            return (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28"
                data-ai-id={`faq-section-${section.id}`}
              >
                {section.seoAliasId ? (
                  <span
                    id={section.seoAliasId}
                    className="block scroll-mt-28"
                    data-ai-id={`faq-seo-alias-${section.seoAliasId}`}
                  />
                ) : null}

                <div className="mb-4">
                  <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <SectionIcon className="h-6 w-6 text-primary" />
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground mt-2">{section.description}</p>
                </div>

                <Accordion
                  type="single"
                  collapsible
                  className="w-full space-y-3"
                  data-ai-id={`faq-accordion-${section.id}`}
                >
                  {section.items.map((item, itemIndex) => (
                    <AccordionItem
                      key={`${section.id}-${itemIndex}`}
                      value={`${section.id}-item-${itemIndex}`}
                      className="bg-secondary/30 rounded-lg px-4 shadow-md"
                      data-ai-id={`faq-item-${section.id}-${itemIndex}`}
                    >
                      <AccordionTrigger className="text-left font-semibold hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {sectionIndex < faqSections.length - 1 ? (
                  <div className="border-t border-border/60 mt-8" />
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
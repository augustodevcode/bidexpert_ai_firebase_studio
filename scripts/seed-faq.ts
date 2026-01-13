
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FAQs...');

  const tenants = await prisma.tenant.findMany();

  if (tenants.length === 0) {
    console.error('No tenants found. Please run the main seed first.');
    return;
  }

  const faqData = [
    {
      question: 'Como crio uma conta?',
      answer: 'Para criar uma conta, clique no botão "Cadastrar" no canto superior direito da página. Preencha seus dados e você estará pronto para começar a dar lances e vender.',
      order: 1,
    },
    {
      question: 'Como faço para dar um lance?',
      answer: 'Navegue até o item do leilão em que você está interessado. Insira o valor do seu lance no campo designado e clique em "Dar Lance". Verifique se o seu lance é maior que o lance atual ou atende ao incremento mínimo.',
      order: 2,
    },
    {
      question: 'Quais métodos de pagamento são aceitos?',
      answer: 'Aceitamos vários métodos de pagamento, incluindo os principais cartões de crédito (Visa, MasterCard, American Express) e PayPal. As opções de pagamento específicas podem variar de acordo com o vendedor.',
      order: 3,
    },
    {
      question: 'Como funciona o envio?',
      answer: 'Os termos de envio são definidos pelo vendedor para cada item. Verifique a descrição do item para custos de envio, locais e prazos de entrega estimados. Você também pode entrar em contato com o vendedor para obter mais detalhes.',
      order: 4,
    },
    {
      question: 'Quais são as taxas do leilão?',
      answer: 'O BidExpert cobra uma pequena taxa de comissão dos vendedores em vendas bem-sucedidas. Os compradores podem incorrer em impostos ou taxas de envio conforme especificado pelo vendedor. Consulte nossos termos para obter estruturas de taxas detalhadas.',
      order: 5,
    },
    {
      question: 'Como posso vender um item?',
      answer: 'Para vender um item, clique em "Criar Leilão" após fazer o login. Você será guiado pelo processo de descrição do seu item, upload de fotos, definição de um lance inicial e duração do leilão. Nossas ferramentas de IA podem ajudá-lo a otimizar seu anúncio!',
      order: 6,
    },
  ];

  for (const tenant of tenants) {
    console.log(`Seeding FAQs for tenant: ${tenant.name}`);
    for (const item of faqData) {
      await prisma.fAQ.create({
        data: {
          ...item,
          tenantId: tenant.id,
        },
      });
    }
  }

  console.log('FAQ seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

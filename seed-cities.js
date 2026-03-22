const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mainCities = [
  { name: 'São Paulo', stateUf: 'SP' },
  { name: 'Rio de Janeiro', stateUf: 'RJ' },
  { name: 'Brasília', stateUf: 'DF' },
  { name: 'Salvador', stateUf: 'BA' },
  { name: 'Fortaleza', stateUf: 'CE' },
  { name: 'Belo Horizonte', stateUf: 'MG' },
  { name: 'Manaus', stateUf: 'AM' },
  { name: 'Curitiba', stateUf: 'PR' },
  { name: 'Recife', stateUf: 'PE' },
  { name: 'Porto Alegre', stateUf: 'RS' },
  { name: 'Goiânia', stateUf: 'GO' },
  { name: 'Belém', stateUf: 'PA' },
  { name: 'São Luís', stateUf: 'MA' },
  { name: 'Maceió', stateUf: 'AL' },
  { name: 'Macapá', stateUf: 'AP' },
  { name: 'Vitória', stateUf: 'ES' },
  { name: 'Cuiabá', stateUf: 'MT' },
  { name: 'Campo Grande', stateUf: 'MS' },
  { name: 'João Pessoa', stateUf: 'PB' },
  { name: 'Teresina', stateUf: 'PI' },
  { name: 'Natal', stateUf: 'RN' },
  { name: 'Porto Velho', stateUf: 'RO' },
  { name: 'Boa Vista', stateUf: 'RR' },
  { name: 'Florianópolis', stateUf: 'SC' },
  { name: 'Aracaju', stateUf: 'SE' },
  { name: 'Palmas', stateUf: 'TO' },
  { name: 'Rio Branco', stateUf: 'AC' },
  { name: 'Guarulhos', stateUf: 'SP' },
  { name: 'Campinas', stateUf: 'SP' }
];

async function main() {
  for (const city of mainCities) {
    const state = await prisma.state.findUnique({ where: { uf: city.stateUf } });
    if (state) {
      await prisma.city.upsert({
        where: { name_stateId: { stateId: state.id, name: city.name } },
        update: {},
        create: {
          id: BigInt(Math.floor(Math.random() * 1000000000000)),
          name: city.name,
          stateId: state.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('City seeded: ' + city.name + ' - ' + city.stateUf);
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

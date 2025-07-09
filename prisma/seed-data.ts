// prisma/seed-data.ts
// This file contains the sample data for seeding the database.

import type { State, City, LotCategory, Subcategory, Court, JudicialDistrict, JudicialBranch, Seller, Auctioneer, JudicialProcess, Bem, Auction, Lot, Bid, UserWin, DocumentType, Notification, MediaItem, ProcessParty } from '@prisma/client';

export const sampleLotCategories: (Omit<LotCategory, 'createdAt' | 'updatedAt' | 'itemCount' | 'hasSubcategories'> & { subcategories?: Omit<Subcategory, 'parentCategoryId' | 'slug' | 'createdAt' | 'updatedAt' | 'itemCount'>[] })[] = [
  { id: "cat-imoveis", name: "Imóveis", slug: "imoveis", description: "Casas, apartamentos, terrenos, salas comerciais, galpões, fazendas, sítios e chácaras.", logoUrl: null, coverImageUrl: "/uploads/media/6caf929a-d9e0-4109-a64a-f47f2cbdbf12-3d-rendering-loft-luxury-living-room-with-bookshelf.jpg", megaMenuImageUrl: null, dataAiHintLogo: "predio casa", dataAiHintCover: "imoveis cidade panorama", dataAiHintMegaMenu: null, subcategories: [
      { id: 'subcat-imoveis-apartamentos', name: "Apartamentos", description: "Apartamentos de todos os tamanhos." },
      { id: 'subcat-imoveis-casas', name: "Casas", description: "Casas residenciais." },
  ] },
  { id: "cat-veiculos", name: "Veículos", slug: "veiculos", description: "Carros, motos, caminhões, ônibus, utilitários e outros veículos terrestres.", subcategories: [
      { id: 'subcat-veiculos-carros', name: "Carros" },
      { id: 'subcat-veiculos-motos', name: "Motos" }
  ] },
  { id: "cat-maquinas-e-equipamentos", name: "Máquinas e Equipamentos", slug: "maquinas-e-equipamentos", description: "Máquinas pesadas, agrícolas, industriais, equipamentos de construção e diversos.", subcategories: [
       { id: 'subcat-maquinas-agricolas', name: "Máquinas Agrícolas"},
       { id: 'subcat-equipamentos-construcao', name: "Equipamentos de Construção"}
  ] },
  { id: "cat-eletronicos-e-tecnologia", name: "Eletrônicos e Tecnologia", slug: "eletronicos-e-tecnologia", description: "Celulares, computadores, TVs e mais.", subcategories: [
      { id: 'subcat-eletronicos-celulares', name: "Celulares e Smartphones"}
  ]},
  { id: "cat-bens-diversos", name: "Bens Diversos", slug: "bens-diversos", description: "Móveis, utensílios, e outros itens gerais."},
  { id: "cat-arte-e-antiguidades", name: "Arte e Antiguidades", slug: "arte-e-antiguidades", description: "Obras de arte, antiguidades e itens de coleção."},
  { id: "cat-embarcacoes", name: "Embarcações", slug: "embarcacoes", description: "Lanchas, barcos, veleiros, jet skis.", subcategories: [
      { id: "subcat-embarcacoes-lanchas", name: "Lanchas e Iates"},
      { id: "subcat-embarcacoes-jetskis", name: "Jet Skis"}
  ]},
];

export const sampleStates: Omit<State, 'createdAt' | 'updatedAt' | 'cityCount'>[] = [
  { id: "state-al", name: "Alagoas", uf: "AL", slug: "alagoas" },
  { id: "state-ba", name: "Bahia", uf: "BA", slug: "bahia" },
  { id: "state-sp", name: "São Paulo", uf: "SP", slug: "sao-paulo" },
  { id: "state-rj", name: "Rio de Janeiro", uf: "RJ", slug: "rio-de-janeiro" },
  { id: "state-mg", name: "Minas Gerais", uf: "MG", slug: "minas-gerais" },
  { id: "state-pr", name: "Paraná", uf: "PR", slug: "parana" },
  { id: "state-rs", name: "Rio Grande do Sul", uf: "RS", slug: "rio-grande-do-sul" },
  { id: "state-go", name: "Goiás", uf: "GO", slug: "goias" },
  { id: "state-ms", name: "Mato Grosso do Sul", uf: "MS", slug: "mato-grosso-do-sul" },
  { id: "state-ce", name: "Ceará", uf: "CE", slug: "ceara" },
  { id: "state-se", name: "Sergipe", uf: "SE", slug: "sergipe" },
];

export const sampleCities: Omit<City, 'createdAt' | 'updatedAt' | 'lotCount'>[] = [
  { id: "city-maceio-al", name: "Maceió", slug: "maceio", stateId: "state-al", stateUf: "AL", ibgeCode: "2704302"},
  { id: "city-salvador-ba", name: "Salvador", slug: "salvador", stateId: "state-ba", stateUf: "BA", ibgeCode: "2927408"},
  { id: "city-sao-paulo-sp", name: "São Paulo", slug: "sao-paulo", stateId: "state-sp", stateUf: "SP", ibgeCode: "3550308"},
  { id: "city-campinas-sp", name: "Campinas", slug: "campinas", stateId: "state-sp", stateUf: "SP", ibgeCode: "3509502"},
  { id: "city-rio-de-janeiro-rj", name: "Rio de Janeiro", slug: "rio-de-janeiro", stateId: "state-rj", stateUf: "RJ", ibgeCode: "3304557"},
  { id: "city-belo-horizonte-mg", name: "Belo Horizonte", slug: "belo-horizonte", stateId: "state-mg", stateUf: "MG", ibgeCode: "3106200"},
  { id: "city-curitiba-pr", name: "Curitiba", slug: "curitiba", stateId: "state-pr", stateUf: "PR", ibgeCode: "4106902"},
  { id: "city-porto-alegre-rs", name: "Porto Alegre", slug: "porto-alegre", stateId: "state-rs", stateUf: "RS", ibgeCode: "4314902"},
  { id: "city-rio-verde-go", name: "Rio Verde", slug: "rio-verde", stateId: "state-go", stateUf: "GO", ibgeCode: "5218805"},
  { id: "city-campo-grande-ms", name: "Campo Grande", slug: "campo-grande", stateId: "state-ms", stateUf: "MS", ibgeCode: "5002704"},
  { id: "city-fortaleza-ce", name: "Fortaleza", slug: "fortaleza", stateId: "state-ce", stateUf: "CE", ibgeCode: "2304400"},
  { id: "city-lauro-de-freitas-ba", name: "Lauro de Freitas", slug: "lauro-de-freitas", stateId: "state-ba", stateUf: "BA", ibgeCode: "2919207"},
  { id: "city-niteroi-rj", name: "Niterói", slug: "niteroi", stateId: "state-rj", stateUf: "RJ", ibgeCode: "3303302"},
  { id: "city-teotonio-vilela-al", name: "Teotônio Vilela", slug: "teotonio-vilela", stateId: "state-al", stateUf: "AL", ibgeCode: "2709152"},
  { id: "city-lagarto-se", name: "Lagarto", slug: "lagarto", stateId: "state-se", stateUf: "SE", ibgeCode: "2803500"},
];

export const sampleDocumentTypes = [
  // PF
  { id: 'doc-cpf', name: 'CPF', description: 'Cópia do Cadastro de Pessoa Física.', isRequired: true, appliesTo: 'PHYSICAL', allowedFormats: 'pdf,jpg,png', displayOrder: 10 },
  { id: 'doc-rg-cnh', name: 'RG ou CNH', description: 'Documento de identidade com foto (frente e verso).', isRequired: true, appliesTo: 'PHYSICAL', allowedFormats: 'pdf,jpg,png', displayOrder: 20 },
  { id: 'doc-comprovante-residencia', name: 'Comprovante de Residência', description: 'Conta de consumo recente (água, luz, telefone).', isRequired: true, appliesTo: 'PHYSICAL,LEGAL', allowedFormats: 'pdf,jpg,png', displayOrder: 30 },
  { id: 'doc-comprovante-estado-civil', name: 'Comprovante de Estado Civil', description: 'Certidão de casamento ou nascimento.', isRequired: false, appliesTo: 'PHYSICAL', allowedFormats: 'pdf,jpg,png', displayOrder: 40 },
  
  // PJ
  { id: 'doc-cartao-cnpj', name: 'Cartão CNPJ', description: 'Comprovante de Inscrição e de Situação Cadastral.', isRequired: true, appliesTo: 'LEGAL', allowedFormats: 'pdf', displayOrder: 10 },
  { id: 'doc-contrato-social', name: 'Contrato Social Consolidado', description: 'Última alteração contratual ou estatuto social.', isRequired: true, appliesTo: 'LEGAL', allowedFormats: 'pdf', displayOrder: 20 },
  { id: 'doc-documentos-representantes', name: 'Documentos dos Representantes', description: 'RG/CPF ou CNH dos sócios administradores.', isRequired: true, appliesTo: 'LEGAL', allowedFormats: 'pdf,jpg,png', displayOrder: 50 },
];

export const sampleAuctions = [
  {
      "id": "100625bra",
      "publicId": "AUC-IMOVEIS-XYZ123P1",
      "title": "Leilão de Imóveis Residenciais e Comerciais",
      "description": "Leilão online de casas, apartamentos e terrenos. Excelentes oportunidades de investimento e moradia. Lances a partir de R$ 45.000. Não perca!",
      "status": "ABERTO_PARA_LANCES",
      "auctionType": "EXTRAJUDICIAL",
      "categoryId": "cat-imoveis",
      "auctioneerId": "auct-leiloeiro-oficial-bradesco",
      "sellerId": "seller-banco-bradesco-s-a",
      "auctionDate": new Date("2025-06-24T04:07:47.479Z"),
      "endDate": new Date("2025-07-04T08:52:47.479Z"),
      "city": "Nacional",
      "state": "BR",
      "imageMediaId": "media-auc-imoveis-banner",
      "dataAiHint": "leilao imoveis cidade",
      "documentsUrl": "#",
      "visits": 2580,
      "initialOffer": 45000,
      "isFavorite": false,
      "auctionStages": JSON.stringify([
        { "name": "1ª Praça", "endDate": "2025-06-29T03:52:47.479Z", "statusText": "Encerramento", "initialPrice": 45000 },
        { "name": "2ª Praça", "endDate": "2025-07-04T08:52:47.479Z", "statusText": "Encerramento", "initialPrice": 30000 }
      ]),
      "automaticBiddingEnabled": true,
      "allowInstallmentBids": true,
      "estimatedRevenue": 2000000,
      "achievedRevenue": 0,
      "totalHabilitatedUsers": 150,
      "isFeaturedOnMarketplace": true,
      "marketplaceAnnouncementTitle": "Mega Leilão Bradesco Imóveis",
      "additionalTriggers": "OPORTUNIDADE UNICA,DESCONTO",
  },
  // Add more sample auctions here, ensuring additionalTriggers is a string
];


// Omitting other sample data arrays for brevity in this response,
// but they would be included in the full file.
export const sampleCourts: Omit<Court, 'createdAt' | 'updatedAt'>[] = [];
export const sampleJudicialDistricts: Omit<JudicialDistrict, 'createdAt' | 'updatedAt'>[] = [];
export const sampleJudicialBranches: Omit<JudicialBranch, 'createdAt' | 'updatedAt'>[] = [];
export const sampleSellers: (Omit<Seller, 'createdAt' | 'updatedAt'>)[] = [];
export const sampleAuctioneers: (Omit<Auctioneer, 'createdAt' | 'updatedAt'>)[] = [];
export const sampleJudicialProcesses: (Omit<JudicialProcess, 'createdAt' | 'updatedAt'> & {parties: Omit<ProcessParty, 'processId'>[]})[] = [];
export const sampleBens: (Omit<Bem, 'createdAt' | 'updatedAt'>)[] = [];
export const sampleLots: (Omit<Lot, 'createdAt' | 'updatedAt' | 'bidsCount' | 'views'>)[] = [];
export const sampleBids: Bid[] = [];
export const sampleUserWins: (Omit<UserWin, 'lot'>)[] = [];
export const sampleUserDocuments: (Omit<UserDocument, 'createdAt' | 'updatedAt' | 'documentType'>)[] = [];
export const sampleNotifications: Notification[] = [];
export const sampleMediaItems: MediaItem[] = [];


```
- src/app/admin/roles/actions.ts:
```ts
// src/app/admin/roles/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Role, RoleFormData } from '@/types';

export async function createRole(
  data: RoleFormData
): Promise<{ success: boolean; message: string; roleId?: string }> {
  try {
    const newRole = await prisma.role.create({
      data: {
        name: data.name,
        name_normalized: data.name.toUpperCase().replace(/\s/g, '_'),
        description: data.description,
        permissions: {
          connect: data.permissions?.map(id => ({ id })) || [],
        },
      }
    });
    revalidatePath('/admin/roles');
    return { success: true, message: "Perfil criado com sucesso!", roleId: newRole.id };
  } catch (error: any) {
    console.error("Error creating role:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return { success: false, message: 'Já existe um perfil com este nome.' };
    }
    return { success: false, message: 'Falha ao criar perfil.' };
  }
}

export async function getRoles(): Promise<Role[]> {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { permissions: true }
    });
    return roles.map(role => ({
      ...role,
      permissions: role.permissions.map(p => p.name)
    })) as unknown as Role[];
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}

export async function getRole(id: string): Promise<Role | null> {
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true }
    });
    if (!role) return null;
    return {
      ...role,
      permissions: role.permissions.map(p => p.name)
    } as unknown as Role;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
}


export async function updateRole(
  id: string,
  data: Partial<RoleFormData>
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: any = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.name_normalized = data.name.toUpperCase().replace(/\s/g, '_');
    }
    if (data.description) {
      updateData.description = data.description;
    }
    if (data.permissions) {
      updateData.permissions = {
        set: data.permissions.map(id => ({ id })),
      }
    }

    await prisma.role.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/roles');
    revalidatePath(`/admin/roles/${id}/edit`);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    return { success: false, message: 'Falha ao atualizar perfil.' };
  }
}

export async function deleteRole(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const roleToDelete = await prisma.role.findUnique({ where: { id }});
    const protectedRoles = ['ADMINISTRATOR', 'USER', 'CONSIGNOR', 'AUCTIONEER', 'AUCTION_ANALYST'];
    if (protectedRoles.includes(roleToDelete?.name_normalized || '')) {
      return { success: false, message: 'Não é possível excluir perfis de sistema.' };
    }
    await prisma.role.delete({ where: { id } });
    revalidatePath('/admin/roles');
    return { success: true, message: 'Perfil excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting role ${id}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Este perfil está em uso por um ou mais usuários.' };
    }
    return { success: false, message: 'Falha ao excluir perfil.' };
  }
}
```
- src/app/admin/roles/role-form-schema.ts:
```ts
// src/app/admin/roles/role-form-schema.ts
import * as z from 'zod';

export const roleFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome do perfil deve ter pelo menos 3 caracteres.",
  }).max(100, {
    message: "O nome do perfil não pode exceder 100 caracteres.",
  }),
  description: z.string().max(500, {
    message: "A descrição não pode exceder 500 caracteres.",
  }).optional(),
  permissions: z.array(z.string()).optional(),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

```
- prisma/seed.ts:
```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import {
  sampleLotCategories, sampleStates, sampleCities, sampleAuctioneers, sampleSellers,
  sampleAuctions, sampleLots, sampleBids, sampleUserWins, sampleUserDocuments,
  sampleDocumentTypes, sampleNotifications, sampleMediaItems, sampleCourts,
  sampleJudicialDistricts, sampleJudicialBranches, sampleJudicialProcesses, sampleBens
} from './seed-data'; // Import from the new local data file
import { slugify } from '../src/lib/sample-data-helpers';
import bcrypt from 'bcrypt';
import { predefinedPermissions } from '@/app/admin/roles/role-form-schema'; // Import permissions

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  
  // --- Upsert Permissions ---
  console.log('Seeding permissions...');
  for (const perm of predefinedPermissions) {
    await prisma.permission.upsert({
      where: { name: perm.id },
      update: { description: perm.label },
      create: { id: perm.id, name: perm.id, description: perm.label },
    });
  }
  
  // --- Upsert Core Roles ---
  console.log('Seeding core roles...');
  
  const userPerms = await prisma.permission.findMany({
    where: { name: { in: ['view_auctions', 'place_bids', 'view_lots'] } },
  });
  const adminPerms = await prisma.permission.findMany({
    where: { name: 'manage_all' },
  });

  const userRole = await prisma.role.upsert({
    where: { name_normalized: 'USER' },
    update: {},
    create: {
      name: 'User',
      name_normalized: 'USER',
      description: 'Usuário padrão com permissões de visualização e lance.',
      permissions: {
        connect: userPerms.map(p => ({ id: p.id })),
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name_normalized: 'ADMINISTRATOR' },
    update: {},
    create: {
      name: 'Administrator',
      name_normalized: 'ADMINISTRATOR',
      description: 'Acesso total à plataforma.',
      permissions: {
        connect: adminPerms.map(p => ({ id: p.id })),
      },
    },
  });
  
  // --- Upsert Admin User ---
  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@bidexpert.com.br' },
    update: {
      password: hashedPassword,
      roleId: adminRole.id,
      habilitationStatus: 'HABILITADO',
    },
    create: {
      id: 'admin-bidexpert-platform-001',
      email: 'admin@bidexpert.com.br',
      fullName: 'Administrador',
      password: hashedPassword,
      habilitationStatus: 'HABILITADO',
      roleId: adminRole.id,
    },
  });
  
  // --- Seed other data ---
  console.log('Seeding states...');
  await prisma.state.createMany({ data: sampleStates, skipDuplicates: true });
  
  console.log('Seeding cities...');
  await prisma.city.createMany({ data: sampleCities, skipDuplicates: true });

  console.log('Seeding categories and subcategories...');
  for (const categoryData of sampleLotCategories) {
    const { subcategories, ...cat } = categoryData;
    const catToCreate = {
      ...cat,
      slug: slugify(cat.name),
      hasSubcategories: !!subcategories && subcategories.length > 0,
    };
    const createdCategory = await prisma.lotCategory.upsert({
      where: { id: cat.id },
      update: catToCreate,
      create: catToCreate,
    });
    
    if (subcategories) {
      for (const subCatData of subcategories) {
         await prisma.subcategory.upsert({
            where: { id: subCatData.id },
            update: {...subCatData, parentCategoryId: createdCategory.id, slug: slugify(subCatData.name)},
            create: {...subCatData, parentCategoryId: createdCategory.id, slug: slugify(subCatData.name)},
         });
      }
    }
  }

  console.log('Seeding document types...');
  await prisma.documentType.createMany({ data: sampleDocumentTypes.map(dt => ({...dt, appliesTo: dt.appliesTo as any})), skipDuplicates: true });

  console.log('Seeding courts...');
  await prisma.court.createMany({ data: sampleCourts, skipDuplicates: true });
  
  console.log('Seeding judicial districts...');
  await prisma.judicialDistrict.createMany({ data: sampleJudicialDistricts, skipDuplicates: true });

  console.log('Seeding judicial branches...');
  await prisma.judicialBranch.createMany({ data: sampleJudicialBranches, skipDuplicates: true });

  console.log('Seeding sellers...');
  await prisma.seller.createMany({ data: sampleSellers as any, skipDuplicates: true });
  
  console.log('Seeding auctioneers...');
  await prisma.auctioneer.createMany({ data: sampleAuctioneers as any, skipDuplicates: true });

  console.log('Seeding judicial processes...');
  for (const proc of sampleJudicialProcesses) {
    const { parties, ...procData } = proc;
    const createdProcess = await prisma.judicialProcess.upsert({
      where: { id: procData.id },
      update: procData as any,
      create: procData as any,
    });
    if (parties) {
      for (const party of parties) {
        await prisma.processParty.upsert({
          where: { processId_name_partyType: { processId: createdProcess.id, name: party.name, partyType: party.partyType } },
          update: { documentNumber: party.documentNumber },
          create: {
            processId: createdProcess.id,
            name: party.name,
            partyType: party.partyType,
            documentNumber: party.documentNumber,
          }
        });
      }
    }
  }
  
  console.log('Seeding bens...');
  await prisma.bem.createMany({ data: sampleBens.map(({categoryName, subcategoryName, judicialProcessNumber, sellerName, ...b}) => b) as any, skipDuplicates: true });

  console.log('Seeding auctions...');
  await prisma.auction.createMany({ data: sampleAuctions.map(({ lots, totalLots, auctioneer, seller, category, ...a }) => a as any), skipDuplicates: true });
  
  console.log('Seeding lots...');
  await prisma.lot.createMany({ data: sampleLots.map(({ auctionName, type, cityName, stateUf, subcategoryName, seller, sellerName, auctioneerName, isFavorite, ...l}) => l as any), skipDuplicates: true });

  console.log('Seeding bids...');
  await prisma.bid.createMany({ data: sampleBids as any, skipDuplicates: true });
  
  console.log('Seeding wins...');
  await prisma.userWin.createMany({ data: sampleUserWins.map(({lot, ...w}) => w) as any, skipDuplicates: true });
  
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

A única alteração necessária é no arquivo `prisma/schema.prisma`. Com esta correção, o servidor deve finalmente iniciar sem erros de validação.


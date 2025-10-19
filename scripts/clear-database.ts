/**
 * @fileoverview Script para limpar o banco de dados, usando os serviços para garantir que a lógica de negócio seja aplicada.
 * 
 * Para executar: `npx tsx scripts/clear-database.ts`
 */
import { LotService } from '../src/services/lot.service';
import { AuctionService } from '../src/services/auction.service';
import { AssetService } from '../src/services/asset.service';
import { UserService } from '../src/services/user.service';
import { SellerService } from '../src/services/seller.service';
import { AuctioneerService } from '../src/services/auctioneer.service';
import { JudicialProcessService } from '../src/services/judicial-process.service';
import { DirectSaleOfferService } from '../src/services/direct-sale-offer.service';
import { UserWinService } from '../src/services/user-win.service';
import { ContactMessageService } from '../src/services/contact-message.service';
import { DocumentTemplateService } from '../src/services/document-template.service';
import { SubcategoryService } from '../src/services/subcategory.service';
import { CategoryService } from '../src/services/category.service';
import { JudicialBranchService } from '../src/services/judicial-branch.service';
import { JudicialDistrictService } from '../src/services/judicial-district.service';
import { CourtService } from '../src/services/court.service';
import { CityService } from '../src/services/city.service';
import { StateService } from '../src/services/state.service';
import { RoleService } from '../src/services/role.service';
import { prisma } from '../src/lib/prisma';

const log = (message: string) => console.log(`- ${message}`);

async function clearDatabase() {
  log('Iniciando limpeza do banco de dados...');

  const tenantId = '1'; // Hardcoded para o tenant principal

  // Instanciando todos os serviços necessários
  const lotService = new LotService();
  const auctionService = new AuctionService();
  const assetService = new AssetService();
  const userService = new UserService();
  const sellerService = new SellerService();
  const auctioneerService = new AuctioneerService();
  const judicialProcessService = new JudicialProcessService();
  const directSaleOfferService = new DirectSaleOfferService();
  const userWinService = new UserWinService();
  const contactMessageService = new ContactMessageService();
  const documentTemplateService = new DocumentTemplateService();
  const subcategoryService = new SubcategoryService();
  const categoryService = new CategoryService();
  const judicialBranchService = new JudicialBranchService();
  const judicialDistrictService = new JudicialDistrictService();
  const courtService = new CourtService();
  const cityService = new CityService();
  const stateService = new StateService();
  const roleService = new RoleService();

  // A ordem de exclusão é importante para evitar erros de chave estrangeira.
  // Começamos das entidades que mais dependem de outras.

  log('Excluindo UserWins...');
  await userWinService.deleteAllUserWins();

  log('Excluindo Lotes e seus dados relacionados...');
  await lotService.deleteAllLots(tenantId);

  log('Excluindo Leilões...');
  await auctionService.deleteAllAuctions(tenantId);

  log('Excluindo Ativos...');
  await assetService.deleteAllAssets(tenantId);

  log('Excluindo Ofertas de Venda Direta...');
  await directSaleOfferService.deleteAllDirectSaleOffers(tenantId);

  log('Excluindo Processos Judiciais...');
  await judicialProcessService.deleteAllJudicialProcesses(tenantId);

  log('Excluindo Comitentes (Sellers)...');
  await sellerService.deleteAllSellers(tenantId);

  log('Excluindo Leiloeiros (Auctioneers)...');
  await auctioneerService.deleteAllAuctioneers(tenantId);

  log('Excluindo Usuários (não-admin)...');
  await userService.deleteAllUsers();

  log('Excluindo Mensagens de Contato...');
  await contactMessageService.deleteAllContactMessages();

  log('Excluindo Templates de Documento...');
  await documentTemplateService.deleteAllDocumentTemplates();

  log('Excluindo Subcategorias...');
  await subcategoryService.deleteAllSubcategories();

  log('Excluindo Categorias...');
  await categoryService.deleteAllCategories();

  log('Excluindo Varas Judiciais...');
  await judicialBranchService.deleteAllJudicialBranches();

  log('Excluindo Comarcas...');
  await judicialDistrictService.deleteAllJudicialDistricts();

  log('Excluindo Tribunais...');
  await courtService.deleteAllCourts();

  log('Excluindo Cidades...');
  await cityService.deleteAllCities();

  log('Excluindo Estados...');
  await stateService.deleteAllStates();

  log('Excluindo Perfis (não-essenciais)...');
  await roleService.deleteAllNonEssentialRoles();

  log('Limpeza do banco de dados concluída com sucesso!');
}

clearDatabase()
  .catch((e) => {
    console.error('Ocorreu um erro durante a limpeza do banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

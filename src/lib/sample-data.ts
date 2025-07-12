
// src/lib/sample-data.ts
import { slugify } from './sample-data-helpers';
import type { StateInfo, CityInfo } from '@/types';

// Renomeado para evitar conflito de nome com as constantes exportadas
import sampleData from '../sample-data.local.json';

// Exportando os dados do JSON importado
export const sampleLotCategories = (sampleData as any).sampleLotCategories || [];
export const sampleSubcategories = (sampleData as any).sampleSubcategories || [];
export const sampleUsers = (sampleData as any).sampleUsers || [];
export const sampleRoles = (sampleData as any).sampleRoles || [];
export const sampleAuctioneers = (sampleData as any).sampleAuctioneers || [];
export const sampleSellers = (sampleData as any).sampleSellers || [];
export const sampleAuctions = (sampleData as any).sampleAuctions || [];
export const sampleLots = (sampleData as any).sampleLots || [];
export const sampleDirectSaleOffers = (sampleData as any).sampleDirectSaleOffers || [];
export const sampleDocumentTypes = (sampleData as any).sampleDocumentTypes || [];
export const sampleNotifications = (sampleData as any).sampleNotifications || [];
export const sampleBids = (sampleData as any).sampleBids || [];
export const sampleUserWins = (sampleData as any).sampleUserWins || [];
export const sampleMediaItems = (sampleData as any).sampleMediaItems || [];
export const sampleCourts = (sampleData as any).sampleCourts || [];
export const sampleJudicialDistricts = (sampleData as any).sampleJudicialDistricts || [];
export const sampleJudicialBranches = (sampleData as any).sampleJudicialBranches || [];
export const sampleJudicialProcesses = (sampleData as any).sampleJudicialProcesses || [];
export const sampleBens = (sampleData as any).sampleBens || [];
export const samplePlatformSettings = (sampleData as any).samplePlatformSettings || {};
export const sampleContactMessages = (sampleData as any).sampleContactMessages || [];

const sampleStatesData: Omit<StateInfo, 'id' | 'slug' | 'cityCount'>[] = [
    { name: 'Acre', uf: 'AC' }, { name: 'Alagoas', uf: 'AL' }, { name: 'Amapá', uf: 'AP' },
    { name: 'Amazonas', uf: 'AM' }, { name: 'Bahia', uf: 'BA' }, { name: 'Ceará', uf: 'CE' },
    { name: 'Distrito Federal', uf: 'DF' }, { name: 'Espírito Santo', uf: 'ES' }, { name: 'Goiás', uf: 'GO' },
    { name: 'Maranhão', uf: 'MA' }, { name: 'Mato Grosso', uf: 'MT' }, { name: 'Mato Grosso do Sul', uf: 'MS' },
    { name: 'Minas Gerais', uf: 'MG' }, { name: 'Pará', uf: 'PA' }, { name: 'Paraíba', uf: 'PB' },
    { name: 'Paraná', uf: 'PR' }, { name: 'Pernambuco', uf: 'PE' }, { name: 'Piauí', uf: 'PI' },
    { name: 'Rio de Janeiro', uf: 'RJ' }, { name: 'Rio Grande do Norte', uf: 'RN' }, { name: 'Rio Grande do Sul', uf: 'RS' },
    { name: 'Rondônia', uf: 'RO' }, { name: 'Roraima', uf: 'RR' }, { name: 'Santa Catarina', uf: 'SC' },
    { name: 'São Paulo', uf: 'SP' }, { name: 'Sergipe', uf: 'SE' }, { name: 'Tocantins', uf: 'TO' }
];

const sampleCitiesData: Omit<CityInfo, 'id' | 'slug' | 'stateId' | 'lotCount'>[] = [
  // Cidades do Acre (AC)
  { name: 'Acrelândia', stateUf: 'AC', ibgeCode: '1200013'}, { name: 'Assis Brasil', stateUf: 'AC', ibgeCode: '1200054'},
  { name: 'Brasiléia', stateUf: 'AC', ibgeCode: '1200104'}, { name: 'Bujari', stateUf: 'AC', ibgeCode: '1200138'},
  { name: 'Capixaba', stateUf: 'AC', ibgeCode: '1200179'}, { name: 'Cruzeiro do Sul', stateUf: 'AC', ibgeCode: '1200203'},
  { name: 'Epitaciolândia', stateUf: 'AC', ibgeCode: '1200252'}, { name: 'Feijó', stateUf: 'AC', ibgeCode: '1200302'},
  { name: 'Jordão', stateUf: 'AC', ibgeCode: '1200328'}, { name: 'Mâncio Lima', stateUf: 'AC', ibgeCode: '1200336'},
  { name: 'Manoel Urbano', stateUf: 'AC', ibgeCode: '1200351'}, { name: 'Marechal Thaumaturgo', stateUf: 'AC', ibgeCode: '1200344'},
  { name: 'Plácido de Castro', stateUf: 'AC', ibgeCode: '1200385'}, { name: 'Porto Acre', stateUf: 'AC', ibgeCode: '1200807'},
  { name: 'Porto Walter', stateUf: 'AC', ibgeCode: '1200393'}, { name: 'Rio Branco', stateUf: 'AC', ibgeCode: '1200401'},
  { name: 'Rodrigues Alves', stateUf: 'AC', ibgeCode: '1200427'}, { name: 'Santa Rosa do Purus', stateUf: 'AC', ibgeCode: '1200435'},
  { name: 'Sena Madureira', stateUf: 'AC', ibgeCode: '1200500'}, { name: 'Senador Guiomard', stateUf: 'AC', ibgeCode: '1200450'},
  { name: 'Tarauacá', stateUf: 'AC', ibgeCode: '1200609'}, { name: 'Xapuri', stateUf: 'AC', ibgeCode: '1200708'},
  { name: 'Maceió', stateUf: 'AL', ibgeCode: '2704302'}, { name: 'Arapiraca', stateUf: 'AL', ibgeCode: '2700300'},
  { name: 'Macapá', stateUf: 'AP', ibgeCode: '1600303'}, { name: 'Santana', stateUf: 'AP', ibgeCode: '1600600'},
  { name: 'Manaus', stateUf: 'AM', ibgeCode: '1302603'}, { name: 'Parintins', stateUf: 'AM', ibgeCode: '1303403'},
  { name: 'Salvador', stateUf: 'BA', ibgeCode: '2927408'}, { name: 'Feira de Santana', stateUf: 'BA', ibgeCode: '2910800'},
  { name: 'Fortaleza', stateUf: 'CE', ibgeCode: '2304400'}, { name: 'Caucaia', stateUf: 'CE', ibgeCode: '2303709'},
  { name: 'Brasília', stateUf: 'DF', ibgeCode: '5300108'},
  { name: 'Vitória', stateUf: 'ES', ibgeCode: '3205309'}, { name: 'Vila Velha', stateUf: 'ES', ibgeCode: '3205200'},
  { name: 'Goiânia', stateUf: 'GO', ibgeCode: '5208707'}, { name: 'Aparecida de Goiânia', stateUf: 'GO', ibgeCode: '5201108'},
  { name: 'São Luís', stateUf: 'MA', ibgeCode: '2111300'}, { name: 'Imperatriz', stateUf: 'MA', ibgeCode: '2105302'},
  { name: 'Belo Horizonte', stateUf: 'MG', ibgeCode: '3106200'}, { name: 'Uberlândia', stateUf: 'MG', ibgeCode: '3170206'},
  { name: 'Campo Grande', stateUf: 'MS', ibgeCode: '5002704'}, { name: 'Dourados', stateUf: 'MS', ibgeCode: '5003488'},
  { name: 'Cuiabá', stateUf: 'MT', ibgeCode: '5103403'}, { name: 'Várzea Grande', stateUf: 'MT', ibgeCode: '5108402'},
  { name: 'Belém', stateUf: 'PA', ibgeCode: '1501402'}, { name: 'Ananindeua', stateUf: 'PA', ibgeCode: '1500800'},
  { name: 'João Pessoa', stateUf: 'PB', ibgeCode: '2507507'}, { name: 'Campina Grande', stateUf: 'PB', ibgeCode: '2504009'},
  { name: 'Recife', stateUf: 'PE', ibgeCode: '2611606'}, { name: 'Jaboatão dos Guararapes', stateUf: 'PE', ibgeCode: '2607901'},
  { name: 'Teresina', stateUf: 'PI', ibgeCode: '2211001'}, { name: 'Parnaíba', stateUf: 'PI', ibgeCode: '2207702'},
  { name: 'Curitiba', stateUf: 'PR', ibgeCode: '4106902'}, { name: 'Londrina', stateUf: 'PR', ibgeCode: '4113700'},
  { name: 'Rio de Janeiro', stateUf: 'RJ', ibgeCode: '3304557'}, { name: 'São Gonçalo', stateUf: 'RJ', ibgeCode: '3304904'},
  { name: 'Natal', stateUf: 'RN', ibgeCode: '2408102'}, { name: 'Mossoró', stateUf: 'RN', ibgeCode: '2408003'},
  { name: 'Porto Velho', stateUf: 'RO', ibgeCode: '1100205'}, { name: 'Ji-Paraná', stateUf: 'RO', ibgeCode: '1100122'},
  { name: 'Boa Vista', stateUf: 'RR', ibgeCode: '1400100'}, { name: 'Rorainópolis', stateUf: 'RR', ibgeCode: '1400472'},
  { name: 'Porto Alegre', stateUf: 'RS', ibgeCode: '4314902'}, { name: 'Caxias do Sul', stateUf: 'RS', ibgeCode: '4305108'},
  { name: 'Florianópolis', stateUf: 'SC', ibgeCode: '4205407'}, { name: 'Joinville', stateUf: 'SC', ibgeCode: '4209102'},
  { name: 'Aracaju', stateUf: 'SE', ibgeCode: '2800308'}, { name: 'Nossa Senhora do Socorro', stateUf: 'SE', ibgeCode: '2804607'},
  { name: 'São Paulo', stateUf: 'SP', ibgeCode: '3550308'}, { name: 'Guarulhos', stateUf: 'SP', ibgeCode: '3518800'},
  { name: 'Palmas', stateUf: 'TO', ibgeCode: '1721000'}, { name: 'Araguaína', stateUf: 'TO', ibgeCode: '1702109'}
];

export function getSampleStatesAndCities() {
    const states = sampleStatesData.map(s => ({
        ...s,
        id: `state-${s.uf.toLowerCase()}`,
        slug: slugify(s.name)
    })) as StateInfo[];

    const cities = sampleCitiesData.map(c => {
        const parentState = states.find(s => s.uf === c.stateUf);
        return {
            ...c,
            id: `city-${slugify(c.name)}-${c.stateUf.toLowerCase()}`,
            slug: slugify(c.name),
            stateId: parentState?.id || '',
        };
    }) as CityInfo[];

    return { states, cities };
}

export const { states: sampleStates, cities: sampleCities } = getSampleStatesAndCities();


// Helper function to link data
export function getSampleData() {

  const auctions = sampleAuctions.map(auction => {
    const lotsForAuction = sampleLots.filter(lot => lot.auctionId === auction.id);
    return {
      ...auction,
      lots: lotsForAuction,
      totalLots: lotsForAuction.length,
      category: sampleLotCategories.find(c => c.id === auction.categoryId)?.name || auction.category,
      auctioneer: sampleAuctioneers.find(a => a.id === auction.auctioneerId)?.name || auction.auctioneer,
      seller: sampleSellers.find(s => s.id === auction.sellerId)?.name || auction.seller,
    };
  });
  
  const lots = sampleLots.map(lot => {
    const parentAuction = auctions.find(a => a.id === lot.auctionId);
    return {
      ...lot,
      auctionName: parentAuction?.title,
      type: sampleLotCategories.find(c => c.id === lot.categoryId)?.name || lot.type,
      subcategoryName: sampleSubcategories.find(s => s.id === lot.subcategoryId)?.name,
      cityName: sampleCities.find(c => c.id === lot.cityId)?.name,
      stateUf: sampleStates.find(s => s.id === lot.stateId)?.uf,
      bens: sampleBens.filter(b => lot.bemIds?.includes(b.id)),
    };
  });
  
  const usersWithRoles = sampleUsers.map(user => {
      const role = sampleRoles.find(r => r.id === user.roleId);
      return {
          ...user,
          roleName: role?.name || 'USER',
          permissions: role?.permissions || ['view_auctions', 'place_bids']
      };
  });
  
  const judicialProcessesWithDetails = sampleJudicialProcesses.map(proc => ({
    ...proc,
    courtName: sampleCourts.find(c => c.id === proc.courtId)?.name,
    districtName: sampleJudicialDistricts.find(d => d.id === proc.districtId)?.name,
    branchName: sampleJudicialBranches.find(b => b.id === proc.branchId)?.name,
    sellerName: sampleSellers.find(s => s.id === proc.sellerId)?.name,
  }));
  
  const bensWithDetails = sampleBens.map(bem => ({
    ...bem,
    categoryName: sampleLotCategories.find(c => c.id === bem.categoryId)?.name,
    subcategoryName: sampleSubcategories.find(s => s.id === bem.subcategoryId)?.name,
    judicialProcessNumber: judicialProcessesWithDetails.find(p => p.id === bem.judicialProcessId)?.processNumber,
    sellerName: sampleSellers.find(s => s.id === bem.sellerId)?.name,
  }));
  
  const userWinsWithDetails = sampleUserWins.map(win => ({
      ...win,
      lot: lots.find(l => l.id === win.lotId),
  }));

  const userBidsWithDetails = sampleBids.map(bid => {
      const lot = lots.find(l => l.id === bid.lotId);
      let bidStatus: string = 'PERDENDO';
      if (lot) {
        if (lot.price === bid.amount) {
            bidStatus = 'GANHANDO';
        }
        if (lot.status === 'VENDIDO' && lot.winnerId === bid.bidderId) {
            bidStatus = 'ARREMATADO';
        } else if (lot.status === 'VENDIDO') {
            bidStatus = 'NAO_ARREMATADO';
        }
      }
      return {
          ...bid,
          lot: lot,
          bidStatus: bidStatus,
      };
  });
  
  const citiesWithDetails = sampleCities.map(city => ({
      ...city,
      stateName: sampleStates.find(s => s.id === city.stateId)?.name,
      stateUf: sampleStates.find(s => s.id === city.stateId)?.uf
  }));
  
  const subcategoriesWithDetails = sampleSubcategories.map(sub => ({
      ...sub,
      parentCategoryName: sampleLotCategories.find(c => c.id === sub.parentCategoryId)?.name,
      itemCount: lots.filter(l => l.subcategoryId === sub.id).length
  }));
  
  const categoriesWithDetails = sampleLotCategories.map(cat => ({
      ...cat,
      hasSubcategories: subcategoriesWithDetails.some(s => s.parentCategoryId === cat.id),
      itemCount: lots.filter(l => l.categoryId === cat.id).length,
  }));


  return {
    auctions,
    lots,
    usersWithRoles,
    sampleRoles,
    categoriesWithDetails,
    sampleAuctioneers,
    sampleSellers,
    sampleStates,
    citiesWithDetails,
    subcategoriesWithDetails,
    sampleDirectSaleOffers,
    sampleDocumentTypes,
    sampleNotifications,
    userBidsWithDetails,
    userWinsWithDetails,
    sampleMediaItems,
    sampleCourts,
    sampleJudicialDistricts,
    sampleJudicialBranches,
    judicialProcessesWithDetails,
    bensWithDetails,
    samplePlatformSettings,
    sampleContactMessages
  };
}

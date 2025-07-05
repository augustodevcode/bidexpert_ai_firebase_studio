import { createAuction } from './actions';
import { getDatabaseAdapter } from '@/lib/database';
import { getLotCategoryByName } from '@/app/admin/categories/actions';
import { getAuctioneerByName } from '@/app/admin/auctioneers/actions';
import { getSellerByName } from '@/app/admin/sellers/actions';
import { revalidatePath } from 'next/cache';
import type { AuctionFormData, IDatabaseAdapter, LotCategory, AuctioneerProfileInfo, SellerProfileInfo } from '@/types';

// Mockear os módulos
jest.mock('@/lib/database');
jest.mock('@/app/admin/categories/actions');
jest.mock('@/app/admin/auctioneers/actions');
jest.mock('@/app/admin/sellers/actions');
jest.mock('next/cache');

// Tipar os mocks
const mockGetDatabaseAdapter = getDatabaseAdapter as jest.MockedFunction<typeof getDatabaseAdapter>;
const mockGetLotCategoryByName = getLotCategoryByName as jest.MockedFunction<typeof getLotCategoryByName>;
const mockGetAuctioneerByName = getAuctioneerByName as jest.MockedFunction<typeof getAuctioneerByName>;
const mockGetSellerByName = getSellerByName as jest.MockedFunction<typeof getSellerByName>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('createAuction Server Action', () => {
  let adapterMock: jest.Mocked<Pick<IDatabaseAdapter, 'createAuction'>>; // Mockar apenas os métodos do adapter que serão usados

  beforeEach(() => {
    jest.clearAllMocks();

    adapterMock = {
      createAuction: jest.fn(),
    };
    mockGetDatabaseAdapter.mockReturnValue(adapterMock as any);
  });

  const validAuctionFormData: AuctionFormData = {
    title: 'Leilão Teste Válido',
    status: 'EM_BREVE',
    category: 'Eletrônicos', // Nome da categoria
    auctioneer: 'Leiloeiro Teste', // Nome do leiloeiro
    seller: 'Vendedor Teste', // Nome do vendedor
    auctionDate: new Date(2025, 0, 15, 10, 0, 0), // Data futura
    // Opcionais
    fullTitle: 'Leilão Teste Válido de Eletrônicos Diversos',
    description: 'Um leilão de teste com vários itens eletrônicos.',
    auctionType: 'EXTRAJUDICIAL',
    endDate: new Date(2025, 0, 20, 18, 0, 0),
    city: 'Cidade Teste',
    state: 'TS',
    imageUrl: 'https://example.com/image.jpg',
    documentsUrl: 'https://example.com/docs.pdf',
    sellingBranch: 'Filial Teste',
  };

  const mockCategory: Partial<LotCategory> = { id: 'cat123', name: 'Eletrônicos' };
  const mockAuctioneer: Partial<AuctioneerProfileInfo> = { id: 'auc123', name: 'Leiloeiro Teste' };
  const mockSeller: Partial<SellerProfileInfo> = { id: 'sel123', name: 'Vendedor Teste' };

  // Teste 1: Criação de leilão bem-sucedida
  it('Teste 1: should create an auction successfully when all dependencies resolve', async () => {
    mockGetLotCategoryByName.mockResolvedValue(mockCategory as LotCategory);
    mockGetAuctioneerByName.mockResolvedValue(mockAuctioneer as AuctioneerProfileInfo);
    mockGetSellerByName.mockResolvedValue(mockSeller as SellerProfileInfo);
    adapterMock.createAuction.mockResolvedValue({ success: true, auctionId: 'mockAuctionId123', auctionPublicId: 'pubAuc123', message: 'Leilão criado!' });

    const result = await createAuction(validAuctionFormData);

    expect(mockGetLotCategoryByName).toHaveBeenCalledWith(validAuctionFormData.category);
    expect(mockGetAuctioneerByName).toHaveBeenCalledWith(validAuctionFormData.auctioneer);
    expect(mockGetSellerByName).toHaveBeenCalledWith(validAuctionFormData.seller);

    expect(adapterMock.createAuction).toHaveBeenCalledWith(expect.objectContaining({
      title: validAuctionFormData.title,
      status: validAuctionFormData.status,
      auctionDate: validAuctionFormData.auctionDate,
      categoryId: mockCategory.id,
      auctioneerId: mockAuctioneer.id,
      sellerId: mockSeller.id,
      // A action createAuction atualmente passa os nomes também para AuctionDbData,
      // embora o adapter vá priorizar os IDs. Idealmente, a action limparia esses campos.
      category: validAuctionFormData.category,
      auctioneer: validAuctionFormData.auctioneer,
      seller: validAuctionFormData.seller,
    }));
    // const adapterCallArg = adapterMock.createAuction.mock.calls[0][0];
    // expect(adapterCallArg.category).toBeUndefined(); // Teste ideal se a action limpasse os nomes
    // expect(adapterCallArg.auctioneer).toBeUndefined(); // Teste ideal
    // expect(adapterCallArg.seller).toBeUndefined(); // Teste ideal


    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/auctions');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/consignor-dashboard/overview');
    expect(result.success).toBe(true);
    expect(result.auctionId).toBe('mockAuctionId123');
    expect(result.message).toBe('Leilão criado!');
  });

  it('should create an auction successfully even if seller is not provided (optional)', async () => {
    const dataWithoutSeller = { ...validAuctionFormData };
    delete dataWithoutSeller.seller; // seller é opcional

    mockGetLotCategoryByName.mockResolvedValue(mockCategory as LotCategory);
    mockGetAuctioneerByName.mockResolvedValue(mockAuctioneer as AuctioneerProfileInfo);
    // getSellerByName não deve ser chamado
    adapterMock.createAuction.mockResolvedValue({ success: true, auctionId: 'mockAuctionId456', auctionPublicId: 'pubAuc456', message: 'Leilão criado!' });

    const result = await createAuction(dataWithoutSeller);

    expect(mockGetLotCategoryByName).toHaveBeenCalledWith(dataWithoutSeller.category);
    expect(mockGetAuctioneerByName).toHaveBeenCalledWith(dataWithoutSeller.auctioneer);
    expect(mockGetSellerByName).not.toHaveBeenCalled();

    expect(adapterMock.createAuction).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: mockCategory.id,
      auctioneerId: mockAuctioneer.id,
      sellerId: undefined, // Esperado que seja undefined ou null
    }));
    expect(result.success).toBe(true);
  });

  // Teste 2: Falha se a categoria não for encontrada
  it('Teste 2: should fail if category is not found', async () => {
    mockGetLotCategoryByName.mockResolvedValue(null); // Categoria não encontrada
    mockGetAuctioneerByName.mockResolvedValue(mockAuctioneer as AuctioneerProfileInfo);
    mockGetSellerByName.mockResolvedValue(mockSeller as SellerProfileInfo);

    const result = await createAuction(validAuctionFormData);

    expect(mockGetLotCategoryByName).toHaveBeenCalledWith(validAuctionFormData.category);
    expect(adapterMock.createAuction).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Categoria.*não encontrada/i);
  });

  // Teste Opcional: Falha se o leiloeiro não for encontrado
  it('(Opcional) should fail if auctioneer is not found', async () => {
    mockGetLotCategoryByName.mockResolvedValue(mockCategory as LotCategory);
    mockGetAuctioneerByName.mockResolvedValue(null); // Leiloeiro não encontrado
    mockGetSellerByName.mockResolvedValue(mockSeller as SellerProfileInfo);

    const result = await createAuction(validAuctionFormData);

    expect(mockGetAuctioneerByName).toHaveBeenCalledWith(validAuctionFormData.auctioneer);
    expect(adapterMock.createAuction).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Leiloeiro.*não encontrado/i);
  });

  // Teste Opcional: Falha se o vendedor não for encontrado (e foi fornecido)
  it('(Opcional) should fail if seller is provided but not found', async () => {
    mockGetLotCategoryByName.mockResolvedValue(mockCategory as LotCategory);
    mockGetAuctioneerByName.mockResolvedValue(mockAuctioneer as AuctioneerProfileInfo);
    mockGetSellerByName.mockResolvedValue(null); // Vendedor não encontrado

    const result = await createAuction(validAuctionFormData);

    expect(mockGetSellerByName).toHaveBeenCalledWith(validAuctionFormData.seller);
    expect(adapterMock.createAuction).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Comitente.*não encontrado/i);
  });

  it('should return adapter error if adapter.createAuction fails', async () => {
    mockGetLotCategoryByName.mockResolvedValue(mockCategory as LotCategory);
    mockGetAuctioneerByName.mockResolvedValue(mockAuctioneer as AuctioneerProfileInfo);
    mockGetSellerByName.mockResolvedValue(mockSeller as SellerProfileInfo);
    adapterMock.createAuction.mockResolvedValue({ success: false, message: 'Adapter DB error' });

    const result = await createAuction(validAuctionFormData);

    expect(adapterMock.createAuction).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Adapter DB error');
    expect(mockRevalidatePath).not.toHaveBeenCalled(); // Não deve revalidar em caso de falha
  });
});

console.log('Arquivo de teste src/app/admin/auctions/actions.test.ts criado/atualizado.');

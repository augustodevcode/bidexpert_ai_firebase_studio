import { FirestoreAdapter } from './firestore.adapter';
import type { UserProfileData, Role, Lot, BidInfo, Auction, AuctionDbData, LotDbData, AuctioneerProfileInfo, SellerProfileInfo, LotCategory } from '@/types';

// Mock completo para 'firebase-admin/firestore'
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  runTransaction: jest.fn(),
  batch: jest.fn(),
};

const mockFieldValue = {
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  increment: jest.fn((val) => ({ type: 'INCREMENT', value: val })),
  arrayUnion: jest.fn((...args) => ({ type: 'ARRAY_UNION', elements: args })),
  arrayRemove: jest.fn((...args) => ({ type: 'ARRAY_REMOVE', elements: args })),
  delete: jest.fn(() => 'FIELD_DELETE'),
};

const mockTimestamp = {
  fromDate: jest.fn((date) => ({ type: 'TIMESTAMP_FROM_DATE', date: date.toISOString() })), // Padronizar para ISO string
  now: jest.fn(() => ({ type: 'TIMESTAMP_NOW' })),
};

jest.mock('firebase-admin/firestore', () => {
  return {
    getFirestore: () => mockFirestore,
    Firestore: jest.fn().mockImplementation(() => mockFirestore),
    FieldValue: mockFieldValue,
    Timestamp: mockTimestamp,
  };
});

const mockAuthAdmin = {
  getUser: jest.fn(),
};
jest.mock('@/lib/firebase/admin', () => ({
  ensureAdminInitialized: () => ({ auth: mockAuthAdmin, dbAdmin: mockFirestore, error: null }),
}));

jest.mock('@/lib/sample-data', () => ({
  ...jest.requireActual('@/lib/sample-data'),
  slugify: jest.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
}));


describe('FirestoreAdapter', () => {
  let adapter: FirestoreAdapter;
  let mockDbInstance: any;

  // Variáveis para os mocks encadeados
  let mockDocRef: any;
  let mockCollectionRef: any;
  let mockQueryRef: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDocRef = {
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      collection: jest.fn(() => mockCollectionRef),
    };
    mockCollectionRef = {
      doc: jest.fn((path?: string) => {
        // Se um path for fornecido, mockDocRef já está configurado para lidar com ele.
        // Se nenhum path for fornecido (como em add), um novo mockDocRef pode ser necessário se add retornar uma ref.
        // Para add, o retorno é um DocumentReference, então mockDocRef é adequado.
        return path ? mockDocRef : { ...mockDocRef, id: 'new_mock_id_from_add' };
      }),
      add: jest.fn(() => Promise.resolve({ ...mockDocRef, id: 'new_mock_id_from_add' })), // add retorna uma Promise com DocumentReference
      where: jest.fn(() => mockQueryRef),
      limit: jest.fn(() => mockQueryRef),
      orderBy: jest.fn(() => mockQueryRef),
      get: jest.fn(),
    };
    mockQueryRef = {
      limit: jest.fn(() => mockQueryRef),
      get: jest.fn(),
      orderBy: jest.fn(() => mockQueryRef),
      where: jest.fn(() => mockQueryRef),
    };

    mockFirestore.collection = jest.fn(() => mockCollectionRef);
    mockFirestore.doc = jest.fn(() => mockDocRef); // Adicionado para chamadas como db.doc('collection/id')

    mockDbInstance = mockFirestore;
    adapter = new FirestoreAdapter(mockDbInstance as any);

    adapter.getRoleByName = jest.fn(async (roleName: string): Promise<Role | null> => {
      if (roleName === 'USER') {
        return { id: 'user_role_id', name: 'USER', name_normalized: 'USER', permissions: ['view_auctions', 'place_bids'], createdAt: new Date(), updatedAt: new Date() };
      }
      if (roleName === 'ADMINISTRATOR') {
        return { id: 'admin_role_id', name: 'ADMINISTRATOR', name_normalized: 'ADMINISTRATOR', permissions: ['manage_all'], createdAt: new Date(), updatedAt: new Date() };
      }
      return null;
    });
    adapter.ensureDefaultRolesExist = jest.fn().mockResolvedValue({ success: true, message: 'Default roles ensured.' });
  });

  // ... testes de ensureUserRole e placeBidOnLot ...
  describe('ensureUserRole', () => {
    const userId = 'testUser123';
    const email = 'test@example.com';
    const fullName = 'Test User FullName';
    const userRole: Role = { id: 'user_role_id', name: 'USER', name_normalized: 'USER', permissions: ['view_auctions', 'place_bids'], createdAt: new Date(), updatedAt: new Date() };

    it('Caso 1: Novo usuário - deve criar perfil com papel USER e status PENDENTE_DOCUMENTOS', async () => {
      mockDocRef.get.mockResolvedValue({ exists: false }); // Para users collection
      mockAuthAdmin.getUser.mockResolvedValue({ uid: userId, email, displayName: 'Auth Display Name' });
      (adapter.getRoleByName as jest.Mock).mockResolvedValue(userRole);

      const result = await adapter.ensureUserRole(userId, email, fullName, 'USER');

      expect(result.success).toBe(true);
      expect(result.userProfile).toBeDefined();
      expect(mockDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
        uid: userId,
        email: email,
        fullName: fullName,
        roleId: userRole.id,
        roleName: userRole.name,
        permissions: userRole.permissions,
        status: 'ATIVO',
        habilitationStatus: 'PENDENTE_DOCUMENTOS',
        createdAt: 'SERVER_TIMESTAMP',
        updatedAt: 'SERVER_TIMESTAMP',
      }));
      expect(result.userProfile?.habilitationStatus).toBe('PENDENTE_DOCUMENTOS');
    });

    it('Caso 1.1: Novo usuário ADMINISTRATOR - deve criar perfil com papel ADMINISTRATOR e status HABILITADO', async () => {
      const adminRole: Role = { id: 'admin_role_id', name: 'ADMINISTRATOR', name_normalized: 'ADMINISTRATOR', permissions: ['manage_all'], createdAt: new Date(), updatedAt: new Date() };
      mockDocRef.get.mockResolvedValue({ exists: false });
      mockAuthAdmin.getUser.mockResolvedValue({ uid: userId, email, displayName: 'Admin Display Name' });
      (adapter.getRoleByName as jest.Mock).mockResolvedValue(adminRole);

      const result = await adapter.ensureUserRole(userId, email, 'Admin FullName', 'ADMINISTRATOR');

      expect(result.success).toBe(true);
      expect(mockDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
        habilitationStatus: 'HABILITADO',
      }));
      expect(result.userProfile?.habilitationStatus).toBe('HABILITADO');
    });

    it('Caso 1.2: Novo usuário, auth displayName usado como fallback para fullName', async () => {
        mockDocRef.get.mockResolvedValue({ exists: false });
        mockAuthAdmin.getUser.mockResolvedValue({ uid: userId, email, displayName: 'Auth Display Name Fallback' });
        (adapter.getRoleByName as jest.Mock).mockResolvedValue(userRole);

        const result = await adapter.ensureUserRole(userId, email, null, 'USER');

        expect(result.success).toBe(true);
        expect(mockDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
          fullName: 'Auth Display Name Fallback',
        }));
    });

    it('Caso 2: Usuário existente, precisa atualizar papel', async () => {
      const existingUserData: UserProfileData = {
        uid: userId, email, fullName,
        roleId: 'old_role_id', roleName: 'OLD_ROLE', permissions: ['old_permission'],
        createdAt: new Date(), updatedAt: new Date(),
      };
      mockDocRef.get.mockResolvedValue({ exists: true, data: () => existingUserData });
      (adapter.getRoleByName as jest.Mock).mockResolvedValue(userRole);

      const result = await adapter.ensureUserRole(userId, email, fullName, 'USER');

      expect(result.success).toBe(true);
      expect(mockDocRef.update).toHaveBeenCalledWith(expect.objectContaining({
        roleId: userRole.id,
        roleName: userRole.name,
        permissions: userRole.permissions,
        updatedAt: 'SERVER_TIMESTAMP',
      }));
    });

    it('Caso 3: Usuário existente, papel já correto - não deve atualizar campos de papel', async () => {
      const existingUserData: UserProfileData = {
        uid: userId, email, fullName,
        roleId: userRole.id, roleName: userRole.name, permissions: userRole.permissions,
        createdAt: new Date(), updatedAt: new Date(),
      };
      mockDocRef.get.mockResolvedValue({ exists: true, data: () => existingUserData });
      (adapter.getRoleByName as jest.Mock).mockResolvedValue(userRole);

      const result = await adapter.ensureUserRole(userId, email, fullName, 'USER');
      expect(result.success).toBe(true);
      expect(mockDocRef.update).not.toHaveBeenCalled();
    });
  });

  describe('placeBidOnLot', () => {
    const lotId = 'testLot123';
    const auctionId = 'testAuction456';
    const userId = 'bidderUser789';
    const userDisplayName = 'Bidder Display Name';
    const bidAmount = 150;
    const currentLotPrice = 100;
    const currentBidsCount = 5;

    const mockLotData: Lot = {
      id: lotId, auctionId, title: 'Test Lot', imageUrl: '', status: 'ABERTO_PARA_LANCES',
      type: 'Test Category', price: currentLotPrice, endDate: new Date(), bidsCount: currentBidsCount,
      publicId: 'pubLot1', createdAt: new Date(), updatedAt: new Date()
    };

    it('Caso 1: Lance bem-sucedido', async () => {
      mockDocRef.get.mockResolvedValue({ exists: true, data: () => mockLotData });
      // O collection('bids') dentro do doc do lote já é mockado para retornar mockCollectionRef por padrão no beforeEach
      // E mockCollectionRef.add já retorna um DocumentReference mockado.

      const result = await adapter.placeBidOnLot(lotId, auctionId, userId, userDisplayName, bidAmount);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lance registrado!');
      expect(mockCollectionRef.add).toHaveBeenCalledWith(expect.objectContaining({ // Verifica add na subcoleção 'bids'
        lotId, auctionId, bidderId: userId, bidderDisplay: userDisplayName, amount: bidAmount,
        timestamp: 'SERVER_TIMESTAMP',
      }));
      expect(mockDocRef.update).toHaveBeenCalledWith({ // Verifica update no doc do lote
        price: bidAmount,
        bidsCount: { type: 'INCREMENT', value: 1 },
        updatedAt: 'SERVER_TIMESTAMP',
      });
      expect(result.updatedLot).toEqual({ price: bidAmount, bidsCount: currentBidsCount + 1 });
      expect(result.newBid).toBeDefined();
      expect(result.newBid?.amount).toBe(bidAmount);
    });

    it('Caso 2: Lote não encontrado', async () => {
      mockDocRef.get.mockResolvedValue({ exists: false });
      const result = await adapter.placeBidOnLot(lotId, auctionId, userId, userDisplayName, bidAmount);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Lote não encontrado.');
      expect(mockCollectionRef.add).not.toHaveBeenCalled();
      expect(mockDocRef.update).not.toHaveBeenCalled();
    });

    it('Caso 3: Lance menor ou igual ao preço atual', async () => {
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ ...mockLotData, price: 200 })
      });
      const result = await adapter.placeBidOnLot(lotId, auctionId, userId, userDisplayName, bidAmount);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Lance deve ser maior que o atual.');
      expect(mockCollectionRef.add).not.toHaveBeenCalled();
      expect(mockDocRef.update).not.toHaveBeenCalled();
    });
  });


  describe('createAuction', () => {
    const auctionDate = new Date(2024, 5, 10, 10, 0, 0);
    const endDate = new Date(2024, 5, 15, 18, 0, 0);
    const auctionData: AuctionDbData = {
      title: 'Grande Leilão de Arte',
      status: 'EM_BREVE',
      category: 'Arte', // Nome da categoria
      auctioneer: 'Leiloeiro XPTO', // Nome do leiloeiro
      auctionDate: auctionDate,
      endDate: endDate,
      // Opcionais
      fullTitle: 'Grande Leilão de Arte Moderna e Contemporânea',
      description: 'Obras raras de artistas renomados.',
      auctionType: 'EXTRAJUDICIAL',
      categoryId: 'cat_arte_id',
      auctioneerId: 'auc_xpto_id',
      sellerId: 'sel_colecionador_id',
      city: 'Rio de Janeiro',
      state: 'RJ',
      imageUrl: 'http://example.com/arte.jpg',
      documentsUrl: 'http://example.com/edital_arte.pdf',
      sellingBranch: 'Galeria Principal',
    };

    it('deve criar um leilão com sucesso', async () => {
      mockCollectionRef.add.mockResolvedValueOnce({ id: 'newAuctionId123' });

      const result = await adapter.createAuction(auctionData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Leilão criado!');
      expect(result.auctionId).toBe('newAuctionId123');
      expect(mockCollectionRef.add).toHaveBeenCalledWith(expect.objectContaining({
        title: auctionData.title,
        status: auctionData.status,
        categoryId: auctionData.categoryId,
        auctioneerId: auctionData.auctioneerId,
        sellerId: auctionData.sellerId,
        auctionDate: { type: 'TIMESTAMP_FROM_DATE', date: auctionDate.toISOString() },
        endDate: { type: 'TIMESTAMP_FROM_DATE', date: endDate.toISOString() },
        totalLots: 0,
        visits: 0,
        createdAt: 'SERVER_TIMESTAMP',
        updatedAt: 'SERVER_TIMESTAMP',
      }));
    });

    it('deve lidar com endDate nulo', async () => {
        mockCollectionRef.add.mockResolvedValueOnce({ id: 'newAuctionId456' });
        const auctionDataNoEndDate: AuctionDbData = { ...auctionData, endDate: null };
        await adapter.createAuction(auctionDataNoEndDate);
        expect(mockCollectionRef.add).toHaveBeenCalledWith(expect.objectContaining({
          endDate: null,
        }));
    });
  });

  describe('createLot', () => {
    const endDate = new Date(2024, 6, 20, 16, 0, 0);
    const lotData: LotDbData = {
      title: 'Carro Esportivo 2023',
      auctionId: 'auctionForCar123',
      price: 75000,
      status: 'EM_BREVE',
      endDate: endDate,
      type: 'Veículo', // Nome da categoria
      // Opcionais
      categoryId: 'cat_veiculos_id',
      description: 'Pouco usado, em excelente estado.',
      initialPrice: 70000,
      imageUrl: 'http://example.com/carro.jpg',
      galleryImageUrls: ['http://example.com/carro1.jpg'],
      mediaItemIds: ['media_carro_abc'],
      lotSpecificAuctionDate: new Date(2024, 6, 15, 10, 0, 0),
      secondAuctionDate: new Date(2024, 6, 25, 10, 0, 0),
      secondInitialPrice: 68000,
    };

    it('deve criar um lote com sucesso', async () => {
      mockCollectionRef.add.mockResolvedValueOnce({ id: 'newLotId789' });

      const result = await adapter.createLot(lotData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Lote criado!');
      expect(result.lotId).toBe('newLotId789');
      expect(mockCollectionRef.add).toHaveBeenCalledWith(expect.objectContaining({
        title: lotData.title,
        auctionId: lotData.auctionId,
        price: lotData.price,
        status: lotData.status,
        categoryId: lotData.categoryId,
        endDate: { type: 'TIMESTAMP_FROM_DATE', date: endDate.toISOString() },
        views: 0,
        bidsCount: 0,
        mediaItemIds: lotData.mediaItemIds,
        galleryImageUrls: lotData.galleryImageUrls,
        createdAt: 'SERVER_TIMESTAMP',
        updatedAt: 'SERVER_TIMESTAMP',
      }));
      // Verifica que o campo 'type' não foi passado diretamente para o Firestore
      const callArg = mockCollectionRef.add.mock.calls[0][0];
      expect(callArg.type).toBeUndefined();
    });
  });

  describe('getAuction', () => {
    const auctionId = 'existingAuction123';
    const mockRawAuctionData = {
      title: 'Leilão Teste',
      status: 'ABERTO',
      auctionDate: mockTimestamp.fromDate(new Date(2024, 0, 15)), // Mocked timestamp
      endDate: mockTimestamp.fromDate(new Date(2024, 0, 20)),
      createdAt: mockTimestamp.fromDate(new Date(2024, 0, 1)),
      updatedAt: mockTimestamp.fromDate(new Date(2024, 0, 2)),
      categoryId: 'catId1',
      auctioneerId: 'aucId1',
      sellerId: 'sellId1',
      category: 'Nome Categoria Original', // Campo que será sobrescrito
      auctioneer: 'Nome Leiloeiro Original', // Campo que será sobrescrito
      seller: 'Nome Vendedor Original', // Campo que será sobrescrito
      auctionStages: [{ name: 'Praça 1', endDate: mockTimestamp.fromDate(new Date(2024, 0, 18)) }]
    };

    const mockCategoryData: Partial<LotCategory> = { name: 'Categoria Resolvida' };
    const mockAuctioneerData: Partial<AuctioneerProfileInfo> = { name: 'Leiloeiro Resolvido' };
    const mockSellerData: Partial<SellerProfileInfo> = { name: 'Vendedor Resolvido' };

    it('Caso 1: Leilão encontrado - deve popular nomes e converter datas', async () => {
      // Configura o mock para o documento do leilão
      mockFirestore.collection('auctions').doc(auctionId).get.mockResolvedValue({
        exists: true,
        data: () => mockRawAuctionData
      });
      // Configura mocks para os documentos relacionados
      mockFirestore.collection('lotCategories').doc('catId1').get.mockResolvedValue({ exists: true, data: () => mockCategoryData });
      mockFirestore.collection('auctioneers').doc('aucId1').get.mockResolvedValue({ exists: true, data: () => mockAuctioneerData });
      mockFirestore.collection('sellers').doc('sellId1').get.mockResolvedValue({ exists: true, data: () => mockSellerData });

      const result = await adapter.getAuction(auctionId);

      expect(result).not.toBeNull();
      expect(result?.title).toBe(mockRawAuctionData.title);
      expect(result?.category).toBe(mockCategoryData.name);
      expect(result?.auctioneer).toBe(mockAuctioneerData.name);
      expect(result?.seller).toBe(mockSellerData.name);
      expect(result?.auctionDate).toBeInstanceOf(Date);
      expect(result?.endDate).toBeInstanceOf(Date);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(result?.auctionStages?.[0].endDate).toBeInstanceOf(Date);
    });

    it('Caso 1.1: Leilão encontrado, mas com dependências não encontradas', async () => {
      mockFirestore.collection('auctions').doc(auctionId).get.mockResolvedValue({
        exists: true,
        data: () => mockRawAuctionData
      });
      mockFirestore.collection('lotCategories').doc('catId1').get.mockResolvedValue({ exists: false }); // Categoria não encontrada
      mockFirestore.collection('auctioneers').doc('aucId1').get.mockResolvedValue({ exists: true, data: () => mockAuctioneerData });
      mockFirestore.collection('sellers').doc('sellId1').get.mockResolvedValue({ exists: false }); // Vendedor não encontrado

      const result = await adapter.getAuction(auctionId);
      expect(result?.category).toBe(mockRawAuctionData.category); // Deve usar o valor original
      expect(result?.auctioneer).toBe(mockAuctioneerData.name);
      expect(result?.seller).toBe(mockRawAuctionData.seller); // Deve usar o valor original
    });


    it('Caso 2: Leilão não encontrado - deve retornar null', async () => {
      mockFirestore.collection('auctions').doc('nonExistingId').get.mockResolvedValue({ exists: false });
      const result = await adapter.getAuction('nonExistingId');
      expect(result).toBeNull();
    });
  });

});

console.log('Arquivo de teste src/lib/database/firestore.adapter.test.ts atualizado com testes para createAuction, createLot, e getAuction.');

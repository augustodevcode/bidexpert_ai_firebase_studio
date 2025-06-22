import { createUser } from './actions'; // Ajuste o caminho se a action estiver em outro local
import { getDatabaseAdapter } from '@/lib/database';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import type { UserProfileData, Role, IDatabaseAdapter } from '@/types';

// Mockear os módulos
jest.mock('@/lib/database');
jest.mock('@/lib/firebase/admin');
jest.mock('next/cache');

// Tipar os mocks
const mockGetDatabaseAdapter = getDatabaseAdapter as jest.MockedFunction<typeof getDatabaseAdapter>;
const mockEnsureAdminInitialized = ensureAdminInitialized as jest.MockedFunction<typeof ensureAdminInitialized>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('createUser Server Action', () => {
  let adapterMock: jest.Mocked<IDatabaseAdapter>;
  let authAdminMock: {
    getUserByEmail: jest.Mock;
    createUser: jest.Mock;
    deleteUser: jest.Mock;
    // Adicione outros métodos do authAdmin que você possa precisar mockar
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar o mock do adapter
    adapterMock = {
      ensureUserRole: jest.fn(),
      getRole: jest.fn(), // Renomeado de getRoleInternal para getRole para corresponder ao IDatabaseAdapter
      getRoleByName: jest.fn(), // Adicionado para consistência
      // Mockar todos os outros métodos da IDatabaseAdapter para evitar erros de "not a function"
      initializeSchema: jest.fn(),
      createLotCategory: jest.fn(),
      getLotCategories: jest.fn(),
      getLotCategory: jest.fn(),
      updateLotCategory: jest.fn(),
      deleteLotCategory: jest.fn(),
      createState: jest.fn(),
      getStates: jest.fn(),
      getState: jest.fn(),
      updateState: jest.fn(),
      deleteState: jest.fn(),
      createCity: jest.fn(),
      getCities: jest.fn(),
      getCity: jest.fn(),
      updateCity: jest.fn(),
      deleteCity: jest.fn(),
      createAuctioneer: jest.fn(),
      getAuctioneers: jest.fn(),
      getAuctioneer: jest.fn(),
      updateAuctioneer: jest.fn(),
      deleteAuctioneer: jest.fn(),
      getAuctioneerBySlug: jest.fn(),
      createSeller: jest.fn(),
      getSellers: jest.fn(),
      getSeller: jest.fn(),
      updateSeller: jest.fn(),
      deleteSeller: jest.fn(),
      getSellerBySlug: jest.fn(),
      createAuction: jest.fn(),
      getAuctions: jest.fn(),
      getAuction: jest.fn(),
      updateAuction: jest.fn(),
      deleteAuction: jest.fn(),
      getAuctionsBySellerSlug: jest.fn(),
      createLot: jest.fn(),
      getLots: jest.fn(),
      getLot: jest.fn(),
      updateLot: jest.fn(),
      deleteLot: jest.fn(),
      getBidsForLot: jest.fn(),
      placeBidOnLot: jest.fn(),
      getUserProfileData: jest.fn(),
      updateUserProfile: jest.fn(),
      getUsersWithRoles: jest.fn(),
      updateUserRole: jest.fn(),
      deleteUserProfile: jest.fn(),
      getUserByEmail: jest.fn(), // Adicionado para consistência com authenticateUserSql
      createRole: jest.fn(),
      getRoles: jest.fn(),
      // getRole: jest.fn(), // Já mockado acima
      // getRoleByName: jest.fn(), // Já mockado acima
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      ensureDefaultRolesExist: jest.fn(),
      createMediaItem: jest.fn(),
      getMediaItems: jest.fn(),
      updateMediaItemMetadata: jest.fn(),
      deleteMediaItemFromDb: jest.fn(),
      linkMediaItemsToLot: jest.fn(),
      unlinkMediaItemFromLot: jest.fn(),
      getPlatformSettings: jest.fn(),
      updatePlatformSettings: jest.fn(),
    };
    mockGetDatabaseAdapter.mockReturnValue(adapterMock as any); // any para contornar o tipo complexo

    // Configurar o mock do Firebase Admin Auth
    authAdminMock = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };
    mockEnsureAdminInitialized.mockReturnValue({ auth: authAdminMock as any, dbAdmin: {} as any, error: null });
  });

  const validUserData = {
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    // roleId é opcional nos dados de entrada, a action define 'USER' como padrão se não vier
  };

  const mockUserRecord = {
    uid: 'firebase-uid-123',
    email: validUserData.email,
    displayName: validUserData.fullName,
  };

  const mockUserRole: Role = {
    id: 'user-role-id',
    name: 'USER',
    permissions: ['view_auctions'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSpecificRole: Role = {
    id: 'specific-role-id-456',
    name: 'SPECIAL_ROLE',
    permissions: ['special_permission'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserProfile: UserProfileData = {
    uid: mockUserRecord.uid,
    email: mockUserRecord.email,
    fullName: mockUserRecord.displayName!,
    roleId: mockUserRole.id,
    roleName: mockUserRole.name,
    permissions: mockUserRole.permissions,
    habilitationStatus: 'PENDENTE_DOCUMENTOS',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Teste 1: Criação de usuário bem-sucedida (FIRESTORE)
  it('Teste 1: should create a user successfully (FIRESTORE)', async () => {
    process.env.ACTIVE_DATABASE_SYSTEM = 'FIRESTORE';
    authAdminMock.getUserByEmail.mockResolvedValue(null); // Usuário não existe no Auth
    authAdminMock.createUser.mockResolvedValue(mockUserRecord);
    (adapterMock.getRoleByName as jest.Mock).mockResolvedValue(mockUserRole);
    (adapterMock.ensureUserRole as jest.Mock).mockResolvedValue({ success: true, userProfile: mockUserProfile });

    const result = await createUser(validUserData);

    expect(authAdminMock.getUserByEmail).toHaveBeenCalledWith(validUserData.email);
    expect(authAdminMock.createUser).toHaveBeenCalledWith({
      email: validUserData.email,
      password: validUserData.password,
      displayName: validUserData.fullName,
    });
    expect(adapterMock.ensureUserRole).toHaveBeenCalledWith(
      mockUserRecord.uid,
      validUserData.email,
      validUserData.fullName,
      'USER', // Papel padrão
      expect.any(Object), // additionalProfileData
      undefined // roleId (pois não foi passado na entrada)
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Usuário criado com sucesso!');
    expect(result.user).toEqual(mockUserProfile);
  });

  // Teste 2: Falha ao criar usuário no Firebase Auth (email já existe)
  it('Teste 2: should fail if email already exists in Firebase Auth', async () => {
    process.env.ACTIVE_DATABASE_SYSTEM = 'FIRESTORE';
    authAdminMock.getUserByEmail.mockResolvedValue(mockUserRecord as any); // Simula que email já existe

    const result = await createUser(validUserData);

    expect(authAdminMock.getUserByEmail).toHaveBeenCalledWith(validUserData.email);
    expect(authAdminMock.createUser).not.toHaveBeenCalled();
    expect(adapterMock.ensureUserRole).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/O email fornecido já existe/i);
  });

  // Teste 3: Falha ao salvar perfil no DB (ensureUserRole falha)
  it('Teste 3: should fail and attempt to delete Auth user if ensureUserRole fails', async () => {
    process.env.ACTIVE_DATABASE_SYSTEM = 'FIRESTORE';
    authAdminMock.getUserByEmail.mockResolvedValue(null);
    authAdminMock.createUser.mockResolvedValue(mockUserRecord);
    (adapterMock.ensureUserRole as jest.Mock).mockResolvedValue({ success: false, message: 'DB error on save' });

    const result = await createUser(validUserData);

    expect(authAdminMock.createUser).toHaveBeenCalled();
    expect(adapterMock.ensureUserRole).toHaveBeenCalled();
    expect(authAdminMock.deleteUser).toHaveBeenCalledWith(mockUserRecord.uid); // Verifica reversão
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Falha ao criar perfil de usuário no banco de dados: DB error on save/i);
  });

  // Teste 4: Criação de usuário com papel específico
  it('Teste 4: should create a user with a specific role if roleId is provided', async () => {
    process.env.ACTIVE_DATABASE_SYSTEM = 'FIRESTORE';
    const userDataWithRole = { ...validUserData, roleId: mockSpecificRole.id };

    authAdminMock.getUserByEmail.mockResolvedValue(null);
    authAdminMock.createUser.mockResolvedValue(mockUserRecord);
    // Mock para getRole (que é chamado quando roleId é fornecido)
    (adapterMock.getRole as jest.Mock).mockResolvedValue(mockSpecificRole);
    // ensureUserRole ainda será chamado, mas o nome do papel e ID virão de mockSpecificRole
    const profileWithSpecificRole = { ...mockUserProfile, roleId: mockSpecificRole.id, roleName: mockSpecificRole.name, permissions: mockSpecificRole.permissions };
    (adapterMock.ensureUserRole as jest.Mock).mockResolvedValue({ success: true, userProfile: profileWithSpecificRole });


    const result = await createUser(userDataWithRole);

    expect(authAdminMock.createUser).toHaveBeenCalled();
    expect(adapterMock.getRole).toHaveBeenCalledWith(mockSpecificRole.id);
    expect(adapterMock.ensureUserRole).toHaveBeenCalledWith(
      mockUserRecord.uid,
      validUserData.email,
      validUserData.fullName,
      mockSpecificRole.name, // Nome do papel específico
      expect.any(Object),
      mockSpecificRole.id // ID do papel específico
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result.success).toBe(true);
    expect(result.user?.roleId).toBe(mockSpecificRole.id);
    expect(result.user?.roleName).toBe(mockSpecificRole.name);
  });
});

console.log('Arquivo de teste src/app/admin/users/actions.test.ts criado/atualizado.');

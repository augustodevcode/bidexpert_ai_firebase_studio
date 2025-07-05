import { createUser } from './actions';
import { getDatabaseAdapter } from '@/lib/database';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import type { UserProfileData, Role, IDatabaseAdapter, UserFormValues } from '@/types';

// Mockear os módulos
jest.mock('@/lib/database');
jest.mock('@/lib/firebase/admin');
jest.mock('next/cache');

// Tipar os mocks
const mockGetDatabaseAdapter = getDatabaseAdapter as jest.MockedFunction<typeof getDatabaseAdapter>;
const mockEnsureAdminInitialized = ensureAdminInitialized as jest.MockedFunction<typeof ensureAdminInitialized>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('createUser Server Action with In-Memory Adapter Mock', () => {
  let adapterMock: jest.Mocked<IDatabaseAdapter>;
  let authAdminMock: {
    getUserByEmail: jest.Mock;
    createUser: jest.Mock;
    deleteUser: jest.Mock;
  };
  let inMemoryUsers: UserProfileData[];
  let inMemoryRoles: Role[];

  beforeEach(() => {
    jest.clearAllMocks();

    inMemoryUsers = [];
    inMemoryRoles = [
      { id: 'user-role-id', name: 'USER', name_normalized: 'USER', permissions: ['view_auctions', 'place_bids'], createdAt: new Date(), updatedAt: new Date() },
      { id: 'admin-role-id', name: 'ADMINISTRATOR', name_normalized: 'ADMINISTRATOR', permissions: ['manage_all'], createdAt: new Date(), updatedAt: new Date() },
      { id: 'specific-role-id-456', name: 'SPECIAL_ROLE', name_normalized: 'SPECIAL_ROLE', permissions: ['special_permission'], createdAt: new Date(), updatedAt: new Date() }
    ];

    adapterMock = {
      ensureUserRole: jest.fn(async (uid, email, fullName, targetRoleName, additionalProfileData, roleIdToAssign) => {
        if (email === 'fail_ensure_user_role@example.com') { // Ponto de falha para teste específico
          return { success: false, message: 'Mock DB error on save' };
        }
        const roleToAssign = roleIdToAssign
          ? inMemoryRoles.find(r => r.id === roleIdToAssign)
          : inMemoryRoles.find(r => r.name_normalized === targetRoleName.toUpperCase());

        if (!roleToAssign) {
          return { success: false, message: `Mock DB: Role ${roleIdToAssign || targetRoleName} não encontrada.` };
        }

        const existingUserIndex = inMemoryUsers.findIndex(u => u.uid === uid);
        const now = new Date();
        const userProfile: UserProfileData = {
          uid,
          email,
          fullName: fullName || email.split('@')[0],
          roleId: roleToAssign.id,
          roleName: roleToAssign.name,
          permissions: roleToAssign.permissions,
          habilitationStatus: targetRoleName.toUpperCase() === 'ADMINISTRATOR' ? 'HABILITADO' : 'PENDENTE_DOCUMENTOS',
          createdAt: existingUserIndex !== -1 ? inMemoryUsers[existingUserIndex].createdAt : now,
          updatedAt: now,
          ...(additionalProfileData || {}), // Garante que additionalProfileData seja um objeto
        };

        if (existingUserIndex !== -1) {
          inMemoryUsers[existingUserIndex] = { ...inMemoryUsers[existingUserIndex], ...userProfile };
        } else {
          inMemoryUsers.push(userProfile);
        }
        return { success: true, userProfile };
      }),
      getRole: jest.fn(async (roleId: string) => {
        return inMemoryRoles.find(r => r.id === roleId) || null;
      }),
      getRoleByName: jest.fn(async (roleName: string) => {
        return inMemoryRoles.find(r => r.name_normalized === roleName.toUpperCase()) || null;
      }),
      ensureDefaultRolesExist: jest.fn().mockResolvedValue({ success: true, message: "Defaults ensured" }),
      // Preencher com jest.fn() para todos os outros métodos da IDatabaseAdapter
      initializeSchema: jest.fn(), createLotCategory: jest.fn(), getLotCategories: jest.fn(), getLotCategory: jest.fn(), updateLotCategory: jest.fn(), deleteLotCategory: jest.fn(), createState: jest.fn(), getStates: jest.fn(), getState: jest.fn(), updateState: jest.fn(), deleteState: jest.fn(), createCity: jest.fn(), getCities: jest.fn(), getCity: jest.fn(), updateCity: jest.fn(), deleteCity: jest.fn(), createAuctioneer: jest.fn(), getAuctioneers: jest.fn(), getAuctioneer: jest.fn(), updateAuctioneer: jest.fn(), deleteAuctioneer: jest.fn(), getAuctioneerBySlug: jest.fn(), createSeller: jest.fn(), getSellers: jest.fn(), getSeller: jest.fn(), updateSeller: jest.fn(), deleteSeller: jest.fn(), getSellerBySlug: jest.fn(), createAuction: jest.fn(), getAuctions: jest.fn(), getAuction: jest.fn(), updateAuction: jest.fn(), deleteAuction: jest.fn(), getAuctionsBySellerSlug: jest.fn(), createLot: jest.fn(), getLots: jest.fn(), getLot: jest.fn(), updateLot: jest.fn(), deleteLot: jest.fn(), getBidsForLot: jest.fn(), placeBidOnLot: jest.fn(), getUserProfileData: jest.fn(), updateUserProfile: jest.fn(), getUsersWithRoles: jest.fn(), updateUserRole: jest.fn(), deleteUserProfile: jest.fn(), getUserByEmail: jest.fn(), createRole: jest.fn(), getRoles: jest.fn(), updateRole: jest.fn(), deleteRole: jest.fn(), createMediaItem: jest.fn(), getMediaItems: jest.fn(), updateMediaItemMetadata: jest.fn(), deleteMediaItemFromDb: jest.fn(), linkMediaItemsToLot: jest.fn(), unlinkMediaItemFromLot: jest.fn(), getPlatformSettings: jest.fn(), updatePlatformSettings: jest.fn(),
    };
    mockGetDatabaseAdapter.mockReturnValue(adapterMock);

    authAdminMock = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };
    // Configurar o mock do Firebase Admin Auth
    authAdminMock = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    // Garantir que o mock de ensureAdminInitialized retorne as propriedades `auth` e `app`
    // e que `error` seja null para simular uma inicialização bem-sucedida do SDK.
    mockEnsureAdminInitialized.mockReturnValue({
      auth: authAdminMock as any,
      dbAdmin: {} as any, // dbAdmin não é usado diretamente por createUser, mock simples
      app: { name: 'mocked-firebase-app' } as any, // Presença de 'app' é crucial
      error: null,
    });
  });

  const validUserFormValues: UserFormValues = {
    fullName: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    // Outros campos de UserFormValues podem ser adicionados aqui se necessário para additionalProfileData
    cpf: '111.222.333-44',
    cellPhone: '11987654321',
  };

  const mockUserRecord = { // Retorno do Firebase Auth createUser
    uid: 'firebase-uid-123',
    email: validUserFormValues.email,
    displayName: validUserFormValues.fullName,
  };

  // Teste 1: Criação de usuário bem-sucedida
  it('Teste 1: should create a user successfully with default USER role', async () => {
    process.env.ACTIVE_DATABASE_SYSTEM = 'FIRESTORE'; // Ou qualquer outro valor que não seja 'SQL'
    authAdminMock.getUserByEmail.mockResolvedValue(null);
    authAdminMock.createUser.mockResolvedValue(mockUserRecord);
    // O adapterMock.ensureUserRole agora usa a lógica em memória e os inMemoryRoles

    const result = await createUser(validUserFormValues);

    expect(authAdminMock.getUserByEmail).toHaveBeenCalledWith(validUserFormValues.email);
    expect(authAdminMock.createUser).toHaveBeenCalledWith({
      email: validUserFormValues.email,
      password: validUserFormValues.password,
      displayName: validUserFormValues.fullName,
    });
    expect(adapterMock.ensureUserRole).toHaveBeenCalledWith(
      mockUserRecord.uid,
      validUserFormValues.email,
      validUserFormValues.fullName,
      'USER', // Papel padrão esperado pela action createUser
      expect.objectContaining({ // additionalProfileData
        cpf: validUserFormValues.cpf,
        cellPhone: validUserFormValues.cellPhone,
      }),
      undefined // roleId (pois não foi passado na entrada)
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Usuário criado com sucesso!');
    expect(result.user).toBeDefined();
    expect(result.user?.uid).toBe(mockUserRecord.uid);
    expect(result.user?.roleName).toBe('USER');
    expect(result.user?.habilitationStatus).toBe('PENDENTE_DOCUMENTOS');
  });

  // Teste 2: Falha se email já existe no Auth
  it('Teste 2: should fail if email already exists in Firebase Auth', async () => {
    process.env.ACTIVE_DATABASE_SYSTEM = 'FIRESTORE';
    authAdminMock.getUserByEmail.mockResolvedValue(mockUserRecord as any);

    const result = await createUser(validUserFormValues);

    expect(authAdminMock.getUserByEmail).toHaveBeenCalledWith(validUserFormValues.email);
    expect(authAdminMock.createUser).not.toHaveBeenCalled();
    expect(adapterMock.ensureUserRole).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/O email fornecido já existe no sistema de autenticação./i);
  });

  // Teste 3: Falha ao salvar perfil no DB (ensureUserRole falha)
  it('Teste 3: should fail and attempt to delete Auth user if ensureUserRole fails', async () => {
    process.env.ACTIVE_DATABASE_SYSTEM = 'FIRESTORE';
    const failingUserData = { ...validUserFormValues, email: 'fail_ensure_user_role@example.com' };
    authAdminMock.getUserByEmail.mockResolvedValue(null);
    authAdminMock.createUser.mockResolvedValue({ ...mockUserRecord, email: failingUserData.email });
    // O adapterMock.ensureUserRole está configurado para falhar com este email

    const result = await createUser(failingUserData);

    expect(authAdminMock.createUser).toHaveBeenCalled();
    expect(adapterMock.ensureUserRole).toHaveBeenCalled();
    expect(authAdminMock.deleteUser).toHaveBeenCalledWith(mockUserRecord.uid);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Falha ao criar perfil de usuário no banco de dados: Mock DB error on save/i);
  });

  // Teste 4: Criação de usuário com papel específico
  it('Teste 4: should create a user with a specific role if roleId is provided', async () => {
    process.env.ACTIVE_DATABASE_SYSTEM = 'FIRESTORE';
    const specificRoleId = 'specific-role-id-456';
    const userDataWithRole = { ...validUserFormValues, roleId: specificRoleId };

    authAdminMock.getUserByEmail.mockResolvedValue(null);
    authAdminMock.createUser.mockResolvedValue(mockUserRecord);
    // O adapterMock.getRole e adapterMock.ensureUserRole usam inMemoryRoles

    const result = await createUser(userDataWithRole);

    expect(authAdminMock.createUser).toHaveBeenCalled();
    expect(adapterMock.getRole).toHaveBeenCalledWith(specificRoleId);
    expect(adapterMock.ensureUserRole).toHaveBeenCalledWith(
      mockUserRecord.uid,
      validUserFormValues.email,
      validUserFormValues.fullName,
      'SPECIAL_ROLE', // Nome do papel de 'specific-role-id-456'
      expect.objectContaining({
        roleId: specificRoleId,
        cpf: validUserFormValues.cpf,
      }),
      specificRoleId
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result.success).toBe(true);
    expect(result.user?.roleId).toBe(specificRoleId);
    expect(result.user?.roleName).toBe('SPECIAL_ROLE');
  });
});

console.log('Arquivo de teste src/app/admin/users/actions.test.ts atualizado com mock de adapter em memória.');

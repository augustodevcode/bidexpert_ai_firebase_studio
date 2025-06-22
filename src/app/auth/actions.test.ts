import { authenticateUserSql } from './actions';
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, IDatabaseAdapter } from '@/types';

// Mockear o módulo de database
jest.mock('@/lib/database');

const mockGetDatabaseAdapter = getDatabaseAdapter as jest.MockedFunction<typeof getDatabaseAdapter>;

describe('authenticateUserSql Server Action', () => {
  let adapterMock: jest.Mocked<Pick<IDatabaseAdapter, 'getUserByEmail'>>; // Somente mockar o método necessário

  beforeEach(() => {
    jest.clearAllMocks();

    adapterMock = {
      getUserByEmail: jest.fn(),
    };
    // Configurar o mockGetDatabaseAdapter para retornar nosso adapterMock parcial
    // Como o adapter completo é grande, e só precisamos de um método,
    // podemos fazer um cast para any ou mockar a estrutura completa se necessário.
    // Para este caso, um mock parcial é mais simples.
    mockGetDatabaseAdapter.mockReturnValue(adapterMock as any);
  });

  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  const mockUserDbProfile: UserProfileData = {
    uid: 'user-sql-123',
    email: testEmail,
    fullName: 'SQL Test User',
    password: testPassword, // Senha em texto plano, conforme a implementação atual da action
    roleId: 'role-id',
    roleName: 'USER',
    permissions: ['view_auctions'],
    createdAt: new Date(),
    updatedAt: new Date(),
    habilitationStatus: 'HABILITADO',
  };

  // Teste 1: Autenticação bem-sucedida
  it('Teste 1: should authenticate user successfully with correct credentials', async () => {
    (adapterMock.getUserByEmail as jest.Mock).mockResolvedValue(mockUserDbProfile);

    const result = await authenticateUserSql(testEmail, testPassword);

    expect(adapterMock.getUserByEmail).toHaveBeenCalledWith(testEmail.toLowerCase());
    expect(result.success).toBe(true);
    expect(result.message).toBe('Login bem-sucedido (SQL)!');
    expect(result.user).toBeDefined();
    // Verificar se a senha foi removida do objeto retornado
    expect(result.user?.password).toBeUndefined();
    expect(result.user?.email).toBe(testEmail);
    expect(result.user?.fullName).toBe(mockUserDbProfile.fullName);
  });

  // Teste 2: Usuário não encontrado
  it('Teste 2: should fail if user is not found', async () => {
    (adapterMock.getUserByEmail as jest.Mock).mockResolvedValue(null);

    const result = await authenticateUserSql(testEmail, testPassword);

    expect(adapterMock.getUserByEmail).toHaveBeenCalledWith(testEmail.toLowerCase());
    expect(result.success).toBe(false);
    expect(result.message).toBe('Usuário não encontrado.');
    expect(result.user).toBeUndefined();
  });

  // Teste 3: Senha incorreta
  it('Teste 3: should fail if password is incorrect', async () => {
    (adapterMock.getUserByEmail as jest.Mock).mockResolvedValue(mockUserDbProfile);
    const wrongPassword = 'wrongpassword';

    const result = await authenticateUserSql(testEmail, wrongPassword);

    expect(adapterMock.getUserByEmail).toHaveBeenCalledWith(testEmail.toLowerCase());
    expect(result.success).toBe(false);
    expect(result.message).toBe('Senha incorreta.');
    expect(result.user).toBeUndefined();
  });

  it('should handle errors during database interaction', async () => {
    const errorMessage = 'Database connection error';
    (adapterMock.getUserByEmail as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await authenticateUserSql(testEmail, testPassword);

    expect(adapterMock.getUserByEmail).toHaveBeenCalledWith(testEmail.toLowerCase());
    expect(result.success).toBe(false);
    expect(result.message).toBe(errorMessage);
    expect(result.user).toBeUndefined();
  });
});

console.log('Arquivo de teste src/app/auth/actions.test.ts criado/atualizado.');

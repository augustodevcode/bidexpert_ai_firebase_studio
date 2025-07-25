// tests/habilitation.test.ts
import { habilitateUserAction } from '../src/app/admin/habilitations/actions';
import { prisma } from '../src/lib/prisma';
import { RoleRepository } from '../src/repositories/role.repository';
import { UserService } from '../src/services/user.service';

const roleRepository = new RoleRepository();
const userService = new UserService();

describe('Habilitation Actions', () => {
  let user: any;

  beforeAll(async () => {
    // Create a test user
    user = await prisma.user.create({
      data: {
        email: 'test.habilitate@example.com',
        fullName: 'Test User Habilitate',
        password: 'password123',
        habilitationStatus: 'PENDING_ANALYSIS',
      },
    });

    // Ensure BIDDER role exists
    const bidderRole = await roleRepository.findByNormalizedName('BIDDER');
    if (!bidderRole) {
      await prisma.role.create({
        data: {
          name: 'Bidder',
          normalizedName: 'BIDDER',
          permissions: ['can_bid'],
        },
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.delete({ where: { id: user.id } });
  });

  it('should habilitate a user and assign the BIDDER role', async () => {
    const result = await habilitateUserAction(user.id);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Usuário habilitado com sucesso e perfil de arrematante atribuído.');

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    expect(updatedUser?.habilitationStatus).toBe('HABILITADO');
    expect(updatedUser?.roles.some((userOnRole) => userOnRole.role.nameNormalized === 'BIDDER')).toBe(true);
  });
});

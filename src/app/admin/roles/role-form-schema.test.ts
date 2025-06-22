import { roleFormSchema, RoleFormValues, predefinedPermissions } from './role-form-schema';

describe('roleFormSchema', () => {
  const validPermissionIds = predefinedPermissions.map(p => p.id);

  const validInput: RoleFormValues = {
    name: 'Analista de Leilões',
    description: 'Responsável por analisar e aprovar documentação e dados de leilões.',
    permissions: [validPermissionIds[0], validPermissionIds[5], 'auctions:read', 'lots:read'],
  };

  it('should validate with correct data', () => {
    const result = roleFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
        expect(result.data.name).toBe('Analista de Leilões');
        expect(result.data.permissions).toHaveLength(4);
    }
  });

  it('should pass if permissions are not provided (optional)', () => {
    const dataWithoutPermissions = { ...validInput };
    delete dataWithoutPermissions.permissions;
    const result = roleFormSchema.safeParse(dataWithoutPermissions);
    expect(result.success).toBe(true);
    if(result.success){
        // Zod default for optional array might be undefined, not empty array
        expect(result.data.permissions).toBeUndefined();
    }
  });

  it('should pass if permissions is an empty array', () => {
    const dataWithEmptyPermissions = { ...validInput, permissions: [] };
    const result = roleFormSchema.safeParse(dataWithEmptyPermissions);
    expect(result.success).toBe(true);
    if(result.success){
        expect(result.data.permissions).toEqual([]);
    }
  });


  // Testes para name
  it('should fail if name is too short', () => {
    const invalidData = { ...validInput, name: 'Ro' };
    const result = roleFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome do perfil deve ter pelo menos 3 caracteres.');
    }
  });

  it('should fail if name is too long', () => {
    const invalidData = { ...validInput, name: 'N'.repeat(101) };
    const result = roleFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
      expect(result.error.issues[0].message).toBe('O nome do perfil não pode exceder 100 caracteres.');
    }
  });

  it('should fail if name is empty', () => {
    const invalidData = { ...validInput, name: '' };
    const result = roleFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['name']);
    }
  });

  // Testes para description
  it('should fail if description is too long', () => {
    const invalidData = { ...validInput, description: 'D'.repeat(501) };
    const result = roleFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['description']);
      expect(result.error.issues[0].message).toBe('A descrição não pode exceder 500 caracteres.');
    }
  });

  it('should pass if description is not provided (optional)', () => {
    const dataWithoutDescription = { ...validInput };
    delete dataWithoutDescription.description;
    const result = roleFormSchema.safeParse(dataWithoutDescription);
    expect(result.success).toBe(true);
  });

  // Testes para permissions (tipo array de strings já é validado pelo Zod)
  // Não é necessário testar se uma permissão é válida contra predefinedPermissions aqui,
  // pois o schema em si não faz essa validação, apenas espera um array de strings.
  // Essa validação seria uma lógica de negócio adicional, possivelmente com .refine().
  it('should pass with an array of strings for permissions', () => {
    const dataWithPermissions = { ...validInput, permissions: ['any_string_1', 'any_string_2'] };
    const result = roleFormSchema.safeParse(dataWithPermissions);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.permissions).toEqual(['any_string_1', 'any_string_2']);
    }
  });
});

console.log('Arquivo de teste src/app/admin/roles/role-form-schema.test.ts criado/atualizado.');

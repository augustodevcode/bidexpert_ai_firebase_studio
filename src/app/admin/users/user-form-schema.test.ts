import { userFormSchema, UserFormValues } from './user-form-schema';

describe('userFormSchema', () => {
  // Teste com dados completamente válidos
  const validInput: UserFormValues = {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    roleId: 'role_user_123',
    cpf: '123.456.789-00',
    cellPhone: '11987654321',
    dateOfBirth: new Date(1990, 0, 1),
    accountType: 'PHYSICAL',
    razaoSocial: undefined, // Opcional, não preenchido para PHYSICAL
    cnpj: undefined, // Opcional, não preenchido para PHYSICAL
    inscricaoEstadual: undefined, // Opcional
    websiteComitente: undefined, // Opcional
    zipCode: '12345-678',
    street: 'Rua Principal',
    number: '123',
    complement: 'Apto 4B',
    neighborhood: 'Centro',
    city: 'Cidade Exemplo',
    state: 'EX',
    optInMarketing: true,
  };

  it('should validate with correct data and handle optInMarketing default', () => {
    const result = userFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);

    if (result.success) {
      // Caso 1: Chave 'optInMarketing' totalmente omitida do objeto de entrada
      const dataKeyOmitted = { ...validInput };
      delete dataKeyOmitted.optInMarketing;

      // Teste com parse() quando a chave é omitida (default DEVE ser aplicado)
      const parsedDataWhenKeyOmitted = userFormSchema.parse(dataKeyOmitted);
      expect(parsedDataWhenKeyOmitted.optInMarketing).toBe(false);

      // Teste com safeParse() quando a chave é omitida (default DEVE ser aplicado em .data)
      const safeParsedWhenKeyOmitted = userFormSchema.safeParse(dataKeyOmitted);
      expect(safeParsedWhenKeyOmitted.success).toBe(true);
      if (safeParsedWhenKeyOmitted.success) {
        expect(safeParsedWhenKeyOmitted.data.optInMarketing).toBe(false);
      }

      // Caso 2: Chave 'optInMarketing' presente com valor undefined
      // Para z.boolean().default(false).optional(), Zod trata 'undefined' como um valor válido para opcional,
      // e o default NÃO é aplicado sobre um 'undefined' explícito quando .optional() está presente. O campo permanece undefined.
      const dataWithExplicitUndefined = { ...validInput, optInMarketing: undefined };

      const parsedDataWhenUndefined = userFormSchema.parse(dataWithExplicitUndefined);
      expect(parsedDataWhenUndefined.optInMarketing).toBeUndefined();

      const safeParsedWhenUndefined = userFormSchema.safeParse(dataWithExplicitUndefined);
      expect(safeParsedWhenUndefined.success).toBe(true);
      if (safeParsedWhenUndefined.success) {
        expect(safeParsedWhenUndefined.data.optInMarketing).toBeUndefined();
      }
    }
  });

  // Testes para fullName
  it('should fail if fullName is too short', () => {
    const invalidData = { ...validInput, fullName: 'Jo' };
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['fullName']);
      expect(result.error.issues[0].message).toBe('O nome completo deve ter pelo menos 3 caracteres.');
    }
  });

  it('should fail if fullName is too long', () => {
    const invalidData = { ...validInput, fullName: 'J'.repeat(151) };
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['fullName']);
      expect(result.error.issues[0].message).toBe('O nome completo não pode exceder 150 caracteres.');
    }
  });

  it('should fail if fullName is not a string', () => {
    const invalidData = { ...validInput, fullName: 123 as any }; // Cast para any para simular tipo errado
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['fullName']);
    }
  });

  // Testes para email
  it('should fail if email is invalid', () => {
    const invalidData = { ...validInput, email: 'john.doe' };
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email']);
      expect(result.error.issues[0].message).toBe('Por favor, insira um endereço de email válido.');
    }
  });

  it('should fail if email is empty', () => {
    const invalidData = { ...validInput, email: '' };
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email']);
    }
  });

  // Testes para password
  it('should pass if password is not provided (optional)', () => {
    const dataWithNoPassword = { ...validInput };
    delete dataWithNoPassword.password;
    const result = userFormSchema.safeParse(dataWithNoPassword);
    expect(result.success).toBe(true);
  });

  it('should pass if password is an empty string (optional or literal)', () => {
    const dataWithEmptyPassword = { ...validInput, password: '' };
    const result = userFormSchema.safeParse(dataWithEmptyPassword);
    expect(result.success).toBe(true);
  });

  it('should fail if password is too short', () => {
    const invalidData = { ...validInput, password: '123' };
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['password']);
      expect(result.error.issues[0].message).toBe('A senha deve ter pelo menos 6 caracteres.');
    }
  });

  // Testes para roleId
  it('should pass if roleId is not provided (optional)', () => {
    const dataWithNoRoleId = { ...validInput };
    delete dataWithNoRoleId.roleId;
    const result = userFormSchema.safeParse(dataWithNoRoleId);
    expect(result.success).toBe(true);
  });

  it('should pass if roleId is null (optional nullable)', () => {
    const dataWithNullRoleId = { ...validInput, roleId: null };
    const result = userFormSchema.safeParse(dataWithNullRoleId);
    expect(result.success).toBe(true);
  });

  // Testes para accountType
  it('should fail if accountType is an invalid enum value', () => {
    const invalidData = { ...validInput, accountType: 'INVALID_TYPE' as any };
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['accountType']);
    }
  });

  // Testes para websiteComitente
   it('should pass if websiteComitente is a valid URL', () => {
    const dataWithValidUrl = { ...validInput, websiteComitente: 'http://example.com' };
    const result = userFormSchema.safeParse(dataWithValidUrl);
    expect(result.success).toBe(true);
  });

  it('should pass if websiteComitente is an empty string (optional or literal)', () => {
    const dataWithEmptyUrl = { ...validInput, websiteComitente: '' };
    const result = userFormSchema.safeParse(dataWithEmptyUrl);
    expect(result.success).toBe(true);
  });

  it('should fail if websiteComitente is an invalid URL', () => {
    const invalidData = { ...validInput, websiteComitente: 'not_a_url' };
    const result = userFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['websiteComitente']);
      expect(result.error.issues[0].message).toBe('URL do website inválida.');
    }
  });

  // Teste para um campo opcional não fornecido
  it('should pass if optional field cpf is not provided', () => {
    const dataWithoutCpf = { ...validInput };
    delete dataWithoutCpf.cpf;
    const result = userFormSchema.safeParse(dataWithoutCpf);
    expect(result.success).toBe(true);
  });
});

console.log('Arquivo de teste src/app/admin/users/user-form-schema.test.ts corrigido (optInMarketing e duplicidade).');

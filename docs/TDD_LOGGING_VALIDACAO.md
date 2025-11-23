# TDD - Testes para Logging e Validação

## Test Suite: User Action Logger

### Unit Tests

```typescript
describe('UserActionLogger', () => {
  let logger: UserActionLogger;
  
  beforeEach(() => {
    logger = new UserActionLogger();
    logger.clear();
  });

  test('should create log entry with correct structure', () => {
    logger.log('form', 'Field changed', { field: 'title' }, 'Auctions');
    
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      category: 'form',
      action: 'Field changed',
      details: { field: 'title' },
      module: 'Auctions',
    });
    expect(logs[0].timestamp).toBeDefined();
  });

  test('should maintain maximum 500 logs', () => {
    for (let i = 0; i < 600; i++) {
      logger.log('interaction', `Action ${i}`);
    }
    
    const logs = logger.getLogs();
    expect(logs).toHaveLength(500);
  });

  test('should filter logs by category', () => {
    logger.log('form', 'Action 1');
    logger.log('navigation', 'Action 2');
    logger.log('form', 'Action 3');
    
    const formLogs = logger.getLogs({ category: 'form' });
    expect(formLogs).toHaveLength(2);
    expect(formLogs[0].category).toBe('form');
    expect(formLogs[1].category).toBe('form');
  });

  test('should filter logs by module', () => {
    logger.log('form', 'Action 1', {}, 'Auctions');
    logger.log('form', 'Action 2', {}, 'Lots');
    logger.log('form', 'Action 3', {}, 'Auctions');
    
    const auctionLogs = logger.getLogs({ module: 'Auctions' });
    expect(auctionLogs).toHaveLength(2);
  });

  test('should filter logs by date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    logger.log('form', 'Old action');
    
    const recentLogs = logger.getLogs({ since: new Date() });
    expect(recentLogs).toHaveLength(0);
  });

  test('should export logs as JSON', () => {
    logger.log('form', 'Test action');
    
    const exported = logger.export();
    const parsed = JSON.parse(exported);
    
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });

  test('should clear all logs', () => {
    logger.log('form', 'Action 1');
    logger.log('form', 'Action 2');
    
    expect(logger.getLogs()).toHaveLength(2);
    
    logger.clear();
    expect(logger.getLogs()).toHaveLength(0);
  });

  test('should respect enabled state', () => {
    logger.setEnabled(false);
    logger.log('form', 'Should not log');
    
    expect(logger.getLogs()).toHaveLength(0);
    
    logger.setEnabled(true);
    logger.log('form', 'Should log');
    
    expect(logger.getLogs()).toHaveLength(1);
  });

  test('should set data attributes on document body', () => {
    logger.log('form', 'Test action');
    
    expect(document.body.getAttribute('data-last-action')).toBe('Test action');
    expect(document.body.getAttribute('data-last-action-time')).toBeDefined();
  });
});

describe('Convenience logging functions', () => {
  beforeEach(() => {
    userActionLogger.clear();
  });

  test('logNavigation should log with navigation category', () => {
    logNavigation('Page loaded', { page: 'auctions' }, 'Auctions');
    
    const logs = userActionLogger.getLogs();
    expect(logs[0].category).toBe('navigation');
  });

  test('logFormAction should log with form category', () => {
    logFormAction('Field changed', { field: 'title' }, 'Auctions');
    
    const logs = userActionLogger.getLogs();
    expect(logs[0].category).toBe('form');
  });

  test('logSelection should log with selection category', () => {
    logSelection('Process selected', { id: '123' }, 'Lots');
    
    const logs = userActionLogger.getLogs();
    expect(logs[0].category).toBe('selection');
  });

  test('logCrudAction should log with crud category', () => {
    logCrudAction('Record created', { id: '456' }, 'Tenants');
    
    const logs = userActionLogger.getLogs();
    expect(logs[0].category).toBe('crud');
  });

  test('logValidation should log with validation category', () => {
    logValidation('Validation performed', { isValid: true }, 'Forms');
    
    const logs = userActionLogger.getLogs();
    expect(logs[0].category).toBe('validation');
  });

  test('logError should log with error category', () => {
    logError('Save failed', { error: 'Network error' }, 'API');
    
    const logs = userActionLogger.getLogs();
    expect(logs[0].category).toBe('error');
  });
});
```

---

## Test Suite: Form Validator

```typescript
describe('validateFormData', () => {
  const simpleSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    age: z.number().min(18),
  });

  test('should validate correct data', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };
    
    const result = validateFormData(data, simpleSchema);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect missing required fields', () => {
    const data = {
      name: 'Jo',
      email: '',
    };
    
    const result = validateFormData(data, simpleSchema);
    
    expect(result.isValid).toBe(false);
    expect(result.missingRequired).toContain('email');
    expect(result.missingRequired).toContain('age');
  });

  test('should detect format errors', () => {
    const data = {
      name: 'John Doe',
      email: 'invalid-email',
      age: 25,
    };
    
    const result = validateFormData(data, simpleSchema);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('email');
  });

  test('should calculate field counts correctly', () => {
    const data = {
      name: 'John',
      email: 'john@example.com',
      age: 15, // Invalid (< 18)
    };
    
    const result = validateFormData(data, simpleSchema);
    
    expect(result.fieldCount.total).toBe(3);
    expect(result.fieldCount.filled).toBe(3);
    expect(result.fieldCount.invalid).toBe(1);
  });

  test('should handle nested objects', () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });
    
    const data = {
      user: {
        name: 'John',
        email: 'invalid',
      },
    };
    
    const result = validateFormData(data, nestedSchema);
    
    expect(result.isValid).toBe(false);
    expect(result.errors[0].field).toBe('user.email');
  });
});

describe('convertRHFErrors', () => {
  test('should convert React Hook Form errors', () => {
    const rhfErrors = {
      name: {
        type: 'required',
        message: 'Name is required',
      },
      email: {
        type: 'pattern',
        message: 'Invalid email',
      },
    };
    
    const errors = convertRHFErrors(rhfErrors);
    
    expect(errors).toHaveLength(2);
    expect(errors[0].field).toBe('name');
    expect(errors[0].message).toBe('Name is required');
  });

  test('should handle nested RHF errors', () => {
    const rhfErrors = {
      address: {
        street: {
          type: 'required',
          message: 'Street is required',
        },
      },
    };
    
    const errors = convertRHFErrors(rhfErrors);
    
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('address.street');
  });
});

describe('formatValidationSummary', () => {
  test('should format valid result', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      fieldCount: { total: 5, filled: 5, valid: 5, invalid: 0 },
      missingRequired: [],
    };
    
    const summary = formatValidationSummary(result);
    
    expect(summary).toContain('✓ Aprovado');
    expect(summary).toContain('5/5 válidos');
  });

  test('should format invalid result with missing fields', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      fieldCount: { total: 5, filled: 3, valid: 2, invalid: 1 },
      missingRequired: ['name', 'email'],
    };
    
    const summary = formatValidationSummary(result);
    
    expect(summary).toContain('✗ Reprovado');
    expect(summary).toContain('Campos obrigatórios faltando (2)');
    expect(summary).toContain('name');
    expect(summary).toContain('email');
  });

  test('should format result with errors', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [
        { field: 'email', message: 'Invalid email', type: 'pattern' },
        { field: 'age', message: 'Must be 18+', type: 'min' },
      ],
      fieldCount: { total: 5, filled: 5, valid: 3, invalid: 2 },
      missingRequired: [],
    };
    
    const summary = formatValidationSummary(result);
    
    expect(summary).toContain('Erros (2)');
    expect(summary).toContain('email: Invalid email');
    expect(summary).toContain('age: Must be 18+');
  });
});
```

---

## Test Suite: useFormValidationCheck Hook

```typescript
describe('useFormValidationCheck', () => {
  const schema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
  });

  test('should perform validation check', () => {
    const { result } = renderHook(() => {
      const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: 'Jo', email: 'invalid' },
      });
      
      return useFormValidationCheck({
        form,
        schema,
        moduleName: 'Test',
      });
    });
    
    act(() => {
      result.current.performValidationCheck();
    });
    
    expect(result.current.validationResult).toBeDefined();
    expect(result.current.validationResult?.isValid).toBe(false);
  });

  test('should calculate validation progress', () => {
    const { result } = renderHook(() => {
      const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: 'John Doe', email: 'john@example.com' },
      });
      
      return useFormValidationCheck({
        form,
        schema,
        moduleName: 'Test',
      });
    });
    
    act(() => {
      result.current.performValidationCheck();
    });
    
    const progress = result.current.getValidationProgress();
    expect(progress).toBe(100);
  });

  test('should check if ready to submit', () => {
    const { result } = renderHook(() => {
      const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: 'John', email: 'john@example.com' },
      });
      
      return useFormValidationCheck({
        form,
        schema,
        moduleName: 'Test',
      });
    });
    
    // Mark form as dirty
    act(() => {
      result.current.form.setValue('name', 'Jane', { shouldDirty: true });
    });
    
    const ready = result.current.isReadyToSubmit();
    expect(ready).toBe(true);
  });

  test('should auto-validate when enabled', async () => {
    const { result } = renderHook(() => {
      const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: 'John', email: '' },
      });
      
      return useFormValidationCheck({
        form,
        schema,
        moduleName: 'Test',
        autoValidate: true,
      });
    });
    
    // Wait for initial auto-validation
    await waitFor(() => {
      expect(result.current.validationResult).toBeDefined();
    });
    
    // Change field
    act(() => {
      result.current.form.setValue('email', 'john@example.com');
    });
    
    // Wait for auto-validation to run
    await waitFor(() => {
      expect(result.current.validationResult?.isValid).toBe(true);
    });
  });
});
```

---

## Test Suite: Form Logging Helpers

```typescript
describe('Form Logging Helpers', () => {
  beforeEach(() => {
    userActionLogger.clear();
  });

  describe('withLogging', () => {
    test('should wrap handler and log', () => {
      const mockHandler = jest.fn();
      const wrapped = withLogging(mockHandler, 'testField', 'TestModule');
      
      wrapped('test value');
      
      expect(mockHandler).toHaveBeenCalledWith('test value');
      const logs = userActionLogger.getLogs();
      expect(logs[0].action).toContain('Field changed: testField');
    });
  });

  describe('loggedSelectChange', () => {
    test('should log select with label', () => {
      const mockOnChange = jest.fn();
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ];
      
      const wrapped = loggedSelectChange(mockOnChange, 'category', 'Lots', options);
      wrapped('1');
      
      expect(mockOnChange).toHaveBeenCalledWith('1');
      const logs = userActionLogger.getLogs();
      expect(logs[0].details?.label).toBe('Option 1');
    });
  });

  describe('loggedInputChange', () => {
    test('should log input change', () => {
      const mockOnChange = jest.fn();
      const wrapped = loggedInputChange(mockOnChange, 'title', 'Auctions');
      
      const event = {
        target: { value: 'New Title' },
      } as React.ChangeEvent<HTMLInputElement>;
      
      wrapped(event);
      
      expect(mockOnChange).toHaveBeenCalledWith('New Title');
      const logs = userActionLogger.getLogs();
      expect(logs[0].action).toContain('Input changed: title');
    });

    test('should truncate long values in log', () => {
      const mockOnChange = jest.fn();
      const wrapped = loggedInputChange(mockOnChange, 'description', 'Auctions');
      
      const longValue = 'a'.repeat(100);
      const event = {
        target: { value: longValue },
      } as React.ChangeEvent<HTMLInputElement>;
      
      wrapped(event);
      
      const logs = userActionLogger.getLogs();
      expect(logs[0].details?.value.length).toBeLessThanOrEqual(50);
    });
  });

  describe('loggedSwitchChange', () => {
    test('should log switch toggle', () => {
      const mockOnChange = jest.fn();
      const wrapped = loggedSwitchChange(mockOnChange, 'isActive', 'Settings');
      
      wrapped(true);
      
      expect(mockOnChange).toHaveBeenCalledWith(true);
      const logs = userActionLogger.getLogs();
      expect(logs[0].action).toContain('Switch toggled: isActive');
      expect(logs[0].details?.checked).toBe(true);
    });
  });

  describe('loggedButtonClick', () => {
    test('should log button click', () => {
      const mockOnClick = jest.fn();
      const wrapped = loggedButtonClick(mockOnClick, 'Save', 'Forms');
      
      wrapped();
      
      expect(mockOnClick).toHaveBeenCalled();
      const logs = userActionLogger.getLogs();
      expect(logs[0].action).toContain('Button clicked: Save');
    });
  });

  describe('addFormFieldLogging', () => {
    test('should add logging to all fields', () => {
      const form = useForm({
        defaultValues: { name: '', email: '' },
      });
      
      const unsubscribe = addFormFieldLogging(form, 'TestModule');
      
      act(() => {
        form.setValue('name', 'John');
      });
      
      const logs = userActionLogger.getLogs();
      expect(logs.some(log => log.action.includes('Field updated: name'))).toBe(true);
      
      unsubscribe();
    });

    test('should log only specified fields', () => {
      const form = useForm({
        defaultValues: { name: '', email: '', phone: '' },
      });
      
      const unsubscribe = addFormFieldLogging(form, 'TestModule', ['name', 'email']);
      
      act(() => {
        form.setValue('name', 'John');
        form.setValue('phone', '123456');
      });
      
      const logs = userActionLogger.getLogs();
      expect(logs.some(log => log.action.includes('name'))).toBe(true);
      expect(logs.some(log => log.action.includes('phone'))).toBe(false);
      
      unsubscribe();
    });
  });

  describe('logSectionChange', () => {
    test('should log section navigation', () => {
      logSectionChange('Contact Info', 'Tenants');
      
      const logs = userActionLogger.getLogs();
      expect(logs[0].action).toContain('Section opened: Contact Info');
      expect(logs[0].category).toBe('interaction');
    });
  });

  describe('logTabChange', () => {
    test('should log tab navigation', () => {
      logTabChange('Settings', 'Admin');
      
      const logs = userActionLogger.getLogs();
      expect(logs[0].action).toContain('Tab switched: Settings');
      expect(logs[0].category).toBe('interaction');
    });
  });
});
```

---

## Integration Tests: Playwright

```typescript
describe('Logging and Validation Integration', () => {
  test('Complete form flow with logging', async ({ page }) => {
    await page.goto('/admin/auctions/new');
    
    // Check page load log
    await page.waitForFunction(
      () => document.body.getAttribute('data-last-action')?.includes('Form initialized')
    );
    
    // Fill field with logging
    await page.fill('input[name="title"]', 'Test Auction');
    await page.waitForFunction(
      () => document.body.getAttribute('data-last-action')?.includes('field changed: title')
    );
    
    // Select entity with logging
    await page.selectOption('select[name="auctioneerId"]', { index: 1 });
    await page.waitForFunction(
      () => document.body.getAttribute('data-last-action')?.includes('auctioneer selected')
    );
    
    // Validate form
    await page.click('text=Validar Formulário');
    await page.waitForSelector('text=Validação');
    
    // Check validation log
    await page.waitForFunction(
      () => document.body.getAttribute('data-last-action')?.includes('validation check')
    );
    
    // Submit form
    await page.click('text=Salvar');
    await page.waitForFunction(
      () => document.body.getAttribute('data-last-action')?.includes('Saving data')
    );
  });

  test('Access logger from browser context', async ({ page }) => {
    await page.goto('/admin/lots/new');
    
    // Interact with form
    await page.fill('input[name="title"]', 'Test Lot');
    await page.click('text=Informações Gerais');
    
    // Get all logs
    const allLogs = await page.evaluate(() => {
      return (window as any).__userActionLogger.getLogs();
    });
    
    expect(allLogs.length).toBeGreaterThan(0);
    
    // Get filtered logs
    const formLogs = await page.evaluate(() => {
      return (window as any).__userActionLogger.getLogs({ category: 'form' });
    });
    
    expect(formLogs.every((log: any) => log.category === 'form')).toBe(true);
  });

  test('Validation dialog shows correct information', async ({ page }) => {
    await page.goto('/admin/tenants/new');
    
    // Fill partial data
    await page.fill('input[name="name"]', 'Test Tenant');
    
    // Click validate
    await page.click('text=Validar Formulário');
    
    // Check dialog content
    await expect(page.locator('text=Validação Reprovada')).toBeVisible();
    await expect(page.locator('text=Campos obrigatórios faltando')).toBeVisible();
    await expect(page.locator('text=subdomain')).toBeVisible();
    
    // Check progress bar
    const progress = await page.locator('role=progressbar').getAttribute('aria-valuenow');
    expect(parseInt(progress || '0')).toBeLessThan(100);
  });
});
```

---

## Coverage Goals

- **Unit Tests**: 100% coverage of logger, validator, and helpers
- **Hook Tests**: 100% coverage of custom hooks
- **Integration Tests**: All major user flows
- **E2E Tests**: Critical paths in each CRUD module

## Test Execution

```bash
# Unit tests
npm run test

# Integration tests with Playwright
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

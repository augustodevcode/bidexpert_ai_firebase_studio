# Documentação: Cards de Participantes no Cadastro de Leilões

## Visão Geral

Esta feature adiciona uma exibição visual rica dos participantes selecionados (Leiloeiro, Comitente e Processo Judicial) no formulário de cadastro de leilões. Quando um participante é selecionado, um card informativo é exibido abaixo do seletor, mostrando foto/logo e dados básicos.

## Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/components/admin/participant-card.tsx`**
   - Componente reutilizável para exibição de cards de participantes
   - Suporta três tipos: `auctioneer`, `seller`, `judicialProcess`
   - Inclui avatar/logo, badge de tipo, informações de contato e botão de remoção

2. **`tests/unit/participant-card.spec.tsx`**
   - 19 testes unitários cobrindo todos os cenários
   - Testes para cada tipo de participante
   - Testes de funcionalidade de remoção
   - Testes de tratamento de dados nulos

3. **`tests/e2e/admin/participant-cards-e2e.spec.ts`**
   - Testes E2E para validar a integração no formulário
   - Testes de seleção e exibição de cards
   - Testes de remoção pelo botão X
   - Testes de layout responsivo

### Arquivos Modificados

1. **`src/app/admin/auctions/auction-form.tsx`**
   - Importação do novo componente `ParticipantCard`
   - Seção de participantes atualizada para exibir cards quando selecionados
   - Lógica para encontrar dados completos dos participantes selecionados

## Estrutura do Componente ParticipantCard

### Props

```typescript
interface ParticipantCardProps {
  type: 'auctioneer' | 'seller' | 'judicialProcess';
  data: ParticipantCardData | null;
  onRemove?: () => void;
  className?: string;
}

interface ParticipantCardData {
  id: string;
  name: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
  description?: string | null;
  // Campos específicos para processo judicial
  processNumber?: string;
  courtName?: string;
  districtName?: string;
  branchName?: string;
  isElectronic?: boolean;
}
```

### Características Visuais

- **Badge colorido** identificando o tipo de participante:
  - Leiloeiro: Azul/Primary
  - Comitente: Verde
  - Processo Judicial: Âmbar

- **Avatar/Logo**: 
  - Para leiloeiro e comitente: Avatar circular com logo ou iniciais
  - Para processo judicial: Ícone de documento

- **Informações exibidas**:
  - Nome/Número do processo
  - Email
  - Telefone
  - Localização (cidade, estado)
  - Número de registro (para leiloeiros)
  - Nome do tribunal e vara (para processos judiciais)
  - Badge de processo eletrônico/físico

- **Botão de remoção**: X no canto superior direito com hover effect

## Uso

```tsx
import { ParticipantCard } from '@/components/admin/participant-card';

// Exemplo de uso para leiloeiro
<ParticipantCard
  type="auctioneer"
  data={{
    id: '1',
    name: 'Leiloeiro João Silva',
    email: 'joao@leiloeiro.com',
    phone: '(11) 99999-9999',
    city: 'São Paulo',
    state: 'SP',
    registrationNumber: 'JUCESP-123456',
  }}
  onRemove={() => form.setValue('auctioneerId', '')}
/>

// Exemplo para processo judicial
<ParticipantCard
  type="judicialProcess"
  data={{
    id: '3',
    name: '0098765-43.2024.8.26.0100',
    processNumber: '0098765-43.2024.8.26.0100',
    courtName: 'TJSP',
    branchName: '10ª Vara Cível',
    isElectronic: true,
  }}
  onRemove={() => form.setValue('judicialProcessId', '')}
/>
```

## Testes

### Executar Testes Unitários

```bash
npx vitest run tests/unit/participant-card.spec.tsx --reporter=verbose
```

### Executar Testes E2E

```bash
npm run build && npm start
# Em outro terminal:
npx playwright test tests/e2e/admin/participant-cards-e2e.spec.ts
```

## Design System

O componente segue o design system do projeto:
- Usa tokens de cor semânticos (`primary`, `destructive`, `muted`)
- Utiliza componentes ShadCN (Card, Badge, Avatar, Button)
- Responsivo com grid que se adapta a diferentes tamanhos de tela
- Efeitos de hover consistentes com o resto da aplicação

## Acessibilidade

- Botão de remoção tem `aria-label` descritivo
- Cards têm `data-testid` para facilitar testes automatizados
- Atributos `title` para textos truncados

## Melhorias Futuras

1. Adicionar loading state quando buscando dados adicionais
2. Implementar preview de logo em modal ao clicar
3. Adicionar link para edição do participante
4. Suporte a drag-and-drop para reordenar participantes

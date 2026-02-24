---
description: Unified Frontend Design and Component rules for BidExpert.
---

# 🎨 Frontend & Design System Workflow

Este workflow garante a consistência visual e a qualidade do código frontend baseada no Shadcn UI e Tailwind CSS.

## 💎 Princprimary Design Principles
- **Wow Factor**: O design deve ser premium, moderno e vibrante.
- **Tokens Semânticos**: **NUNCA** use cores hardcoded (ex: `text-white`, `bg-[#f2f2f2]`). Use tokens HSL definidos no `globals.css` e `tailwind.config.ts`.
- **Primary Color**: Orange `hsl(25 95% 53%)`.

## 🏗️ Uso de Componentes Universais (MANDATÓRIO)
Para garantir a consistência, você **DEVE** usar os componentes universais em vez de instanciar cards específicos:

- **Cards**: Use `BidExpertCard` (ele decide internamente se renderiza `AuctionCard`, `LotCard`, etc.).
- **Listas**: Use `BidExpertListItem`.
- **Endereço**: Use `AddressGroup.tsx` para qualquer formulário que exija endereço/mapa (RN-004, RN-016).
- **Timeline**: Use `BidExpertAuctionStagesTimeline` para exibir praças de leilão (RN-008).

## 📝 Validação de Formulários (RN-003)
- Campos obrigatórios **DEVEM** ter asterisco vermelho (`*`).
- Botão de submissão desabilitado enquanto o formulário for inválido.
- Exibir Toast de feedback em todas as ações de sucesso/erro.
- Adicionar botões de "Validador de Regras" para guiar o usuário aos campos pendentes.

## 🏷️ Testabilidade (data-ai-id)
Adicione o atributo `data-ai-id` em elementos críticos para facilitar testes E2E:
- Botões de ação (`lot-create`, `auction-save`).
- Inputs de busca e filtros.
- Seções principais (`super-opportunities-section`).

## 🖼️ Mídia e Imagens
- Implementar **Herança de Mídia** (RN-005): Lotes herdam do Ativo, Leilões herdam do Lote principal.
- Use `generate_image` para criar assets de placeholder reais e atraentes.
- Imagens devem usar `loading="lazy"` por padrão (SEO).

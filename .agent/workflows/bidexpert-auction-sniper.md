---
description: Auction Sniper strategy and QA protocol for bidding integrity.
---

# 🕵️ Auction Sniper & QA Architect

Este workflow foca na integridade do motor de leilões e na experiência de arremate.

## 📋 Protocolo de Auditoria

### 🔍 BLOCO 1: Inteligência de Busca & Filtros
- Validar cálculo de deságio (% sobre avaliação).
- Ordenação ROI (Menor Valor + Taxas).
- Persistência de filtros entre navegação.

### 🖼️ BLOCO 2: UI/UX - Cards & Banners
- Indicador "N pessoas olhando" (Social Proof).
- Cronômetro Traffic Light (Verde -> Amarelo -> Vermelho).
- Badge de "Alta Demanda" (> threshold).
- Pulse effect nos últimos 60 segundos.

### 📄 BLOCO 3: Página do Lote & ROI
- Botão "Dar Lance" no quadrante superior direito (F-Pattern).
- Sticky Bar de lance sempre acessível no scroll.
- Calculadora de ROI interativa vinculada ao edital.

### 🛡️ BLOCO 5: Segurança & Integridade
- **Timestamp Sync**: Registro servidor vs cliente (diff < 100ms).
- **Double Click Shield**: Bloqueio de lances duplicados (< 2s).
- **Audit Log**: IP/Device/Timestamp em cada clique de lance.
- **Concurrent Lock**: Impedir login duplo no mesmo leilão.

## 🧪 Teste de Cenários (Gherkin)
Sempre testar:
- Sniping nos últimos 10 segundos.
- Lances simultâneos de 2+ usuários.
- Mudança de edital durante análise do usuário.
- Sessão expirada tentando dar lance.

## ✅ Checklist Final
- **Sincronização**: Cliente e servidor em harmonia (< 100ms).
- **Performance**: Sem lag > 500ms em ações críticas.
- **Real-time**: WebSocket ativo ou polling < 2s.
- **Audit Trail**: Rastro completo de ações.

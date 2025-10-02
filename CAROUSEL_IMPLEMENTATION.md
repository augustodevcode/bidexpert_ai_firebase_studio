# ✅ Carousel "Encerrando em Breve" - Estilo E-commerce

## 🎯 Implementação Completa

Recriei o componente seguindo o exemplo HTML fornecido, com layout horizontal em carousel similar a sites de e-commerce.

## 📁 Arquivos Criados/Modificados

### ✅ Novo Componente
- **`src/components/closing-soon-carousel.tsx`** - Carousel horizontal com countdown global

### ✅ Arquivos Modificados
- **`src/app/home-page-client.tsx`** - Usa o novo componente carousel

## 🎨 Características do Novo Design

### **Header com Countdown Global**
- ⏰ Contador único no topo mostrando o lote mais próximo de encerrar
- 📊 4 boxes separados: Dias, Horas, Minutos, Segundos
- 🎨 Design em branco com números vermelhos
- 📱 Responsivo: empilha em mobile

### **Carousel Horizontal**
- ➡️ Scroll horizontal com cards compactos (220px cada)
- 🔄 Navegação com setas laterais (desktop)
- 📱 Scroll touch em mobile
- 🎯 Cards menores e mais compactos

### **Cards de Lote Compactos**
- 📏 Tamanho fixo: 220px de largura
- 🖼️ Imagem 48px de altura
- 🏷️ Badge de desconto no canto superior esquerdo
- 💰 Preço destacado em verde
- 📍 Localização com emoji
- 📊 Barra de progresso de vendas
- ✨ Hover: zoom na imagem + sombra

### **Layout Responsivo**
- 💻 Desktop: Múltiplos cards visíveis
- 📱 Mobile: 1-2 cards visíveis com scroll
- 🔘 Botões de navegação apenas em desktop

## 🎯 Diferenças do Design Anterior

| Aspecto | Antes | Agora |
|---------|-------|-------|
| **Layout** | Grid 4 colunas | Carousel horizontal |
| **Cards** | Grandes (full height) | Compactos (220px) |
| **Countdown** | Individual por card | Global no header |
| **Navegação** | Scroll vertical | Scroll horizontal |
| **Espaçamento** | Gap fixo | Scroll contínuo |
| **Visual** | Cards destacados | Estilo e-commerce |

## 💻 Tecnologias

- **Embla Carousel** - Carousel suave e performático
- **React Hooks** - useState, useEffect, useCallback
- **Tailwind CSS** - Estilização responsiva
- **Next.js Image** - Otimização de imagens

## 🚀 Como Funciona

### Lógica do Countdown Global
```typescript
// Pega a data de encerramento mais próxima de todos os lotes
const closestEndDate = lots.reduce((closest, lot) => {
  if (!lot.endDate) return closest;
  return new Date(lot.endDate) < new Date(closest) 
    ? lot.endDate 
    : closest;
}, lots[0]?.endDate);
```

### Configuração do Carousel
```typescript
const [emblaRef, emblaApi] = useEmblaCarousel({ 
  loop: false,        // Não loop infinito
  align: 'start',     // Alinha no início
  slidesToScroll: 1,  // Scroll de 1 em 1
});
```

## 📊 Dados Necessários

Os lotes precisam ter:
- ✅ `endDate` - Data de encerramento
- ✅ `price` ou `initialPrice` - Preços
- ✅ `imageUrl` - Imagem do lote
- ✅ `cityName` e `stateUf` - Localização
- ✅ `bidsCount` - Número de lances (opcional)

## 🎨 Cores e Estilo

- **Countdown**: Vermelho (#EF4444) em fundo branco
- **Desconto**: Vermelho (#EF4444)
- **Preço**: Verde (#16A34A)
- **Progresso**: Azul (#2563EB)
- **Cards**: Branco com sombra sutil

## 📝 Executar Seed

```bash
# Criar lotes de teste
npx tsx scripts/seed-closing-lots-simple.ts
```

## ✅ Resultado

Uma seção carousel moderna que:
- ✅ Segue o padrão de e-commerce do exemplo HTML
- ✅ Countdown global destacado no topo
- ✅ Cards compactos em scroll horizontal
- ✅ Navegação intuitiva com setas
- ✅ Totalmente responsivo
- ✅ Performance otimizada com Embla
- ✅ Integrado perfeitamente com o design existente

**Recarregue a aplicação para ver o novo carousel! 🎉**

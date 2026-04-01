# 📊 Relatório de Auditoria Competitiva: VIP Leilões vs BidExpert

Com base na auditoria comparativa utilizando o `browser_subagent` simulando a navegação humana no site da **VIP Leilões** e confrontando com a Backoffice da **BidExpert** no nosso Wizard de criação de Leilão/Lote, identificamos os seguintes "gaps" de funcionalidades que precisam ser endereçados para tornar o BidExpert superior.

## 1. Auditoria de Metadados e Campos de Lote (Veículos)

| Recurso / Campo | VIP Leilões | BidExpert (Atual) | Status | Ação Recomendada |
| :--- | :--- | :--- | :--- | :--- |
| **Renavam/Placa** | Campo estruturado com "Final de Placa". | Apenas em notas generalistas. | ❌ | Adicionar no Schema Prisma de `Asset`. |
| **Status Mecânico** | Badges ("Funcionando", "Chave: Sim"). | Descrição textual única. | ❌ | Criar atributo `conditionTags` jsonb/array. |
| **IPVA/Débitos** | Destaque "IPVA Pago" / Débitos Mapeados. | Texto livre. | ❌ | Flag booleana `ipvaPaid` e tabela `AssetDebts`. |
| **Split de Custos** | Mostra Comissão, Taxa Logística e Admin. | Campo genérico "Comissão"/"Taxas". | ⚠️ | Dividir `fees` em modelo estruturado. |
| **Mídia Avançada** | Botão de Vídeo direto na galeria + 50 fotos. | Galeria apenas de URLs de imagem. | ⚠️ | Suporte a `VIDEO` no `MediaItem`. |

## 2. Experiência do Investidor (UX/UI Frontend)

*   **Prova Social e Escassez:** A VIP Leilões utiliza gatilhos como "646 visualizações" e "3 pessoas visualizando agora". O BidExpert não rastreia pageviews por lote em tempo real.
*   **Transparência de Custos (Calculadora de ROI):** Na VIP, é muito claro o valor final com as taxas administrativas separadas do lance. Precisamos criar o **Simulador de Arremate** (Soma do Lance + Comissão Leiloeiro + Taxa Logística + Transferência).
*   **Histórico de Preços (Ancoragem):** Exibir "Vendido por X" em lotes similares.

## 3. Falhas Encontradas no Admin (BidExpert)

1. **Validação de Ativos:** Nós resolvemos a restrição de loteamento duplicado na camada de banco/serviço, porém o form UI do Admin não desativa visualmente os ativos "já loteados" claramente ou avisa o admin *antes* da submissão do formulário.
2. **Gerador de Edital/Termos:** A criação de anexos depende do admin subir o arquivo manualmente (URL/Arquivo). O sistema ideal teria o Gerador OCR e de Relatórios Automático já engatilhado no Wizard.

## 🚀 Próximos Passos (Proposta de Implementação)

Estes são os incrementos que recomendo que possamos fazer a seguir:

1. **Atualizar o Prisma Schema:** Adicionar colunas `plate`, `renavam`, `ipvaPaid`, `conditionTags` e `videoUrl` para a gestão do Ativo e do Lote.
2. **Alterar o Wizard & Formulários:** Ajustar os arquivos no `/src/app/admin/wizard/` e nas server actions para gravar e consultar estes dados.
3. **Adicionar o componente de "Simulador de Custo":** Trazer a UI de Calculadora de Investimento para a página de lote pública.

---
*Relatório gerado automaticamente sob ótica crítica do Auction Sniper & QA Architect.*

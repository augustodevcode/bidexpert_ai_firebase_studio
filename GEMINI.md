# Regras e Diretrizes para o Gemini (App Prototyper)

Este documento descreve as regras e o modo de operação do assistente de IA (Gemini) neste projeto.

## 1. Persona e Objetivo

-   **Persona**: Eu sou o App Prototyper do Firebase Studio, um parceiro de codificação colaborativo e especializado.
-   **Objetivo Principal**: Ajudá-lo a fazer alterações no código do seu aplicativo de forma conversacional e intuitiva.

## 2. Capacidades Principais

-   **Edição de Arquivos em Lote**: A principal forma de interação é através de pedidos para alterar o código. Eu gero um "plano de alteração" em formato XML que é então executado automaticamente para modificar os arquivos.
-   **Stack de Tecnologia Predefinida**: O aplicativo é construído com **Next.js, React, ShadCN UI, Tailwind CSS, e Genkit**. Pedidos para usar outras tecnologias (como Angular, Vue, etc.) serão educadamente recusados para manter a consistência do projeto.

## 3. Formato Essencial para Mudanças de Código (XML)

Qualquer pedido para modificar o código do aplicativo **deve** ser respondido por mim usando a estrutura XML definida nas minhas diretrizes operacionais.

## 4. Arquitetura Multi-Tenant e Isolamento de Dados

**Regra:** A aplicação opera sob uma arquitetura multi-tenant estrita. Todo acesso a dados deve ser isolado por um `tenantId`.

-   **Identificação do Tenant:**
    -   **Subdomínio:** O tenant ativo é identificado pelo subdomínio da requisição (ex: `leiloeiro-x.bidexpert.com` resolve para o `tenantId` de "leiloeiro-x"). Isso é gerenciado por um middleware do Next.js.
    -   **Domínio Principal (Landlord):** Requisições ao domínio principal (definido pela variável de ambiente `LANDLORD_URL`) devem sempre resolver para o tenant "Landlord" (`id = '1'`).
    -   **Sessão:** Para usuários autenticados, o `tenantId` é armazenado na sessão e tem precedência, garantindo que o usuário permaneça em seu espaço de trabalho selecionado.
-   **Schema:** Todos os modelos de dados relevantes (Leilões, Lotes, Comitentes, etc.) devem ter um campo `tenantId` obrigatório. Modelos globais como `User`, `Role`, `State` não possuem `tenantId`.
-   **Acesso a Dados:** Todas as consultas ao banco de dados (leitura, escrita, atualização, exclusão) realizadas através dos Serviços e Repositórios **devem** ser filtradas pelo `tenantId` do contexto da requisição atual. Isso é garantido por um middleware do Prisma.
-   **Segurança:** Um usuário de um tenant **nunca** deve conseguir acessar, visualizar ou modificar dados pertencentes a outro tenant.

**Justificativa:** Esta regra é o pilar da segurança e integridade dos dados da plataforma, garantindo que os dados de cada cliente (leiloeiro) permaneçam completamente isolados.

## 5. Exibição Pública de Conteúdo (Regra Crítica)

**Regra:** O conteúdo visível publicamente deve ser estritamente controlado para garantir uma experiência de usuário limpa e relevante.

-   **Regra 5.1: Status de Preparação:** Leilões e lotes associados a leilões com o status `"RASCUNHO"` ou `"EM_PREPARACAO"` **nunca** devem ser retornados em consultas para páginas de acesso público (home, busca, páginas de categoria, etc.). Esta filtragem deve ser aplicada na camada de acesso a dados (Repositório) para máxima segurança.
-   **Regra 5.2: Conteúdo da Homepage:** A página inicial **deve exibir apenas** leilões e lotes com status que indicam uma oportunidade ativa ou futura (ex: `"ABERTO_PARA_LANCES"`, `"EM_BREVE"`). Leilões `"ENCERRADO"`, `"FINALIZADO"` ou `"CANCELADO"` **não devem** aparecer na homepage, mas podem ser acessados através da página de busca.

**Justificativa:** Garante que os usuários finais vejam apenas conteúdo relevante e finalizado, evitando a exposição de leilões incompletos, cancelados ou já terminados na página principal. Aplicar o filtro de status de preparação na camada de repositório cria uma barreira de segurança mais robusta.

## 6. Estrutura Modular do Schema Prisma

**Regra:** Para manter a organização e a legibilidade do modelo de dados, o schema do Prisma é modularizado.
- **Diretório de Modelos:** Todos os modelos (`model`) e enumerações (`enum`) do Prisma **devem** ser definidos em arquivos `.prisma` individuais dentro do diretório `prisma/models/`. Cada arquivo deve conter apenas um modelo.
- **Arquivo Principal:** O arquivo `prisma/schema.prisma` é um arquivo **gerado** e **NÃO DEVE SER EDITADO DIRETAMENTE**. Ele contém o cabeçalho de configuração (`generator`, `datasource`) e é populado pelo script de build.
- **Processo de Build:** O script `scripts/build-prisma-schema.ts` é responsável por ler todos os arquivos em `prisma/models/`, concatená-los e gerar o arquivo `prisma/schema.prisma` final.
- **Execução:** Este script é executado automaticamente pelos comandos `npm run dev`, `npm run build` e `npm run db:push`, garantindo que o Prisma sempre opere com o schema mais recente.

**Justificativa:** Esta abordagem evita um arquivo `schema.prisma` monolítico e gigantesco, facilitando a manutenção e a localização de modelos de dados específicos.

## 7. Princípio da Não-Regressão e Autorização Humana

**Regra:** Qualquer exclusão de funcionalidade, componente ou alteração significativa no projeto **deve ser explicitamente autorizada por um usuário humano**. Para evitar a remoção acidental de funcionalidades que estão operando corretamente ao implementar correções ou melhorias, a IA deve:

1.  Declarar claramente a intenção de excluir ou refatorar um componente/arquivo/funcionalidade.
2.  Fornecer uma breve justificativa sobre por que a mudança é necessária.
3.  Solicitar confirmação explícita do usuário antes de gerar as alterações.

**Justificativa:** Este princípio garante que o processo de desenvolvimento esteja sempre avançando e evita regressões. Ele mantém uma salvaguarda onde o desenvolvedor humano tem a palavra final sobre quaisquer alterações destrutivas ou em larga escala, preservando a estabilidade e a integridade do projeto.

## 8. Gerenciamento de Dependências

**Regra:** Para manter o projeto otimizado e evitar o crescimento excessivo do diretório `node_modules` e dos pacotes de produção, siga estas diretrizes:
-   **Dependências de Desenvolvimento:** Pacotes usados exclusivamente para desenvolvimento, teste ou processos de build (e.g., `@playwright/test`, `puppeteer` para geração de PDF no servidor) **devem** ser instalados como `devDependencies`. Isso impede que eles sejam incluídos no build de produção.
-   **Análise de Pacotes Pesados:** Antes de adicionar uma nova dependência, especialmente para funcionalidades não essenciais, avalie seu tamanho e impacto.
-   **Revisão Periódica:** Revise periodicamente o `package.json` para remover dependências não utilizadas.

**Justificativa:** Um `node_modules` grande e pacotes de produção inchados podem levar a tempos de instalação mais longos, builds mais lentos e custos de hospedagem mais altos. Manter as dependências limpas e otimizadas é crucial para a saúde do projeto.

## 9. Integridade de Links (Next.js)

**Regra:** Nunca permita que a propriedade `href` de um componente `<Link>` do Next.js seja `undefined`.

-   **Validação Obrigatória:** Se o `href` for dinâmico (vindo de uma API, props, ou estado), sempre valide se o valor existe antes de renderizar o `<Link>`.
-   **Estratégias de Fallback:**
    -   Use um link padrão (e.g., `href={item.url || '#'}`).
    -   Renderize o link condicionalmente (e.g., `{item.url && <Link.../>}`).
    -   Renderize um elemento alternativo (e.g., `<span>`) se o link não estiver disponível.

**Justificativa:** Um `href` indefinido causa um erro fatal de renderização no Next.js (`Error: Failed prop type`). Garantir a validade do `href` previne crashes e melhora a robustez da aplicação.

## 10. Indicador de Ambiente de Desenvolvimento

**Regra:** Em ambiente de desenvolvimento (`NODE_ENV === 'development'`), o rodapé **deve** exibir o componente `DevInfoIndicator`, que mostra informações de depuração essenciais.
-   **Informações a serem exibidas:**
    -   ID do Tenant Ativo (`activeTenantId`)
    -   Email do Usuário Logado
    -   Sistema de Banco de Dados Ativo
    -   ID do Projeto Firebase

**Justificativa:** Ter essas informações visíveis a todo momento durante o desenvolvimento é crucial para depurar problemas relacionados à arquitetura multi-tenant, permissões de usuário e configuração do ambiente, acelerando a resolução de bugs.

## 11. Integridade do Arquivo de Ambiente (`.env`)

**Regra:** O arquivo `.env` é uma "zona de segurança crítica".
-   **Modificação pela IA é Proibida:** A IA **nunca** deve modificar o arquivo `.env` diretamente.
-   **Backup é Mandatório:** Antes de qualquer alteração manual, o desenvolvedor **deve** criar um backup do arquivo `.env`.
-   **Proibição de Remoção:** Linhas existentes no `.env` **não devem ser removidas**. Elas podem ser comentadas (#), mas nunca apagadas, para evitar quebras inesperadas em outras partes do sistema. Novas variáveis devem ser apenas adicionadas.
-   **Instrução para Alteração:** Se uma variável de ambiente precisar ser alterada, a IA deve:
    1.  Indicar claramente a necessidade da alteração.
    2.  Fornecer ao usuário humano o texto exato que precisa ser adicionado ou modificado.
    3.  Instruir o usuário a fazer a alteração manualmente, lembrando-o do backup.

**Justificativa:** Estas regras garantem que segredos e configurações críticas do ambiente sejam sempre gerenciados e validados por um humano, prevenindo a exposição acidental de dados sensíveis ou a quebra do ambiente por configurações incorretas ou remoção de variáveis essenciais.

## 12. Comentários de Cabeçalho nos Arquivos

**Regra:** Todo arquivo de código-fonte (ex: `.ts`, `.tsx`) **deve** começar com um comentário em bloco (docblock) que explica de forma clara e concisa o propósito do arquivo e suas principais responsabilidades dentro da arquitetura da aplicação.

**Exemplo (`src/services/auction.service.ts`):**
```typescript
// src/services/auction.service.ts
/**
 * @fileoverview Este arquivo contém a classe AuctionService, que encapsula
 * a lógica de negócio principal para o gerenciamento de leilões. Atua como um
 * intermediário entre as server actions (controllers) e o repositório de leilões (camada de dados).
 * Responsabilidades incluem criar, atualizar, validar e buscar dados de leilões.
 */
```

**Justificativa:** Esta prática garante que qualquer desenvolvedor (ou IA) possa entender rapidamente o papel de cada arquivo, reduzindo a ambiguidade e melhorando a manutenibilidade. Além disso, fornece um contexto crucial para o desenvolvimento e análise assistidos por IA.

## 13. Estratégia de Testes para Aplicação de Leilões Full-Stack

A estratégia de testes está documentada no arquivo `README.md` e deve ser seguida para garantir a qualidade e estabilidade do código.

## 14. Gerenciamento Centralizado de Mídia (Regra de Herança e Substituição)

**Regra:** Toda a mídia visual da plataforma (imagens de lotes, leilões, logos) **deve** ser gerenciada através da tabela `MediaItem`. O uso de URLs de imagem estáticas diretamente nos modelos é proibido.

-   **Fonte da Verdade:** A tabela `MediaItem` é a única fonte da verdade para os caminhos e metadados das imagens.
-   **Relação `Asset` -> `MediaItem`:** Imagens são primeiramente vinculadas a um `Asset` (Bem) através da Biblioteca de Mídia. Um `Asset` pode ter uma imagem principal e uma galeria.
-   **Relação `Lot` -> `Asset` (Herança vs. Substituição):**
    -   Ao criar ou editar um `Lot` a partir de um ou mais `Asset`(s), o usuário **deve** ter a opção de:
        1.  **Herdar Galeria:** Selecionar um dos `Asset`(s) vinculados como a fonte principal da mídia. O `Lot` então exibirá a imagem principal e a galeria deste `Asset` escolhido.
        2.  **Galeria Customizada:** Ignorar as imagens dos `Asset`(s) e selecionar uma nova imagem principal e/ou galeria diretamente da `MediaLibrary` (`MediaItem`) para este `Lot` específico.
-   **Relação `Auction` -> `Lot` (Herança vs. Substituição):**
    -   Ao criar ou editar um `Auction`, a imagem principal do leilão pode ser definida por:
        1.  **Herdar de um Lote:** Selecionar um dos `Lot`(s) já vinculados ao leilão. A imagem principal deste `Lot` será usada como a imagem principal do `Auction`.
        2.  **Imagem Customizada:** Ignorar as imagens dos lotes e selecionar uma nova imagem principal diretamente da `MediaLibrary` (`MediaItem`).

**Justificativa:** Este sistema de herança com opção de substituição oferece máxima flexibilidade e consistência. Ele permite o reaproveitamento rápido de mídias (um `Asset` pode ser loteado várias vezes, sempre usando suas imagens padrão), ao mesmo tempo que dá ao usuário o controle para customizar a apresentação de lotes e leilões específicos quando necessário, sem duplicar arquivos e mantendo `MediaItem` como a fonte única da verdade.

    
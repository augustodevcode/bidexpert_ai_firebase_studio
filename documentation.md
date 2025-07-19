# Documentação do Report Designer - DevExpress

## Informações sobre o produto

Esta seção descreve assistentes, designers, modelos, componentes, demonstrações e auxiliares incluídos no DevExpress Reporting.
*   **Pré-requisitos**
    Lista os requisitos de sistema do Devexpress Reporting.
*   **Instalação**
    Fornece informações sobre licenciamento, compra e instalação.
*   **Integração com o Visual Studio**
    Descreve as ferramentas que o DevExpress Reporting integra ao Visual Studio.
*   **Componentes incluídos**
    Descreve os componentes do DevExpress Reporting usados para projetar/visualizar relatórios em tempo de execução.
*   **Demonstrações na instalação**
    Descreve como carregar demonstrações do DevExpress Reporting e revisar seu código-fonte.
*   **Obter ajuda sobre a API**
    Descreve como obter ajuda com o DevExpress Reporting.

## Suporte .NET em relatórios

Os componentes do DevExpress Reports (End-User Report Designer, Visual Studio Report Designer e Document Viewer) são suportados em projetos que visam diferentes versões do .NET.

### End-User Report Designer e Document Viewer

O End-User Report Designer e o Document Viewer são suportados em projetos que visam as seguintes versões do .NET:
*   .NET Framework 4.6.2 ou posterior
*   .NET 8 ou posterior

### Visual Studio Report Designer

O Report Designer é suportado para projetos do Visual Studio que visam as seguintes versões do .NET:
*   .NET Framework 4.6.2 ou posterior
*   .NET 8 ou posterior

### Pré-requisitos

**Projetos .NET Framework**
*   .NET Framework 4.6.2 ou posterior.
*   Visual Studio 2019 ou posterior.

**Projetos .NET**
*   .NET 8 ou posterior
*   Visual Studio 2022 ou posterior.

### Converter projetos do .NET Framework em projetos .NET

O Instalador de Componentes Unificados da DevExpress vem com a Ferramenta de Migração do .NET Core. Você pode usar esta ferramenta para converter seu projeto .NET Framework (WinForms ou WPF) para .NET.

## Visual Studio Report Designer

O Visual Studio Report Designer permite criar relatórios independentes de plataforma, visualizá-los e exportá-los para PDF, XLSX e outros formatos.

### Instale o Report Designer

Use o Instalador de Componentes Unificados da DevExpress para instalar os componentes da DevExpress. Esses componentes incluem o Report Designer.

### Invoque o Report Designer

O Report Designer é suportado para projetos do Visual Studio dos seguintes tipos:
*   Biblioteca de Classes
*   Aplicativo de console
*   WinForms
*   WPF
*   ASP.NET Web Forms
*   ASP.NET MVC
*   ASP.NET Core
*   Blazor Server

### Usar elementos do Report Designer

Depois de invocar o Report Designer, os seguintes elementos aparecem no Visual Studio:
*   Uma janela com as guias Designer, Visualização e Scripts.
*   O menu XtraReports.
*   Painéis de encaixe.

### Especificar configurações de relatório

Use a janela Opções do Report Designer para especificar as configurações de tempo de design do relatório.

### Localizar um relatório

O Report Designer inclui o Editor de Localização que permite localizar um relatório.

### Salvar um relatório

Você pode salvar um relatório e importá-lo para outro projeto ou abrir o relatório no End-User Report Designer.

### Importar um relatório

Clique na marca inteligente do relatório e selecione a ação Abrir/Importar.

### Trabalhar com um relatório em código

O Report Designer serializa seu relatório enquanto você o cria no Visual Studio. Esse mecanismo de serialização permite que você crie uma instância do seu relatório em código.

### Obter ajuda sobre a API de relatórios da DevExpress

Você pode abrir a documentação on-line sobre um controle de relatório ou sua propriedade no Visual Studio. Selecione um controle no Report Designer ou clique em uma propriedade na janela Propriedades e pressione F1.

### Solução de problemas

Se você tiver um código de erro ou comportamento inesperado ao usar o Visual Studio Report Designer, consulte o guia de solução de problemas.

## Extensão do Designer de Relatórios do Visual Studio Code (VS Code) (CTP)

Você pode integrar um DevExpress Report Designer no Visual Studio Code. Depois de baixar a extensão do IDE do Visual Studio Marketplace, você pode criar e editar documentos de relatório em aplicativos que visam qualquer sistema operacional compatível (Linux, macOS ou Windows) e qualquer plataforma baseada em .NET.

### Pré-requisitos

*   Extensão C# do VSCode
*   Extensão da ferramenta de instalação do tempo de execução do .NET para o VSCode
*   SDK do .NET 8
*   Chave de API do feed NuGet da DevExpress (licenciada ou de avaliação)
*   Extensão do Designer de Relatórios do DevExpress para VSCode

### Configurar a extensão do designer de relatórios do VS Code

Consulte a descrição da extensão no Visual Studio Marketplace para obter informações de início rápido.

## Componentes de relatório para a Web

Este tópico apresenta os componentes do DevExpress Reports para a Web.

### Arquitetura de componentes de relatório da Web

### Aplicativos da Web que usam componentes de interface do usuário de relatório

Você pode integrar os componentes DevExpress Document Viewer e End-User Report Designer em aplicativos da web. Esses componentes estão disponíveis para várias plataformas: ASP.NET WebForms, ASP.NET MVC, ASP.NET Core e Blazor. Os componentes também podem ser integrados a aplicativos JavaScript baseados em associações do Knockout ou nas seguintes estruturas: Angular, React e Vue.

### Aplicativos da Web que usam a API de relatório sem componentes da interface do usuário

Use essa abordagem para imprimir ou exportar relatórios quando seu aplicativo não exigir uma visualização interativa do relatório no lado do cliente e você desejar gerar e entregar relatórios de forma assíncrona de maneira leve e orientada por API.

### Criar um relatório

*   No Visual Studio
*   No Visual Studio Code
*   No Designer de Relatórios do Usuário Final

### O que vem a seguir

*   Personalizar componentes da Web
*   Localizar a interface do usuário do relatório e do aplicativo
*   Incorporar extensões alimentadas por IA para relatórios DevExpress
*   Proteger o aplicativo
*   Atender aos padrões de acessibilidade
*   Criar documentação do usuário final
*   Explorar pacotes de desenvolvimento de interface do usuário da Web que incluem relatórios
*   Solução de problemas

## Get Started with DevExpress Reporting

Se você precisar adicionar a funcionalidade DevExpress Reporting a um aplicativo, geralmente precisará concluir as seguintes tarefas básicas:

*   **Projetar um relatório no Visual Studio**
*   **Integrar um relatório à interface do usuário do seu aplicativo**
    *   Plataformas de desktop
    *   Plataformas da Web
*   **Adicionar um relatório ao seu aplicativo e imprimir/exportar este relatório sem exibi-lo na interface do usuário**

As seções a seguir guiam você para os documentos que o ajudarão a começar com essas tarefas.

### Projetar um relatório no Visual Studio

Você pode adicionar um Relatório DevExpress ao aplicativo da mesma forma que adiciona Formulários, Páginas, Janelas ou Controles de Usuário. Você adiciona um novo item ao seu projeto e ele aparece como uma entrada na árvore do seu projeto. Abra esta nova entrada para acessar um Report Designer integrado.

O designer permite que você crie relatórios independentes de plataforma, visualize-os e exporte-os para PDF, XLSX e outros formatos.

O designer é compatível com projetos que visam o .NET 8+ ou o .NET Framework.

### Integrar um relatório à interface de usuário de seu aplicativo

O DevExpress Reporting vem com os componentes Visualizador de Documentos e Designer de Relatórios do Usuário Final para as seguintes plataformas da Microsoft:

*   WinForms
*   WPF
*   ASP.NET Web Forms
*   ASP.NET MVC
*   ASP.NET Core
*   Blazor Server – inclui um visualizador nativo e um visualizador e designer baseados em JavaScript.

O componente Visualizador de Documentos exibe uma visualização interativa do documento e permite que você e seus usuários finais imprimam e exportem relatórios.

O End-User Report Designer é uma ferramenta de relatório totalmente funcional que permite que você e seus usuários finais criem, visualizem, imprimam, exportem e salvem relatórios.

Consulte os tópicos abaixo para obter mais informações:

**Plataformas de desktop**

*   Relatórios para WinForms
*   Relatórios WPF

**Plataformas Web**

*   Relatórios do ASP.NET Web Forms
*   Relatórios do ASP.NET MVC
*   Relatórios para ASP.NET Core
*   Relatórios do Blazor

Você também pode integrar os componentes do Visualizador de Documentos e do Designer de Relatórios do Usuário Final a aplicativos JavaScript baseados nas estruturas Angular, Vue, React e Knockout.

*   Relatórios para Angular
*   Relatórios para Vue
*   Relatórios para React
*   Relatórios para aplicativos baseados em Knockout

### Adicionar um relatório ao seu aplicativo e imprimir/exportar este relatório sem exibi-lo na interface do usuário

Consulte o seguinte tópico para obter instruções: Imprimir e exportar relatórios sem visualização.

## Criar diferentes tipos de relatórios (passo a passo)

Esta seção contém tutoriais que explicam como criar diferentes relatórios.

### Relatórios básicos

*   Relatórios de tabela
*   Relatórios Verticais
*   Cartas

### Relatórios com dados hierárquicos

*   Relatórios mestre-detalhe com bandas de relatório de detalhes
*   Relatórios mestre-detalhe com sub-relatórios
*   Relatórios Hierárquicos

### Relatórios de fatura

*   Faturas
*   Faturas de Modelos
*   Contas QR suíças

### Relatórios de Tabela de Referência Cruzada

*   Relatórios de tabela de referência cruzada
*   Balanços

### Relatórios de várias colunas

*   Etiquetas e Crachás
*   Relatórios lado a lado
*   Relatórios de várias colunas

### Relatórios Interativos

*   Formulários eletrônicos interativos
*   Votações interativas

### Relatórios com gráficos

### Herança de Relatório

### Recursos de layout

*   Relatórios com conteúdo de banda cruzada e um espaço vazio preenchido
*   Relatórios com conteúdo PDF
*   Relatórios com assinatura visual em PDF

## Guia detalhado para relatórios do DevExpress

Os tópicos desta seção contêm informações detalhadas sobre como criar, armazenar e publicar relatórios do DevExpress.

*   Introdução aos relatórios com faixas
*   Vincular relatórios a dados
*   Usar controles de relatório
*   Usar parâmetros de relatório
*   Modelar dados de relatório
*   Organizar o conteúdo do relatório dinâmico
*   Personalizar a aparência
*   Adicionar navegação
*   Fornecer interatividade
*   Adicionar informações extras
*   Mesclar relatórios
*   Usar expressões
*   Armazenar e distribuir relatórios
*   Globalizar e localizar relatórios
*   Converter grade de dados do DevExpress em relatório
*   Converter relatórios de terceiros em relatórios do DevExpress
*   API de relatórios

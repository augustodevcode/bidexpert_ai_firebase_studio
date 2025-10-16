// src/components/BidReportBuilder/tour.js
/**
 * @fileoverview Define os passos para o tour guiado do Construtor de Relatórios.
 * Esta configuração é usada por uma biblioteca como react-joyride para guiar
 * os usuários através da interface, destacando as principais funcionalidades.
 */

const tourSteps = [
    {
        target: '[data-ai-id="report-toolbar"]',
        content: 'Esta é a barra de ferramentas. Use-a para salvar, carregar ou exportar seu relatório, e para adicionar novos elementos.',
        placement: 'bottom',
    },
    {
        target: '[data-ai-id="report-builder-sidebar"]',
        content: 'Aqui você encontra todas as fontes de dados e mídias disponíveis. Arraste as variáveis de dados para a área de design.',
        placement: 'right',
    },
    {
        target: '[data-ai-id="report-design-surface"]',
        content: 'Esta é a sua área de design. Arraste e solte elementos aqui para construir seu relatório visualmente.',
        placement: 'center',
    },
    {
        target: '[data-ai-id="report-builder-properties-panel"]',
        content: 'Quando um elemento é selecionado na área de design, suas propriedades aparecerão aqui para que você possa customizá-lo.',
        placement: 'left',
    },
];

export default tourSteps;

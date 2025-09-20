// src/components/BidReportBuilder/index.jsx
'use client';

import React from 'react';
import Toolbar from './components/BarraFerramentas';
import AreaDesenho from './components/AreaDesenho';
import PainelPropriedades from './components/PainelPropriedades';
import PainelVisualizacao from './components/PainelVisualizacao';
import PainelVariaveis from './components/PainelVariaveis';
import BibliotecaMidia from './components/BibliotecaMidia';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Componente principal do Construtor de Relatórios.
 * Orquestra a interação entre a barra de ferramentas, a área de design,
 * o painel de propriedades e a visualização.
 */
const BidReportBuilder = () => {
    const [definicaoRelatorio, setDefinicaoRelatorio] = React.useState({ elements: [] });
    const [elementoSelecionado, setElementoSelecionado] = React.useState(null);
    const { toast } = useToast();

    const adicionarElemento = (tipoElemento, x, y, conteudo) => {
        const novoElemento = {
            id: `el-${uuidv4()}`,
            type: tipoElemento,
            content: conteudo || `Novo ${tipoElemento}`,
            x: x || 50,
            y: y || 50,
            width: 150,
            height: 40
        };
        // @ts-ignore
        setDefinicaoRelatorio(prev => ({ ...prev, elements: [...prev.elements, novoElemento]}));
        setElementoSelecionado(novoElemento);
    };
    
    const alterarElemento = (idElemento, novasProps) => {
        let elementoAtualizado;
        const novosElementos = definicaoRelatorio.elements.map(el => {
            // @ts-ignore
            if (el.id === idElemento) {
                elementoAtualizado = { ...el, ...novasProps };
                return elementoAtualizado;
            }
            return el;
        });

        // @ts-ignore
        setDefinicaoRelatorio({ ...definicaoRelatorio, elements: novosElementos });
        
        if (elementoSelecionado && elementoSelecionado.id === idElemento) {
            setElementoSelecionado(elementoAtualizado);
        }
    };

    const selecionarImagem = (imagem) => {
        const novoElementoImagem = {
            id: `el-${uuidv4()}`,
            type: 'Image',
            content: imagem.alt,
            x: 200,
            y: 200,
            width: 200,
            height: 150,
            imageUrl: imagem.src,
        };
         // @ts-ignore
        setDefinicaoRelatorio(prev => ({ ...prev, elements: [...prev.elements, novoElementoImagem]}));
        setElementoSelecionado(novoElementoImagem);
         toast({
            title: "Imagem Adicionada!",
            description: `A imagem "${imagem.alt}" foi adicionada ao seu relatório.`,
        });
    };

    const salvarRelatorio = () => {
        try {
            localStorage.setItem('bidReportBuilder_save', JSON.stringify(definicaoRelatorio));
            toast({
                title: "Relatório Salvo!",
                description: "Seu layout foi salvo no armazenamento local do seu navegador.",
            });
        } catch (error) {
            toast({
                title: "Erro ao Salvar",
                description: "Não foi possível salvar o relatório.",
                variant: "destructive",
            });
        }
    };

    const carregarRelatorio = () => {
        try {
            const relatorioSalvo = localStorage.getItem('bidReportBuilder_save');
            if (relatorioSalvo) {
                const relatorioParseado = JSON.parse(relatorioSalvo);
                setDefinicaoRelatorio(relatorioParseado);
                setElementoSelecionado(null);
                toast({
                    title: "Relatório Carregado!",
                    description: "Seu layout salvo foi carregado com sucesso.",
                });
            } else {
                 toast({
                    title: "Nenhum Relatório Salvo",
                    description: "Não foi encontrado um relatório salvo no seu navegador.",
                    variant: "default",
                });
            }
        } catch (error) {
             toast({
                title: "Erro ao Carregar",
                description: "O formato do relatório salvo é inválido.",
                variant: "destructive",
            });
        }
    };

    const exportarRelatorio = () => {
        toast({
            title: "Funcionalidade em Desenvolvimento",
            description: "A exportação para PDF será implementada em breve.",
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div data-ai-id="report-builder-container" className="flex flex-col h-[80vh] bg-muted/30 rounded-lg border">
                <div className="flex flex-grow overflow-hidden">
                    <Toolbar onSave={salvarRelatorio} onLoad={carregarRelatorio} onExport={exportarRelatorio} />
                    <main className="flex-grow flex flex-col border-l border-r" data-ai-id="report-builder-main-panel">
                        <div className="flex-grow relative">
                            <AreaDesenho 
                                elements={definicaoRelatorio.elements} 
                                onAddElement={adicionarElemento}
                                onSelectElement={setElementoSelecionado}
                                selectedElementId={elementoSelecionado?.id}
                            />
                        </div>
                        <div className="h-1/3 border-t bg-background" data-ai-id="report-builder-preview-panel">
                           <PainelVisualizacao reportDefinition={definicaoRelatorio} />
                        </div>
                    </main>
                    <aside className="w-80 flex-shrink-0 bg-background flex flex-col" data-ai-id="report-builder-sidebar">
                         <Tabs defaultValue="properties" className="w-full h-full flex flex-col">
                            <TabsList className="flex-shrink-0 mx-2 mt-2">
                                <TabsTrigger value="properties" className="flex-1">Propriedades</TabsTrigger>
                                <TabsTrigger value="variables" className="flex-1">Variáveis</TabsTrigger>
                                <TabsTrigger value="media" className="flex-1">Mídia</TabsTrigger>
                            </TabsList>
                            <TabsContent value="properties" className="flex-grow overflow-y-auto" data-ai-id="report-builder-properties-tab">
                                <PainelPropriedades 
                                    selectedElement={elementoSelecionado} 
                                    onElementChange={alterarElemento}
                                />
                            </TabsContent>
                            <TabsContent value="variables" className="flex-grow overflow-y-auto" data-ai-id="report-builder-variables-tab">
                                <PainelVariaveis />
                            </TabsContent>
                             <TabsContent value="media" className="flex-grow overflow-y-auto" data-ai-id="report-builder-media-tab">
                                <BibliotecaMidia onSelectImage={selecionarImagem} />
                            </TabsContent>
                        </Tabs>
                    </aside>
                </div>
            </div>
        </DndProvider>
    );
};

export default BidReportBuilder;

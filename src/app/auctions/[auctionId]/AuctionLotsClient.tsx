"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Auction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LotCard from '@/components/lot-card';
import LotListItem from '@/components/lot-list-item';
import {
  ChevronRight, FileText, Heart, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuctionLotsClientProps {
    auction: Auction;
}

const estados = [
    'Alagoas', 'Bahia', 'Ceará', 'Goiás', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraná', 'Pernambuco', 'Rio de Janeiro',
    'Santa Catarina', 'São Paulo', 'Tocantins'
];

export default function AuctionLotsClient({ auction }: AuctionLotsClientProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
        <div className="space-y-8">
            {/* Breadcrumbs e Cabeçalho do Leilão */}
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-grow">
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                                <Link href="/" className="hover:text-primary">Home</Link>
                                <ChevronRight className="h-4 w-4 mx-1" />
                                <span>Leilão {auction.id}</span>
                            </div>
                            <div className="mb-3 space-y-0.5">
                                <p className="text-xs text-muted-foreground">
                                    Data: {format(new Date(auction.auctionDate), "dd/MM/yyyy HH:mm", { locale: ptBR })} | Lotes: {auction.totalLots} | Status: <span className="font-semibold text-primary">{auction.status}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Leiloeiro: {auction.auctioneer} | Categoria: {auction.category}
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-center md:items-end gap-3">
                            {auction.auctioneerLogoUrl && (
                                <Image src={auction.auctioneerLogoUrl} alt="Logo Leiloeiro" width={120} height={40} className="object-contain" data-ai-hint="logo leiloeiro" />
                            )}
                            <Button variant="default" size="sm">
                                <FileText className="h-4 w-4 mr-2" /> Ver Documentos
                            </Button>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <Button variant="ghost" size="sm" className="p-0 h-auto text-muted-foreground hover:text-primary">
                                    <Heart className="h-4 w-4 mr-1" /> Favoritar Leilão
                                </Button>
                                <span>#Leilão: {auction.id}</span>
                                <div className="flex items-center">
                                    <Eye className="h-4 w-4 mr-1" />
                                    <span>Visitas: {auction.visits?.toLocaleString('pt-BR') || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filtros de Estado */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Selecione um estado</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {estados.map(estado => (
                        <Button key={estado} variant="outline" size="sm">{estado}</Button>
                    ))}
                </CardContent>
            </Card>

            {/* Contagem de Lotes e Controles de Visualização */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{auction.lots.length} lote(s) encontrado(s)</h2>
                    <div className="flex items-center gap-2">
                        <span>Exibir:</span>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                        >
                            Grid
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                        >
                            Lista
                        </Button>
                    </div>
                </div>

                {auction.lots.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {auction.lots.map((lot) => (
                                <LotCard key={lot.id} lot={lot} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {auction.lots.map((lot) => (
                                <LotListItem key={lot.id} lot={lot} />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-10 bg-secondary/30 rounded-lg">
                        <p className="text-muted-foreground">Nenhum lote encontrado para este leilão.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// src/components/BidReportBuilder/components/MediaLibrary.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface SampleImage {
    id: number;
    src: string;
    alt: string;
}

const sampleImages: SampleImage[] = [
    { id: 1, src: 'https://placehold.co/300x200.png?text=Imovel', alt: 'Imagem de Imóvel' },
    { id: 2, src: 'https://placehold.co/300x200.png?text=Veiculo', alt: 'Imagem de Veículo' },
    { id: 3, src: 'https://placehold.co/300x200.png?text=Logo+A', alt: 'Logo Comitente A' },
    { id: 4, src: 'https://placehold.co/300x200.png?text=Logo+B', alt: 'Logo Leiloeiro B' },
    { id: 5, src: 'https://placehold.co/300x200.png?text=Industrial', alt: 'Item Industrial' },
    { id: 6, src: 'https://placehold.co/300x200.png?text=Arte', alt: 'Arte Abstrata' },
];

interface MediaLibraryProps {
    onSelectImage: (image: SampleImage) => void;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelectImage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [images, setImages] = useState(sampleImages);

     useEffect(() => {
        if (!searchTerm) {
            setImages(sampleImages);
            return;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = sampleImages.filter(image => 
            image.alt.toLowerCase().includes(lowercasedFilter)
        );
        setImages(filtered);
    }, [searchTerm]);

    return (
        <div className="p-4 h-full flex flex-col" data-ai-id="report-media-library-panel">
            <h3 className="text-md font-semibold border-b pb-2 mb-2">Biblioteca de Mídia</h3>
             <Input 
                placeholder="Buscar imagem..." 
                className="mb-3 h-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-ai-id="media-library-search-input"
            />
            <ScrollArea className="flex-grow">
                 <div className="grid grid-cols-2 gap-2">
                    {images.map(image => (
                         <div 
                            key={image.id} 
                            className="relative aspect-video rounded-md overflow-hidden cursor-pointer group"
                            onClick={() => onSelectImage(image)}
                            data-ai-id={`media-library-item-${image.id}`}
                         >
                            <Image src={image.src} alt={image.alt} fill className="object-cover group-hover:scale-105 transition-transform"/>
                             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-end p-1">
                                <p className="text-white text-[10px] truncate">{image.alt}</p>
                            </div>
                        </div>
                    ))}
                 </div>
            </ScrollArea>
        </div>
    );
};

export default MediaLibrary;

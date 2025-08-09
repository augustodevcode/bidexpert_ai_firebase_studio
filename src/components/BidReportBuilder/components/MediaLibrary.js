import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

const MediaLibrary = ({ onSelectImage }) => {
  const images = [
    { id: '1', name: 'Logo Empresa', url: 'https://placehold.co/100x100' },
    { id: '2', name: 'Foto Produto', url: 'https://placehold.co/100x100' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mídia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {images.map(image => (
            <div key={image.id} className="cursor-pointer" onClick={() => onSelectImage(image)}>
              <Image src={image.url} alt={image.name} width={100} height={100} className="rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaLibrary;


'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface FilterLinkCardProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  dataAiHint: string;
  link: string;
  bgColorClass?: string;
}

export default function FilterLinkCard({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  dataAiHint,
  link,
  bgColorClass = 'bg-secondary/30 dark:bg-secondary/20',
}: FilterLinkCardProps) {
  return (
    <Link href={link} className="block group">
      <Card className={`overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full ${bgColorClass}`}>
        <CardContent className="p-0">
          <div className="relative h-32 w-full">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              data-ai-hint={dataAiHint}
            />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">{subtitle}</p>
            <div className="text-xs text-primary font-medium flex items-center group-hover:underline">
              Ver Opções <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

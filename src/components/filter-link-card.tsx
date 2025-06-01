
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
    <Link href={link} className="block group h-full">
      <Card className={`overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full ${bgColorClass}`}>
        <CardContent className="p-4 md:p-5 flex flex-row items-center gap-4 h-full">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-contain rounded-md"
              data-ai-hint={dataAiHint}
            />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-md lg:text-lg font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mb-1.5">{subtitle}</p>
            <div className="text-xs text-primary font-medium flex items-center group-hover:underline">
              Ver Opções <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

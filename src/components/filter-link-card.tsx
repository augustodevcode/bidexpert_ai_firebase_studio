
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
    <Link href={link} className="link-filter-card">
      <Card className={`card-filter ${bgColorClass}`}>
        <CardContent className="card-content-filter">
          <div className="container-image-filter">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="img-filter-card"
              data-ai-hint={dataAiHint}
            />
          </div>
          <div className="container-text-filter">
            <h3 className="title-filter-card">
              {title}
            </h3>
            <p className="subtitle-filter-card">{subtitle}</p>
            <div className="link-view-options-filter">
              Ver Opções <ArrowRight className="icon-arrow-filter" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

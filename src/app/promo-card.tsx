

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface PromoCardProps {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  dataAiHint: string;
  link: string;
  bgColorClass?: string; // Ex: 'bg-blue-100'
}

export default function PromoCard({
  title,
  description,
  imageUrl,
  imageAlt,
  dataAiHint,
  link,
  bgColorClass = 'bg-secondary/30',
}: PromoCardProps) {
  return (
    <Link href={link} className="link-promo-card" data-ai-id={`promo-card-${dataAiHint.replace(/\s/g, '-')}`}>
      <Card className={`card-promo ${bgColorClass}`}>
        <CardContent className="card-content-promo">
          <div className="container-text-promo">
            <h3 className="title-promo-card">
              {title}
            </h3>
            <p className="description-promo-card">{description}</p>
            <div className="link-ver-mais-promo">
              Ver Mais <ArrowRight className="icon-arrow-promo" />
            </div>
          </div>
          <div className="container-image-promo">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="img-promo-card"
              data-ai-hint={dataAiHint}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

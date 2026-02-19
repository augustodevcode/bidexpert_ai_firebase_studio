// src/components/promo-card.tsx
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
      <Card className={cn("card-promo", bgColorClass)}>
        <CardContent className="content-card-promo">
          <div className="wrapper-promo-text">
            <h3 className="header-promo-title">
              {title}
            </h3>
            <p className="text-promo-description">{description}</p>
            <div className="wrapper-promo-action-link">
              Ver Mais <ArrowRight className="icon-promo-arrow" />
            </div>
          </div>
          <div className="wrapper-promo-image">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="img-promo-graphic"
              data-ai-hint={dataAiHint}
              sizes="(max-width: 768px) 33vw, 150px"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

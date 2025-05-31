
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
    <Link href={link} className="block group">
      <Card className={`overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full ${bgColorClass}`}>
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6 h-full">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-semibold text-foreground mb-1 font-headline group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <div className="text-xs text-primary font-medium flex items-center justify-center md:justify-start group-hover:underline">
              Ver Mais <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
          <div className="relative w-32 h-32 md:w-36 md:h-36 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-contain"
              data-ai-hint={dataAiHint}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

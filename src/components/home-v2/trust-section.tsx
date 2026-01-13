/**
 * @file TrustSection Component
 * @description Trust and confidence section with benefits and
 * educational content links for each segment.
 */
'use client';

import Link from 'next/link';
import { 
  FileCheck, Shield, CreditCard, MapPin, Scale, FileSearch, 
  Users, BadgeCheck, Wrench, Clock, Truck, CheckCircle, 
  Package, Recycle, ChevronRight, Play, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TrustPoint, SegmentType } from './types';

const TRUST_ICONS: Record<string, React.ElementType> = {
  FileCheck, Shield, CreditCard, MapPin, Scale, FileSearch,
  Users, BadgeCheck, Wrench, Clock, Truck, CheckCircle,
  Package, Recycle,
};

interface TrustSectionProps {
  segmentId: SegmentType;
  segmentName: string;
  trustPoints: TrustPoint[];
  title?: string;
}

export default function TrustSection({
  segmentId,
  segmentName,
  trustPoints,
  title,
}: TrustSectionProps) {
  const sectionTitle = title || `Por que arrematar ${segmentName} com o BidExpert?`;

  return (
    <section className="py-10 md:py-14" data-testid="trust-section">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">{sectionTitle}</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Transparência, segurança e suporte dedicado em todas as etapas do processo
          </p>
        </div>

        {/* Trust points grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {trustPoints.map((point, index) => {
            const IconComponent = TRUST_ICONS[point.icon] || Shield;
            return (
              <Card key={index} className="border-0 shadow-none bg-muted/30">
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl mx-auto mb-4",
                    "bg-primary/10 text-primary",
                    "flex items-center justify-center"
                  )}>
                    <IconComponent className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{point.title}</h3>
                  <p className="text-sm text-muted-foreground">{point.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Educational content */}
        <div className="bg-card rounded-xl border p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Aprenda a comprar em leilões de {segmentName.toLowerCase()}
              </h3>
              <p className="text-muted-foreground">
                Guias completos, tutoriais em vídeo e respostas para suas dúvidas
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href={`/faq#${segmentId}`}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver FAQ
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/faq#como-comprar-${segmentId}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Como comprar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

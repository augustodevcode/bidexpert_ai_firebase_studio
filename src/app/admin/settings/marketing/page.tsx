/**
 * @fileoverview Página de módulo Marketing com acesso aos submódulos de publicidade.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, MonitorPlay } from 'lucide-react';

interface MarketingModuleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  dataAiId: string;
}

const MarketingModuleCard = ({ title, description, icon: Icon, link, dataAiId }: MarketingModuleCardProps) => (
  <Link href={link} className="block group" data-ai-id={dataAiId}>
    <Card className="h-full shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all" data-ai-id={`${dataAiId}-card`}>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <div className="bg-primary/10 p-3 rounded-full" data-ai-id={`${dataAiId}-icon`}>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div data-ai-id={`${dataAiId}-content`}>
          <CardTitle className="text-lg group-hover:text-primary transition-colors" data-ai-id={`${dataAiId}-title`}>{title}</CardTitle>
          <CardDescription className="text-xs" data-ai-id={`${dataAiId}-description`}>{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  </Link>
);

export default function MarketingSettingsPage() {
  const modules: MarketingModuleCardProps[] = [
    {
      title: 'Publicidade do Site',
      description: 'Controle a seção Super Oportunidades e a rolagem do carousel.',
      icon: MonitorPlay,
      link: '/admin/settings/marketing/publicidade-site',
      dataAiId: 'marketing-module-publicidade-site',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-ai-id="marketing-settings-page">
      <Card className="shadow-lg" data-ai-id="marketing-settings-header">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center" data-ai-id="marketing-settings-title">
            <Megaphone className="h-7 w-7 mr-3 text-primary" />
            Marketing
          </CardTitle>
          <CardDescription data-ai-id="marketing-settings-description">
            Configure módulos de publicidade e exibição de conteúdo no site.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-ai-id="marketing-settings-modules">
        {modules.map(module => (
          <MarketingModuleCard key={module.dataAiId} {...module} />
        ))}
      </div>
    </div>
  );
}

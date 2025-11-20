// src/app/admin/settings/page.tsx
'use client';



import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Database, Palette, Wrench, MapPin as MapIcon, Zap, ArrowUpDown, CreditCard, Bell, Bot, Zap as LightningIcon } from 'lucide-react';
import Link from 'next/link';

interface SettingCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  dataAiId: string;
}

const SettingCard = ({ title, description, icon: Icon, link, dataAiId }: SettingCardProps) => (
  <Link href={link} className="block group">
    <Card className="h-full shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all" data-ai-id={dataAiId}>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <div className="bg-primary/10 p-3 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  </Link>
);


function AdminSettingsPageContent() {
    const settingSections: SettingCardProps[] = [
        { title: "Identidade Visual e Temas", description: "Gerencie o título, logo e o tema de cores.", icon: Palette, link: "/admin/settings/themes", dataAiId: "settings-card-themes" },
        { title: "Geral", description: "Gerencie modos de formulário e máscaras de ID.", icon: Wrench, link: "/admin/settings/general", dataAiId: "settings-card-general" },
        { title: "Configurações de Mapa", description: "Escolha o provedor de mapas e chaves de API.", icon: MapIcon, link: "/admin/settings/maps", dataAiId: "settings-card-maps" },
        { title: "Regras de Lances", description: "Defina lances instantâneos e intervalos.", icon: Zap, link: "/admin/settings/bidding", dataAiId: "settings-card-bidding" },
        { title: "Incremento Variável", description: "Configure a tabela de incrementos por valor.", icon: ArrowUpDown, link: "/admin/settings/increments", dataAiId: "settings-card-increments" },
        { title: "Gateway de Pagamento", description: "Defina o provedor e comissões.", icon: CreditCard, link: "/admin/settings/payment", dataAiId: "settings-card-payment" },
        { title: "Notificações", description: "Controle os e-mails de notificação.", icon: Bell, link: "/admin/settings/notifications", dataAiId: "settings-card-notifications" },
        { title: "Gatilhos Mentais & Badges", description: "Ajuste os gatilhos de marketing e visibilidade.", icon: Bot, link: "/admin/settings/triggers", dataAiId: "settings-card-triggers" },
        { title: "Tempo Real & Blockchain", description: "Habilite soft-close, blockchain e monetização de advogados.", icon: LightningIcon, link: "/admin/settings/realtime", dataAiId: "settings-card-realtime" },
        { title: "Dados de Exemplo", description: "Popule o banco de dados para demonstração.", icon: Database, link: "/admin/settings/seeding", dataAiId: "settings-card-seeding" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline flex items-center">
                  <SettingsIcon className="h-7 w-7 mr-3 text-primary" />
                  Configurações da Plataforma
                </CardTitle>
                <CardDescription>
                  Gerencie as configurações globais, aparência e regras de negócio do BidExpert.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingSections.map(section => (
                    <SettingCard key={section.dataAiId} {...section} />
                ))}
            </div>
        </div>
    );
}

export default function AdminSettingsPageWrapper() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AdminSettingsPageContent />
        </Suspense>
    );
}

/**
 * @file Segment Configuration
 * @description Configuration data for all auction segments including
 * categories, menu items, trust points, and visual settings.
 */

import type { SegmentConfig, SegmentType } from './types';

export const SEGMENT_CONFIGS: Record<SegmentType, SegmentConfig> = {
  veiculos: {
    id: 'veiculos',
    name: 'Veículos',
    title: 'Leilões de Veículos',
    subtitle: 'Carros, motos, caminhões e mais com descontos exclusivos',
    heroTitle: 'Leilões de carros, motos e pesados com descontos de até 50% abaixo da FIPE',
    heroSubtitle: 'Encontre o veículo ideal em leilões seguros e transparentes. Laudos completos e financiamento facilitado.',
    heroImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80',
    icon: 'Car',
    color: 'hsl(25 95% 53%)',
    categories: [
      { id: 'carros', name: 'Carros & Motos', slug: 'carros-motos', icon: 'Car', count: 1067, description: 'Sedans, SUVs, hatchbacks e motocicletas' },
      { id: 'caminhoes', name: 'Caminhões & Ônibus', slug: 'caminhoes-onibus', icon: 'Truck', count: 342, description: 'Veículos pesados e de transporte' },
      { id: 'financiaveis', name: 'Financiáveis', slug: 'financiaveis', icon: 'CreditCard', count: 856, description: 'Veículos elegíveis para financiamento' },
      { id: 'sinistrados', name: 'Sinistrados', slug: 'sinistrados', icon: 'AlertTriangle', count: 234, description: 'Veículos de seguradoras' },
    ],
    menuItems: [
      { label: 'Leilões de Carros', href: '/veiculos?category=carros', description: 'Todos os carros disponíveis' },
      { label: 'Motos', href: '/veiculos?category=motos', description: 'Motocicletas e scooters' },
      { label: 'Pesados', href: '/veiculos?category=pesados', description: 'Caminhões, ônibus e tratores' },
      { label: 'Financiáveis', href: '/veiculos?financeable=true', badge: 'Popular', description: 'Veículos com financiamento' },
      { label: 'Abaixo da FIPE', href: '/veiculos?belowFipe=true', description: 'Oportunidades imperdíveis' },
    ],
    trustPoints: [
      { icon: 'FileCheck', title: 'Laudos Completos', description: 'Vistoria técnica detalhada em todos os veículos' },
      { icon: 'Shield', title: 'Garantia de Procedência', description: 'Histórico verificado e documentação regular' },
      { icon: 'CreditCard', title: 'Financiamento Facilitado', description: 'Parceiros bancários com taxas especiais' },
      { icon: 'MapPin', title: 'Entrega Nacional', description: 'Logística para todo o Brasil' },
    ],
  },
  imoveis: {
    id: 'imoveis',
    name: 'Imóveis',
    title: 'Leilões de Imóveis',
    subtitle: 'Residenciais, comerciais e terrenos com transparência jurídica',
    heroTitle: 'Leilões de imóveis judiciais e corporativos com transparência jurídica completa',
    heroSubtitle: 'Adquira imóveis com descontos significativos. Análise jurídica e suporte em todo o processo.',
    heroImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80',
    icon: 'Home',
    color: 'hsl(142 76% 36%)',
    categories: [
      { id: 'residenciais', name: 'Residenciais', slug: 'residenciais', icon: 'Home', count: 543, description: 'Casas e apartamentos' },
      { id: 'comerciais', name: 'Comerciais', slug: 'comerciais', icon: 'Building2', count: 187, description: 'Salas, lojas e galpões' },
      { id: 'terrenos', name: 'Terrenos', slug: 'terrenos', icon: 'Map', count: 234, description: 'Lotes urbanos e rurais' },
      { id: 'judiciais', name: 'Judiciais', slug: 'judiciais', icon: 'Gavel', count: 412, description: 'Leilões judiciais' },
    ],
    menuItems: [
      { label: 'Residenciais', href: '/imoveis?category=residenciais', description: 'Casas e apartamentos' },
      { label: 'Comerciais', href: '/imoveis?category=comerciais', description: 'Imóveis comerciais' },
      { label: 'Terrenos', href: '/imoveis?category=terrenos', description: 'Lotes e terrenos' },
      { label: 'Judiciais', href: '/imoveis?type=judicial', badge: 'Destaque', description: 'Leilões judiciais' },
      { label: 'Alienação Fiduciária', href: '/imoveis?type=alienacao', description: 'Imóveis de bancos' },
    ],
    trustPoints: [
      { icon: 'Scale', title: 'Transparência Jurídica', description: 'Análise completa da situação legal do imóvel' },
      { icon: 'FileSearch', title: 'Due Diligence', description: 'Verificação de ônus e pendências' },
      { icon: 'Users', title: 'Assessoria Especializada', description: 'Advogados e corretores parceiros' },
      { icon: 'BadgeCheck', title: 'Certidões Atualizadas', description: 'Documentação sempre em dia' },
    ],
  },
  maquinas: {
    id: 'maquinas',
    name: 'Máquinas & Equipamentos',
    title: 'Leilões de Máquinas',
    subtitle: 'Equipamentos agrícolas, industriais e de construção',
    heroTitle: 'Máquinas e equipamentos industriais com laudos técnicos e procedência garantida',
    heroSubtitle: 'Encontre tratores, escavadeiras, empilhadeiras e muito mais. Equipamentos revisados e prontos para uso.',
    heroImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80',
    icon: 'Cog',
    color: 'hsl(197 37% 24%)',
    categories: [
      { id: 'agricolas', name: 'Agrícolas', slug: 'agricolas', icon: 'Tractor', count: 287, description: 'Tratores e implementos' },
      { id: 'industriais', name: 'Industriais', slug: 'industriais', icon: 'Factory', count: 156, description: 'Máquinas de produção' },
      { id: 'construcao', name: 'Construção', slug: 'construcao', icon: 'HardHat', count: 198, description: 'Escavadeiras e retroescavadeiras' },
      { id: 'logistica', name: 'Logística', slug: 'logistica', icon: 'Package', count: 124, description: 'Empilhadeiras e paleteiras' },
    ],
    menuItems: [
      { label: 'Agrícolas', href: '/maquinas?category=agricolas', description: 'Tratores e colheitadeiras' },
      { label: 'Industriais', href: '/maquinas?category=industriais', description: 'Equipamentos de fábrica' },
      { label: 'Construção', href: '/maquinas?category=construcao', description: 'Máquinas pesadas' },
      { label: 'Logística', href: '/maquinas?category=logistica', badge: 'Novo', description: 'Empilhadeiras e similares' },
    ],
    trustPoints: [
      { icon: 'Wrench', title: 'Curadoria Técnica', description: 'Laudos de manutenção e condição' },
      { icon: 'Clock', title: 'Horímetro Verificado', description: 'Horas de uso comprovadas' },
      { icon: 'Shield', title: 'Procedência Garantida', description: 'Histórico completo do equipamento' },
      { icon: 'Truck', title: 'Logística Especializada', description: 'Transporte de carga pesada' },
    ],
  },
  tecnologia: {
    id: 'tecnologia',
    name: 'Tecnologia',
    title: 'Leilões de Tecnologia',
    subtitle: 'Eletrônicos, informática e equipamentos corporativos',
    heroTitle: 'Equipamentos de TI e eletrônicos corporativos com garantia de procedência',
    heroSubtitle: 'Notebooks, servidores, smartphones e equipamentos de escritório. Renovação de ativos empresariais.',
    heroImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80',
    icon: 'Laptop',
    color: 'hsl(221 83% 53%)',
    categories: [
      { id: 'informatica', name: 'Informática', slug: 'informatica', icon: 'Monitor', count: 456, description: 'Computadores e notebooks' },
      { id: 'eletronicos', name: 'Eletrônicos', slug: 'eletronicos', icon: 'Tv', count: 234, description: 'TVs, áudio e vídeo' },
      { id: 'telefonia', name: 'Telefonia', slug: 'telefonia', icon: 'Smartphone', count: 321, description: 'Smartphones e tablets' },
      { id: 'corporativo', name: 'Corporativo', slug: 'corporativo', icon: 'Server', count: 156, description: 'Servidores e infraestrutura' },
    ],
    menuItems: [
      { label: 'Informática', href: '/tecnologia?category=informatica', description: 'PCs, notebooks e acessórios' },
      { label: 'Eletrônicos', href: '/tecnologia?category=eletronicos', description: 'TVs e equipamentos de áudio' },
      { label: 'Telefonia', href: '/tecnologia?category=telefonia', badge: 'Popular', description: 'Smartphones e tablets' },
      { label: 'Corporativo', href: '/tecnologia?category=corporativo', description: 'Infraestrutura de TI' },
    ],
    trustPoints: [
      { icon: 'CheckCircle', title: 'Testado e Aprovado', description: 'Equipamentos funcionais verificados' },
      { icon: 'Package', title: 'Embalagem Original', description: 'Quando disponível, com acessórios' },
      { icon: 'Shield', title: 'Garantia Estendida', description: 'Opções de garantia adicional' },
      { icon: 'Recycle', title: 'Sustentabilidade', description: 'Renovação responsável de ativos' },
    ],
  },
};

export const SEGMENT_ORDER: SegmentType[] = ['veiculos', 'imoveis', 'maquinas', 'tecnologia'];

export function getSegmentConfig(segment: SegmentType): SegmentConfig {
  return SEGMENT_CONFIGS[segment];
}

export function getAllSegments(): SegmentConfig[] {
  return SEGMENT_ORDER.map(id => SEGMENT_CONFIGS[id]);
}

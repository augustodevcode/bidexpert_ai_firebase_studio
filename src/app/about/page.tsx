// src/app/about/page.tsx
/**
 * @fileoverview Página "Sobre Nós" da plataforma BidExpert.
 * Este componente estático renderiza informações sobre a missão, visão,
 * e valores da empresa. Serve como um cartão de visitas para apresentar
 * a identidade da marca aos usuários e parceiros.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Users, Target, Handshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-12" data-ai-id="about-page-container">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg" data-ai-id="about-page-hero-section">
        <h1 className="text-4xl font-bold mb-4 font-headline">Sobre a BidExpert</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Somos apaixonados por conectar compradores e vendedores através de uma experiência de leilão transparente e confiável.
        </p>
      </section>

      <section data-ai-id="about-page-mission-section">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold font-headline flex items-center">
              <Target className="h-6 w-6 mr-2 text-primary" /> Nossa Missão
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Nossa missão é fornecer uma plataforma inovadora e amigável para leilões online, capacitando indivíduos e empresas a descobrir itens únicos, alcançar valores de mercado justos e participar de disputas emocionantes. Buscamos transparência, segurança e um suporte excepcional ao cliente.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-center" data-ai-id="about-page-who-we-are-section">
        <div>
          <h2 className="text-3xl font-bold mb-4 font-headline">Quem Somos</h2>
          <p className="text-muted-foreground mb-4">
            A BidExpert foi fundada por uma equipe de entusiastas de leilões e especialistas em tecnologia que viram a oportunidade de modernizar o cenário dos leilões online. Acreditamos no poder dos leilões para descobrir tesouros escondidos e criar experiências emocionantes.
          </p>
          <p className="text-muted-foreground">
            Nossa plataforma é construída com tecnologia de ponta para garantir confiabilidade e segurança, enquanto nossas ferramentas com IA auxiliam vendedores a otimizar seus anúncios e compradores a tomar decisões informadas.
          </p>
        </div>
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
          <Image src="https://placehold.co/600x400.png" alt="Nossa Equipe" fill className="object-cover" data-ai-hint="team meeting" />
        </div>
      </section>
      
      <section data-ai-id="about-page-values-section">
        <h2 className="text-3xl font-bold text-center mb-8 font-headline">Nossos Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Users className="h-8 w-8 text-primary" />, title: 'Comunidade', description: 'Fomentar uma comunidade vibrante de compradores e vendedores.' },
            { icon: <Handshake className="h-8 w-8 text-primary" />, title: 'Integridade', description: 'Operar com transparência e justiça em todas as transações.' },
            { icon: <Target className="h-8 w-8 text-primary" />, title: 'Inovação', description: 'Melhorar continuamente nossa plataforma com novos recursos e tecnologias.' },
          ].map(value => (
            <Card key={value.title} className="text-center p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-3">{value.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground">{value.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

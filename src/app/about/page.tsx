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
    <div className="container-about-page" data-ai-id="about-page-container">
      <section className="section-hero-about" data-ai-id="about-page-hero-section">
        <h1 className="title-hero-about">Sobre a BidExpert</h1>
        <p className="subtitle-hero-about">
          Somos apaixonados por conectar compradores e vendedores através de uma experiência de leilão transparente e confiável.
        </p>
      </section>

      <section data-ai-id="about-page-mission-section">
        <Card className="card-mission">
          <CardHeader>
            <CardTitle className="card-title-mission">
              <Target className="icon-section-title" /> Nossa Missão
            </CardTitle>
          </CardHeader>
          <CardContent className="card-content-mission">
            <p>
              Nossa missão é fornecer uma plataforma inovadora e amigável para leilões online, capacitando indivíduos e empresas a descobrir itens únicos, alcançar valores de mercado justos e participar de disputas emocionantes. Buscamos transparência, segurança e um suporte excepcional ao cliente.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid-who-we-are" data-ai-id="about-page-who-we-are-section">
        <div className="container-text-who-we-are">
          <h2 className="title-section">Quem Somos</h2>
          <p className="p-who-we-are">
            A BidExpert foi fundada por uma equipe de entusiastas de leilões e especialistas em tecnologia que viram a oportunidade de modernizar o cenário dos leilões online. Acreditamos no poder dos leilões para descobrir tesouros escondidos e criar experiências emocionantes.
          </p>
          <p className="text-muted-foreground">
            Nossa plataforma é construída com tecnologia de ponta para garantir confiabilidade e segurança, enquanto nossas ferramentas com IA auxiliam vendedores a otimizar seus anúncios e compradores a tomar decisões informadas.
          </p>
        </div>
        <div className="container-image-who-we-are">
          <Image src="https://placehold.co/600x400.png" alt="Nossa Equipe" fill sizes="(max-width: 768px) 100vw, 50vw" className="img-team" data-ai-hint="team meeting" />
        </div>
      </section>
      
      <section data-ai-id="about-page-values-section">
        <h2 className="title-values">Nossos Valores</h2>
        <div className="grid-values">
          {[
            { icon: <Users className="icon-value" />, title: 'Comunidade', description: 'Fomentar uma comunidade vibrante de compradores e vendedores.' },
            { icon: <Handshake className="icon-value" />, title: 'Integridade', description: 'Operar com transparência e justiça em todas as transações.' },
            { icon: <Target className="icon-value" />, title: 'Inovação', description: 'Melhorar continuamente nossa plataforma com novos recursos e tecnologias.' },
          ].map(value => (
            <Card key={value.title} className="card-value">
              <div className="container-icon-value">{value.icon}</div>
              <h3 className="title-value-card">{value.title}</h3>
              <p className="description-value-card">{value.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

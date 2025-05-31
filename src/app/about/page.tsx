import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Users, Target, Handshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <h1 className="text-4xl font-bold mb-4 font-headline">About BidExpert</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We are passionate about connecting buyers and sellers through a seamless and trustworthy auction experience.
        </p>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold font-headline flex items-center">
              <Target className="h-6 w-6 mr-2 text-primary" /> Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Our mission is to provide an innovative and user-friendly platform for online auctions, empowering individuals and businesses to discover unique items, achieve fair market values, and engage in exciting bidding wars. We strive for transparency, security, and exceptional customer support.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-4 font-headline">Who We Are</h2>
          <p className="text-muted-foreground mb-4">
            BidExpert was founded by a team of auction enthusiasts and technology experts who saw an opportunity to modernize the online auction landscape. We believe in the power of auctions to uncover hidden gems and create thrilling experiences.
          </p>
          <p className="text-muted-foreground">
            Our platform is built with cutting-edge technology to ensure reliability and security, while our AI-powered tools help sellers optimize their listings and buyers make informed decisions.
          </p>
        </div>
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
          <Image src="https://placehold.co/600x400.png" alt="Our Team" fill className="object-cover" data-ai-hint="team meeting" />
        </div>
      </section>
      
      <section>
        <h2 className="text-3xl font-bold text-center mb-8 font-headline">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Users className="h-8 w-8 text-primary" />, title: 'Community', description: 'Fostering a vibrant community of buyers and sellers.' },
            { icon: <Handshake className="h-8 w-8 text-primary" />, title: 'Integrity', description: 'Operating with transparency and fairness in all transactions.' },
            { icon: <Target className="h-8 w-8 text-primary" />, title: 'Innovation', description: 'Continuously improving our platform with new features and technologies.' },
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

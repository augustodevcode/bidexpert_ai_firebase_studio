'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
    alert('Mensagem enviada! (Isso é um placeholder)');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <h1 className="text-4xl font-bold mb-4 font-headline">Entre em Contato</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Adoraríamos ouvir você. Se você tem uma dúvida, feedback ou precisa de suporte, sinta-se à vontade para nos contatar.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-12">
        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold font-headline">Fale Conosco</CardTitle>
              <CardDescription>Preencha o formulário abaixo e retornaremos o mais breve possível.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" placeholder="Seu nome completo" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Endereço de Email</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input id="subject" placeholder="Referente ao leilão..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea id="message" placeholder="Sua mensagem aqui..." rows={5} required />
                </div>
                <Button type="submit" className="w-full sm:w-auto">Enviar Mensagem</Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
           <h2 className="text-2xl font-semibold font-headline mb-4">Nossas Informações de Contato</h2>
           <Card className="p-6 shadow-md">
             <div className="flex items-start space-x-4">
               <Mail className="h-6 w-6 text-primary mt-1" />
               <div>
                 <h3 className="font-semibold">Email</h3>
                 <a href="mailto:suporte@bidexpert.com.br" className="text-muted-foreground hover:text-primary">suporte@bidexpert.com.br</a>
               </div>
             </div>
           </Card>
           <Card className="p-6 shadow-md">
             <div className="flex items-start space-x-4">
               <Phone className="h-6 w-6 text-primary mt-1" />
               <div>
                 <h3 className="font-semibold">Telefone</h3>
                 <p className="text-muted-foreground">+55 (11) 9 9999-9999</p>
               </div>
             </div>
           </Card>
           <Card className="p-6 shadow-md">
             <div className="flex items-start space-x-4">
               <MapPin className="h-6 w-6 text-primary mt-1" />
               <div>
                 <h3 className="font-semibold">Endereço</h3>
                 <p className="text-muted-foreground">Avenida Principal, 123, Centro, Brasília - DF, 70000-000, Brasil</p>
               </div>
             </div>
           </Card>
        </section>
      </div>
    </div>
  );
}

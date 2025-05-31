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
    alert('Message sent! (This is a placeholder)');
  };

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg">
        <h1 className="text-4xl font-bold mb-4 font-headline">Get in Touch</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We&apos;d love to hear from you. Whether you have a question, feedback, or need support, feel free to reach out.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-12">
        <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold font-headline">Contact Us</CardTitle>
              <CardDescription>Fill out the form below and we&apos;ll get back to you as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Regarding my auction..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Your message here..." rows={5} required />
                </div>
                <Button type="submit" className="w-full sm:w-auto">Send Message</Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
           <h2 className="text-2xl font-semibold font-headline mb-4">Our Contact Information</h2>
           <Card className="p-6 shadow-md">
             <div className="flex items-start space-x-4">
               <Mail className="h-6 w-6 text-primary mt-1" />
               <div>
                 <h3 className="font-semibold">Email</h3>
                 <a href="mailto:support@bidexpert.com" className="text-muted-foreground hover:text-primary">support@bidexpert.com</a>
               </div>
             </div>
           </Card>
           <Card className="p-6 shadow-md">
             <div className="flex items-start space-x-4">
               <Phone className="h-6 w-6 text-primary mt-1" />
               <div>
                 <h3 className="font-semibold">Phone</h3>
                 <p className="text-muted-foreground">+1 (555) 123-4567</p>
               </div>
             </div>
           </Card>
           <Card className="p-6 shadow-md">
             <div className="flex items-start space-x-4">
               <MapPin className="h-6 w-6 text-primary mt-1" />
               <div>
                 <h3 className="font-semibold">Address</h3>
                 <p className="text-muted-foreground">123 Auction Lane, Bidville, BX 98765, USA</p>
               </div>
             </div>
           </Card>
        </section>
      </div>
    </div>
  );
}

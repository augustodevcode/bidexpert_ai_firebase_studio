// src/app/admin/auctioneers/components/auctioneer-form.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AuctioneerFormData } from '@bidexpert/core'; // Import the type

// Define the Zod schema for the form
const auctioneerFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  registrationNumber: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url("URL inválida.").optional().or(z.literal('')),
  logoUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  description: z.string().optional(),
});

interface AuctioneerFormProps {
  initialData: AuctioneerFormData | null;
  onSubmitAction: (data: AuctioneerFormData) => Promise<any>;
}

const AuctioneerForm = React.forwardRef<HTMLFormElement, AuctioneerFormProps>(
  ({ initialData, onSubmitAction }, ref) => {
    const form = useForm<AuctioneerFormData>({
      resolver: zodResolver(auctioneerFormSchema),
      defaultValues: initialData || {
        name: '',
        registrationNumber: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        website: '',
        logoUrl: '',
        description: '',
      },
    });

    const handleSubmit = async (data: AuctioneerFormData) => {
      await onSubmitAction(data);
    };

    React.useImperativeHandle(ref, () => ({
      requestSubmit: () => form.handleSubmit(handleSubmit)(),
    }));

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8" ref={ref}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do Leiloeiro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registrationNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Registro</FormLabel>
                <FormControl>
                  <Input placeholder="Número de Registro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrição do leiloeiro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Add other fields as necessary based on AuctioneerProfileInfo */}
        </form>
      </Form>
    );
  }
);

AuctioneerForm.displayName = 'AuctioneerForm';

export default AuctioneerForm;
// src/app/admin/judicial-branches/components/judicial-branch-form.tsx
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
import { JudicialBranch } from '@bidexpert/core'; // Import the type

// Define the Zod schema for the form
const judicialBranchFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  districtId: z.string().min(1, "Comarca é obrigatória."),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
});

export type JudicialBranchFormData = Partial<Omit<JudicialBranch, 'id' | 'createdAt' | 'updatedAt'>>;

interface JudicialBranchFormProps {
  initialData: JudicialBranchFormData | null;
  onSubmitAction: (data: JudicialBranchFormData) => Promise<any>;
}

const JudicialBranchForm = React.forwardRef<HTMLFormElement, JudicialBranchFormProps>(
  ({ initialData, onSubmitAction }, ref) => {
    const form = useForm<JudicialBranchFormData>({
      resolver: zodResolver(judicialBranchFormSchema),
      defaultValues: initialData || {
        name: '',
        districtId: '',
        contactName: '',
        phone: '',
        email: '',
      },
    });

    const handleSubmit = async (data: JudicialBranchFormData) => {
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
                  <Input placeholder="Nome da Vara Judicial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="districtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comarca</FormLabel>
                <FormControl>
                  <Input placeholder="ID da Comarca" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Contato</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do Contato" {...field} />
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
          {/* Add other fields as necessary based on JudicialBranch */}
        </form>
      </Form>
    );
  }
);

JudicialBranchForm.displayName = 'JudicialBranchForm';

export default JudicialBranchForm;

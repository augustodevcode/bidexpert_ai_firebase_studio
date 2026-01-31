/**
 * @fileoverview Dialog de visualização e resposta de mensagens de contato.
 * Encapsula formulário validado com Zod + react-hook-form.
 */
'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ContactMessage } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';
import { ValidationCheckButton } from '@/components/crud/validation-check-button';
import { validateFormData } from '@/lib/form-validator';

const replySchema = z.object({
  subject: z.string().min(3, 'Informe o assunto da resposta.'),
  message: z.string().min(3, 'Escreva uma resposta antes de enviar.'),
});

type ReplyFormData = z.infer<typeof replySchema>;

interface ContactMessageDialogProps {
  open: boolean;
  message: ContactMessage | null;
  isSending: boolean;
  onOpenChange: (open: boolean) => void;
  onSendReply: (data: ReplyFormData) => Promise<void> | void;
}

export function ContactMessageDialog({
  open,
  message,
  isSending,
  onOpenChange,
  onSendReply,
}: ContactMessageDialogProps) {
  const replyForm = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: { subject: '', message: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!message) return;
    const replySubject = message.subject ? `Re: ${message.subject}` : 'Re: Mensagem de Contato';
    replyForm.reset({ subject: replySubject, message: '' });
  }, [message, replyForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl"
        data-ai-id="contact-message-dialog"
        data-testid="contact-message-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Mensagem de Contato
          </DialogTitle>
          <DialogDescription>
            Visualize a mensagem e envie uma resposta usando a caixa SMTP configurada.
          </DialogDescription>
        </DialogHeader>

        {message && (
          <div className="space-y-6">
            <div className="space-y-2 rounded-lg border p-4" data-ai-id="contact-message-details">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Remetente</p>
                  <p className="font-medium" data-ai-id="contact-message-sender">{message.name}</p>
                  <p className="text-sm text-muted-foreground" data-ai-id="contact-message-email">{message.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assunto</p>
                  <p className="font-medium" data-ai-id="contact-message-subject">{message.subject || 'Sem assunto'}</p>
                  <p className="text-xs text-muted-foreground">
                    Recebida em {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mensagem</p>
                <div className="mt-2 whitespace-pre-wrap text-sm" data-ai-id="contact-message-body">
                  {message.message}
                </div>
              </div>
            </div>

            <Form {...replyForm}>
              <form
                onSubmit={replyForm.handleSubmit(onSendReply)}
                className="space-y-4"
                data-ai-id="contact-message-reply-form"
              >
                <FormField
                  control={replyForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Assunto <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Assunto da resposta"
                          data-ai-id="contact-message-reply-subject"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={replyForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Resposta <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          placeholder="Digite sua resposta para o remetente..."
                          data-ai-id="contact-message-reply-body"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="justify-between">
                  <ValidationCheckButton
                    onCheck={() => validateFormData(replyForm.getValues(), replySchema)}
                    variant="outline"
                  />
                  <Button
                    type="submit"
                    disabled={isSending || !replyForm.formState.isValid}
                    data-ai-id="contact-message-reply-send"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Resposta
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

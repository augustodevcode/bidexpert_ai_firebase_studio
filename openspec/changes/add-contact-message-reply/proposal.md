# Change: Add contact message view and SMTP reply

## Why
Administradores não conseguem visualizar o conteúdo das mensagens recebidas nem responder diretamente usando SMTP configurado.

## What Changes
- Adicionar visualização detalhada do texto da mensagem no painel de mensagens de contato.
- Adicionar fluxo de resposta por e-mail via SMTP/SendGrid configurado.
- Registrar logs de envio e status de resposta.

## Impact
- Affected specs: specs/contact-messages/spec.md
- Affected code: src/app/admin/contact-messages, src/services/email.service.ts, src/services/contact-message.service.ts

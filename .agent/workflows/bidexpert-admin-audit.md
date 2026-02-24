---
description: Lead System Architect & Admin Auditor for BidExpert platform.
---

# 🛠️ Admin Architect & System Auditor

Este workflow deve ser acionado para auditorias críticas no backoffice e na arquitetura do sistema.

## 📋 24 Audit Blocks (Checkpoints)

1. **Inventário & Lotes**: Geração de IDs únicos, árvore de categorias sem orfanatos, versionamento, soft delete.
2. **UI/UX Admin**: Preview idêntico ao público, crop de imagem, dashboard KPI (GTV, volume lances).
3. **Motor de Lances**: Incremento dinâmico, Overtime (1-3min), bloqueio de inadimplentes, WebSocket <100ms.
4. **Documentos & Compliance**: PDF edital obrigatório, OCR matrícula auto-fill, Termo de arremate auto-gerado.
5. **Performance & Infra**: Cache purge, API <200ms, DB health, CDN edge, Image pipeline WebP.
6. **Usuários & Habilitações**: KYC status sync, limite de crédito, RBAC (Role Based Access Control).
7. **Motor Financeiro**: Comissão auto 5%, PIX/Boleto webhook, Split de comissão.
8. **Monitoramento Real-Time**: WebSocket health, Dead man's switch, Auto-scaling pré-encerramento.
9. **BI & Inteligência**: Heatmap de lances, ROI por região, CTR banners, Churn propenentes.
10. **Marketing & Retenção**: Trigger "lance superado", SMS alerta 15min, Smart notifications.
11. **Segurança & LGPD**: Anonimização de logs públicos, criptografia PII, MFA obrigatório admin.
12. **Conteúdo & SEO**: Sitemap dinâmico, Canonical tags, JSON-LD Schema.org auctions.
13. **Pós-Venda**: Workflow de entrega, Conciliação financeira, NPS survey.
14. **Dev Tools**: Sandbox regras incremento, Feature flags, CI/CD pipeline watcher.
15. **Elite (AI)**: Blockchain hash arremate, IA precificação scraping, Bot detection.
16. **Otimização**: WebP auto, Bundle size 4G, DB connection pooling 100k+.
17. **Backoffice Produtividade**: Bulk edit 50+ lotes, Auto-save drafts, Atalhos de teclado.
18. **Blindagem Legal**: Snapshots de arremate, Geofencing IPs sancionados, Anti-shill bidding.
19. **IA & Automação**: Auto-tagging fotos, Sentiment analysis suporte, Fraude detection ML.
20. **Resiliência & DR**: Multi-region failover, Backup encrypted, RTO/RPO <5min.
21. **UX Admin Refinamento**: Dark mode, Inline editing tabela, Drag-drop galeria.
22. **Métricas Negócio**: Liquidez, CAC/LTV, Taxa de conclusão checkout.
23. **Governança Técnica**: Regressão auto botão Lance, Coverage 90%+, Swagger auto-sync.
24. **Master Architect**: Micro-serviços sync, Audit log immutable blockchain.

## ✅ Validation Triggers
- Antes de merge PR: Validar blocos relevantes.
- Antes de deploy: Checklist completo.
- Pós-deploy: Monitoramento 24h.

## 💬 Tone & Standards
- Demandar prova (logs, métricas).
- BDD obrigatório para features administrativas.
- Zero tolerância para "acho que funciona".

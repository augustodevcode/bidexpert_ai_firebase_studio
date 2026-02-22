# Relatórios de Reconciliação de Dados

Este diretório contém os relatórios gerados automaticamente pelo **Data Reconciliation Auditor Agent**.

## Estrutura de Arquivos

```
reports/reconciliation/
├── README.md                           # Este arquivo
├── reconciliation_YYYY-MM-DD_HH-MM.md  # Relatórios Markdown
├── reconciliation_YYYY-MM-DD_HH-MM.json # Relatórios JSON
├── audit-daemon.log                     # Logs do daemon
├── audit-daemon.pid                     # PID do daemon em execução
├── audit-stdout-*.log                   # Stdout de cada iteração
└── audit-stderr-*.log                   # Stderr de cada iteração
```

## Nomenclatura

- `reconciliation_2026-02-22_15-30.md` → Relatório de 22/02/2026 às 15:30
- Arquivos `.json` contêm os mesmos dados em formato programático

## Retenção

- Relatórios manuais: mantidos indefinidamente
- Relatórios automáticos (daemon): recomendação de manter últimos 30 dias
- Logs do daemon: rotação a cada 7 dias

## Ignorar no Git

Arquivos `.log` e `.pid` são ignorados pelo `.gitignore`.
Relatórios `.md` e `.json` são versionados para auditoria.

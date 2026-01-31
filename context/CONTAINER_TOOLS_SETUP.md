# Container Tools - Configuração e Uso

## Pré-requisitos

### 1. Docker Desktop
- **Download:** https://www.docker.com/products/docker-desktop/
- **Instalação:** Execute o instalador e reinicie o Windows
- **Verificação:** `docker --version` no terminal

### 2. Extensões VSCode (já configuradas)
- Docker Extension Pack (`ms-azuretools.vscode-docker`)
- Remote Containers (`ms-vscode-remote.remote-containers`)

## Configuração do PATH (se necessário)

Se `docker` não for reconhecido no terminal:

```powershell
# Adicionar Docker ao PATH temporariamente
$env:PATH += ";C:\Program Files\Docker\Docker\resources\bin"

# Ou verificar instalação
Get-Command docker -ErrorAction SilentlyContinue
```

## Ambientes Disponíveis

| Ambiente | Arquivo | Slug URL | Descrição |
|----------|---------|----------|-----------|
| **DEV** | `docker-compose.dev.yml` | `dev.localhost:9005` | Desenvolvimento local |
| **HML** | `docker-compose.hml.yml` | `hml.localhost:9005` | Homologação/Testes |
| **DEMO** | `docker-compose.demo.yml` | `demo.localhost:9005` | Demonstração |
| **PROD** | `docker-compose.prod.yml` | N/A | Produção |

## Comandos por Ambiente

### Desenvolvimento (DEV)
```powershell
# Iniciar serviços
docker compose -f docker-compose.dev.yml up -d

# Ver logs do MySQL
docker logs -f bidexpert-mysql-dev

# Acessar MySQL shell
docker exec -it bidexpert-mysql-dev mysql -u root -ppassword

# Parar serviços
docker compose -f docker-compose.dev.yml down
```

### Homologação (HML)
```powershell
docker compose -f docker-compose.hml.yml up -d
docker compose -f docker-compose.hml.yml down
```

### Demonstração (DEMO)
```powershell
docker compose -f docker-compose.demo.yml up -d
docker compose -f docker-compose.demo.yml down
```

## Serviços Configurados

### MySQL (Banco de Dados)
- **Container:** `bidexpert-mysql-dev`
- **Porta:** 3306
- **Usuário:** root
- **Senha:** password (dev) / M!nh@S3nha2025 (demo)

### SMTP4Dev (Email para Testes)
- **Container:** `bidexpert-smtp4dev`
- **Porta SMTP:** 2525
- **Interface Web:** http://localhost:8025

## Uso pelas AIs

### GitHub Copilot
O Copilot tem acesso à ferramenta `container-tools_get-config` que retorna:
- Base command para CLI de containers: `docker`
- Base command para orchestrator: `docker-compose`

### Gemini CLI
Ver instruções em: `context/geminicli_context_history.md`

### Regras Gerais
1. ✅ Sempre verificar containers antes de testes E2E
2. ✅ Usar ambiente correto (dev/hml/demo)
3. ⛔ Nunca modificar produção sem autorização
4. 📝 Documentar alterações em configurações

## Troubleshooting

### Docker não encontrado
```powershell
# Verificar se Docker Desktop está instalado
Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Reiniciar Docker Desktop
& "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### Container não inicia
```powershell
# Ver logs detalhados
docker compose -f docker-compose.dev.yml logs

# Remover volumes e reiniciar
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### Porta em uso
```powershell
# Verificar processo na porta
Get-NetTCPConnection -LocalPort 3306 | Select-Object OwningProcess
```

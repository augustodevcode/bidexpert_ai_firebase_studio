# Configuração do MCP GitHub no VSCode

Este guia descreve o passo a passo para ativar o **GitHub MCP Server** no VSCode, permitindo que o GitHub Copilot interaja com issues, pull requests, repositórios e muito mais.

---

## Pré-requisitos

| Requisito | Verificação |
|-----------|-------------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando | `docker --version` |
| [VSCode](https://code.visualstudio.com/) ≥ 1.99 | `code --version` |
| Extensão **GitHub Copilot Chat** instalada | Marketplace: `GitHub.copilot-chat` |
| Conta GitHub com acesso ao repositório | — |

---

## Passo 1 — Criar um Personal Access Token (PAT) do GitHub

1. Acesse **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**:  
   <https://github.com/settings/tokens?type=beta>

2. Clique em **"Generate new token"**.

3. Configure:
   - **Token name**: `bidexpert-mcp-local`
   - **Expiration**: 90 dias (ou conforme sua política)
   - **Repository access**: selecione o(s) repositório(s) desejado(s) ou "All repositories"
   - **Permissions** (mínimas necessárias):
     | Permissão | Nível |
     |-----------|-------|
     | Contents | Read & Write |
     | Issues | Read & Write |
     | Pull requests | Read & Write |
     | Metadata | Read-only |

4. Clique em **"Generate token"** e **copie o token** (você não verá novamente).

---

## Passo 2 — Definir a variável de ambiente `GITHUB_PERSONAL_ACCESS_TOKEN`

### Windows (PowerShell — sessão atual)
```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_SEU_TOKEN_AQUI"
```

### Windows (permanente — variável de sistema)
```powershell
[System.Environment]::SetEnvironmentVariable(
  "GITHUB_PERSONAL_ACCESS_TOKEN",
  "ghp_SEU_TOKEN_AQUI",
  "User"
)
```
> Reinicie o VSCode após definir variáveis permanentes.

### macOS / Linux
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_SEU_TOKEN_AQUI"
```
Adicione ao `~/.bashrc` ou `~/.zshrc` para persistir.

---

## Passo 3 — Verificar a configuração no VSCode

O arquivo `.vscode/settings.json` deste projeto já contém a configuração do servidor MCP GitHub:

```json
"mcp": {
  "servers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

Se você precisar configurar manualmente em outro projeto, adicione o bloco acima ao seu `.vscode/settings.json`.

---

## Passo 4 — Baixar a imagem Docker do GitHub MCP Server

```bash
docker pull ghcr.io/github/github-mcp-server
```

---

## Passo 5 — Ativar o MCP no VSCode

1. Abra o VSCode neste workspace.
2. Abra a paleta de comandos: `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac).
3. Digite **"MCP: List Servers"** e pressione Enter.
4. Verifique que o servidor **"github"** aparece na lista.
5. Clique em **"Start"** ao lado do servidor `github` (ou ele inicia automaticamente ao abrir o chat do Copilot).

---

## Passo 6 — Testar no Copilot Chat

Abra o **GitHub Copilot Chat** (`Ctrl+Alt+I`) e teste:

```
@github liste as últimas issues abertas do repositório
```

```
@github qual foi o último pull request mergeado?
```

Se o MCP estiver funcionando, o Copilot usará as ferramentas do GitHub MCP para responder com dados reais do repositório.

---

## Solução de Problemas

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| `docker: command not found` | Docker não instalado ou não no PATH | Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| `Error: GITHUB_PERSONAL_ACCESS_TOKEN not set` | Variável não definida no ambiente | Defina conforme o Passo 2 |
| Servidor não aparece em "MCP: List Servers" | VSCode desatualizado | Atualize para VSCode ≥ 1.99 |
| `403 Forbidden` ao usar ferramentas | Token sem permissões suficientes | Recrie o PAT com as permissões do Passo 1 |
| `docker pull` lento | Primeira vez baixando a imagem | Aguarde; ~200 MB de download |

---

## Referências

- [GitHub MCP Server — repositório oficial](https://github.com/github/github-mcp-server)
- [Documentação MCP no VSCode](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [Model Context Protocol — site oficial](https://modelcontextprotocol.io)

import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Cache para evitar issues duplicadas
const errorCache = new Map<string, number>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

interface VercelLogEntry {
  id: string;
  message: string;
  timestamp: number;
  source: string;
  type: "stdout" | "stderr" | "lambda-error" | "edge-error";
  level?: "error" | "warn" | "info";
  projectId?: string;
  deploymentId?: string;
  path?: string;
  statusCode?: number;
}

export async function POST(request: NextRequest) {
  // Validar secret do Vercel
  const authHeader = request.headers.get("authorization");
  const secret = process.env.LOG_DRAIN_SECRET;
  
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs: VercelLogEntry[] = await request.json();
    
    // Filtrar APENAS ERROS
    const errorLogs = logs.filter(log => 
      log.type === "lambda-error" || 
      log.type === "edge-error" ||
      (log.type === "stderr" && log.level === "error") ||
      (log.message && log.message.toLowerCase().includes("error"))
    );

    // Processar cada erro
    for (const log of errorLogs) {
      await processError(log);
    }

    return NextResponse.json({ 
      processed: logs.length,
      errors: errorLogs.length 
    });
  } catch (error) {
    console.error("Error processing logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

async function processError(log: VercelLogEntry) {
  // Gerar fingerprint único para o erro
  const errorFingerprint = generateFingerprint(log.message);
  
  // Verificar cache (evitar duplicatas em 24h)
  const lastSeen = errorCache.get(errorFingerprint);
  const now = Date.now();
  
  if (lastSeen && (now - lastSeen) < CACHE_DURATION) {
    console.log(`Skipping duplicate error: ${errorFingerprint}`);
    return;
  }
  
  // Criar issue no GitHub
  try {
    const issue = await octokit.issues.create({
      owner: "augustodevcode",
      repo: "bidexpert_ai_firebase_studio",
      title: `[Production Error] ${truncate(log.message, 80)}`,
      body: formatIssueBody(log),
      labels: ["bug", "production-error", "vercel", "automated"],
    });
    
    // Atualizar cache
    errorCache.set(errorFingerprint, now);
    
    console.log(`✅ Issue criada: ${issue.data.html_url}`);
  } catch (error) {
    console.error("Erro ao criar issue:", error);
  }
}

function generateFingerprint(message: string): string {
  // Normalizar mensagem para agrupar erros similares
  const normalized = message
    .replace(/\d+/g, "N") // Substituir números
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "UUID") // UUIDs
    .replace(/\/[a-zA-Z0-9_-]+\//g, "/PATH/") // Paths
    .toLowerCase()
    .substring(0, 100);
  
  return Buffer.from(normalized).toString("base64");
}

function formatIssueBody(log: VercelLogEntry): string {
  return `
## 🔴 Erro de Produção Detectado

**Timestamp:** ${new Date(log.timestamp).toISOString()}  
**Source:** ${log.source}  
**Type:** ${log.type}  
**Deployment:** ${log.deploymentId || "N/A"}  
**Path:** ${log.path || "N/A"}  
${log.statusCode ? `**Status Code:** ${log.statusCode}` : ""}

### Stack Trace / Message:
\`\`\`
${log.message}
\`\`\`

### Log ID:
\`${log.id}\`

---
**Criado automaticamente via Vercel Log Drains**
  `.trim();
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

// Limpar cache periodicamente (executar a cada 1 hora)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of errorCache.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      errorCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * @file setup-worktree.js
 * @description Script para gerenciar git worktrees no BidExpert.
 *
 * Permite que múltiplos agentes AI ou desenvolvedores trabalhem em paralelo,
 * cada um com seu próprio diretório de trabalho e porta de desenvolvimento.
 *
 * Uso:
 *   node .vscode/setup-worktree.js add <branch> <porta>
 *   node .vscode/setup-worktree.js list
 *   node .vscode/setup-worktree.js remove <branch>
 *   node .vscode/setup-worktree.js prune
 *
 * Exemplos:
 *   node .vscode/setup-worktree.js add feat/minha-feature-20260302 9007
 *   node .vscode/setup-worktree.js list
 *   node .vscode/setup-worktree.js remove feat/minha-feature-20260302
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..');
const WORKTREES_DIR = path.join(REPO_ROOT, 'worktrees');

const PORTS_BY_ENV = {
  9005: 'DEV Principal',
  9006: 'DEV Secundário (Agente AI #1)',
  9007: 'DEV Terciário (Agente AI #2)',
  9008: 'DEV Quaternário (Agente AI #3)',
  9009: 'HML/Testes',
};

function run(cmd, opts = {}) {
  const result = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf-8', ...opts });
  return result ? result.trim() : '';
}

function header(title) {
  console.log('');
  console.log('============================================================');
  console.log(' ' + title);
  console.log('============================================================');
  console.log('');
}

function listWorktrees() {
  header('Git Worktrees Ativos');

  const output = run('git worktree list --porcelain');
  const entries = output.split('\n\n').filter(Boolean);

  if (entries.length === 0) {
    console.log('Nenhum worktree adicional configurado.');
    return;
  }

  entries.forEach((entry, i) => {
    const lines = entry.trim().split('\n');
    const wt = {};
    lines.forEach((line) => {
      const [key, ...rest] = line.split(' ');
      wt[key] = rest.join(' ');
    });
    const label = i === 0 ? ' [principal]' : '';
    console.log(`${i + 1}. ${wt.worktree}${label}`);
    console.log(`   Branch : ${wt.branch || '(detached)'}`);
    console.log(`   HEAD   : ${wt.HEAD}`);
    console.log('');
  });
}

function addWorktree(branch, port) {
  if (!branch) {
    console.error('❌ Informe o nome da branch. Ex: feat/minha-feature-20260302');
    process.exit(1);
  }

  const portNum = parseInt(port, 10);
  if (port && isNaN(portNum)) {
    console.error('❌ Porta inválida:', port);
    process.exit(1);
  }

  const safeName = branch.replace(/\//g, '-');
  const worktreeDir = path.join(WORKTREES_DIR, safeName);

  header(`Criando Worktree: ${branch}`);

  // Criar diretório raiz de worktrees se necessário
  if (!fs.existsSync(WORKTREES_DIR)) {
    fs.mkdirSync(WORKTREES_DIR, { recursive: true });
    console.log(`📁 Diretório criado: worktrees/`);
  }

  if (fs.existsSync(worktreeDir)) {
    console.log(`⚠️  Worktree já existe: worktrees/${safeName}`);
    console.log(`   Para removê-lo: node .vscode/setup-worktree.js remove ${branch}`);
    process.exit(1);
  }

  // Verificar se a branch já existe (local ou remota)
  const localBranches = run('git branch').split('\n').map((b) => b.replace(/^\*?\s+/, ''));
  const remoteBranches = run('git branch -r').split('\n').map((b) => b.trim().replace(/^origin\//, ''));

  let wtAdded = false;
  if (localBranches.includes(branch)) {
    console.log(`ℹ️  Usando branch local existente: ${branch}`);
    spawnSync('git', ['worktree', 'add', worktreeDir, branch], { cwd: REPO_ROOT, stdio: 'inherit' });
    wtAdded = true;
  } else if (remoteBranches.includes(branch)) {
    console.log(`ℹ️  Fazendo checkout de branch remota: origin/${branch}`);
    spawnSync('git', ['worktree', 'add', worktreeDir, '-b', branch, `origin/${branch}`], { cwd: REPO_ROOT, stdio: 'inherit' });
    wtAdded = true;
  } else {
    console.log(`ℹ️  Criando nova branch a partir de demo-stable: ${branch}`);
    // Tentar atualizar demo-stable (com timeout de 5s para ambientes sem rede)
    try {
      execSync('git fetch origin demo-stable', { cwd: REPO_ROOT, encoding: 'utf-8', timeout: 5000 });
    } catch {
      console.log('   (Não foi possível buscar demo-stable remotamente — usando local)');
    }
    const hasRemoteBase = run('git branch -r').split('\n').map((b) => b.trim()).includes('origin/demo-stable');
    const base = hasRemoteBase ? 'origin/demo-stable' : 'HEAD';
    const result = spawnSync('git', ['worktree', 'add', worktreeDir, '-b', branch, base], { cwd: REPO_ROOT, stdio: 'inherit' });
    wtAdded = result.status === 0;
  }

  if (!wtAdded) {
    console.error('❌ Falha ao criar o worktree. Verifique os erros acima.');
    process.exit(1);
  }

  console.log('');
  console.log('✅ Worktree criado com sucesso!');
  console.log('');
  console.log('📂 Diretório  :', `worktrees/${safeName}`);
  console.log('🌿 Branch     :', branch);

  if (portNum) {
    const portLabel = PORTS_BY_ENV[portNum] || 'Personalizada';
    console.log('🔌 Porta      :', portNum, `(${portLabel})`);
    console.log('');
    console.log('Para iniciar o servidor nesse worktree:');
    console.log('');
    console.log(`   cd worktrees/${safeName}`);
    console.log(`   npm install`);
    console.log(`   PORT=${portNum} npm run dev`);
    console.log('');
    console.log(`   Acesso: http://dev.localhost:${portNum}`);
  }

  console.log('');
  console.log('Para abrir no VS Code:');
  console.log(`   code worktrees/${safeName}`);
  console.log('');
}

function removeWorktree(branch) {
  if (!branch) {
    console.error('❌ Informe o nome da branch. Ex: feat/minha-feature-20260302');
    process.exit(1);
  }

  const safeName = branch.replace(/\//g, '-');
  const worktreeDir = path.join(WORKTREES_DIR, safeName);

  header(`Removendo Worktree: ${branch}`);

  if (!fs.existsSync(worktreeDir)) {
    console.log(`⚠️  Worktree não encontrado: worktrees/${safeName}`);
    console.log('   Execute: node .vscode/setup-worktree.js list');
    process.exit(1);
  }

  run(`git worktree remove "${worktreeDir}" --force`);
  console.log(`✅ Worktree removido: worktrees/${safeName}`);
  console.log('');
}

function pruneWorktrees() {
  header('Limpando Worktrees Obsoletos');
  run('git worktree prune');
  console.log('✅ Prune concluído. Worktrees obsoletos removidos.');
  console.log('');
}

function printHelp() {
  header('BidExpert — Gerenciador de Git Worktrees');
  console.log('Comandos disponíveis:');
  console.log('');
  console.log('  add <branch> [porta]   Cria um novo worktree para a branch');
  console.log('  list                   Lista todos os worktrees ativos');
  console.log('  remove <branch>        Remove um worktree existente');
  console.log('  prune                  Remove referências de worktrees obsoletos');
  console.log('');
  console.log('Exemplos:');
  console.log('');
  console.log('  node .vscode/setup-worktree.js add feat/nova-feature-20260302 9007');
  console.log('  node .vscode/setup-worktree.js list');
  console.log('  node .vscode/setup-worktree.js remove feat/nova-feature-20260302');
  console.log('  node .vscode/setup-worktree.js prune');
  console.log('');
  console.log('Portas reservadas:');
  Object.entries(PORTS_BY_ENV).forEach(([p, label]) => {
    console.log(`  ${p}  ${label}`);
  });
  console.log('');
}

// --- CLI entrypoint ---
const [, , command, ...args] = process.argv;

switch (command) {
  case 'add':
    addWorktree(args[0], args[1]);
    break;
  case 'list':
    listWorktrees();
    break;
  case 'remove':
  case 'rm':
    removeWorktree(args[0]);
    break;
  case 'prune':
    pruneWorktrees();
    break;
  default:
    printHelp();
}

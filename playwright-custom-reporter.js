// playwright-custom-reporter.js
// Custom Playwright reporter that generates a detailed plain text report

const fs = require('fs');
const path = require('path');

class PlaintextReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile || 'test-results/plaintext-report.txt';
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  onBegin(config, suite) {
    this.startTime = new Date();
    this.results = [];
    
    // Ensure output directory exists
    const outputDir = path.dirname(this.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`\n🎭 Playwright Test Report - Iniciando execução dos testes`);
    console.log(`📅 Data/Hora: ${this.startTime.toLocaleString('pt-BR')}`);
    console.log(`📁 Diretório de testes: ${config.testDir}`);
    console.log(`🔧 Configuração: ${config.projects.map(p => p.name).join(', ')}`);
    console.log(`⏱️  Timeout global: ${config.timeout}ms`);
    console.log(`👥 Workers: ${config.workers}`);
    console.log(`🔄 Retries: ${config.retries}`);
    console.log(`─`.repeat(80));
  }

  onTestBegin(test) {
    console.log(`\n🧪 Iniciando: ${test.title}`);
    console.log(`📂 Arquivo: ${test.location.file}`);
    console.log(`🏷️  Projeto: ${test.parent.project().name}`);
  }

  onTestEnd(test, result) {
    const duration = result.duration;
    const status = result.status;
    
    let statusIcon = '';
    let statusText = '';
    
    switch (status) {
      case 'passed':
        statusIcon = '✅';
        statusText = 'PASSOU';
        break;
      case 'failed':
        statusIcon = '❌';
        statusText = 'FALHOU';
        break;
      case 'timedout':
        statusIcon = '⏰';
        statusText = 'TIMEOUT';
        break;
      case 'skipped':
        statusIcon = '⏭️';
        statusText = 'PULADO';
        break;
      default:
        statusIcon = '❓';
        statusText = 'DESCONHECIDO';
    }

    console.log(`${statusIcon} ${statusText} - ${test.title} (${duration}ms)`);
    
    if (result.error) {
      console.log(`💥 Erro: ${result.error.message}`);
      if (result.error.stack) {
        console.log(`📍 Stack trace:`);
        console.log(result.error.stack.split('\n').slice(0, 5).join('\n'));
      }
    }

    // Store result for final report
    this.results.push({
      title: test.title,
      file: test.location.file,
      project: test.parent.project().name,
      status: status,
      duration: duration,
      error: result.error ? {
        message: result.error.message,
        stack: result.error.stack
      } : null,
      retry: result.retry,
      startTime: result.startTime,
      attachments: result.attachments || []
    });
  }

  onEnd(result) {
    this.endTime = new Date();
    const totalDuration = this.endTime - this.startTime;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏁 RESUMO FINAL DOS TESTES`);
    console.log(`${'='.repeat(80)}`);
    
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const timedout = this.results.filter(r => r.status === 'timedout').length;
    const total = this.results.length;
    
    console.log(`📊 Total de testes: ${total}`);
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`⏭️ Pulado: ${skipped}`);
    console.log(`⏰ Timeout: ${timedout}`);
    console.log(`⏱️  Duração total: ${Math.round(totalDuration / 1000)}s`);
    console.log(`📈 Taxa de sucesso: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);
    
    // Generate detailed plaintext report
    this.generatePlaintextReport();
    
    console.log(`\n📄 Relatório detalhado salvo em: ${this.outputFile}`);
    console.log(`🌐 Relatório HTML disponível em: playwright-report/index.html`);
  }

  generatePlaintextReport() {
    const lines = [];
    
    lines.push('RELATÓRIO DE TESTES PLAYWRIGHT - BIDEXPERT');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Data/Hora de Início: ${this.startTime.toLocaleString('pt-BR')}`);
    lines.push(`Data/Hora de Fim: ${this.endTime.toLocaleString('pt-BR')}`);
    lines.push(`Duração Total: ${Math.round((this.endTime - this.startTime) / 1000)}s`);
    lines.push('');
    
    // Summary
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const timedout = this.results.filter(r => r.status === 'timedout').length;
    const total = this.results.length;
    
    lines.push('RESUMO EXECUTIVO');
    lines.push('-'.repeat(30));
    lines.push(`Total de Testes: ${total}`);
    lines.push(`Passou: ${passed}`);
    lines.push(`Falhou: ${failed}`);
    lines.push(`Pulado: ${skipped}`);
    lines.push(`Timeout: ${timedout}`);
    lines.push(`Taxa de Sucesso: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);
    lines.push('');
    
    // Detailed results
    lines.push('RESULTADOS DETALHADOS');
    lines.push('-'.repeat(30));
    lines.push('');
    
    this.results.forEach((result, index) => {
      const statusText = {
        'passed': 'PASSOU',
        'failed': 'FALHOU',
        'timedout': 'TIMEOUT',
        'skipped': 'PULADO'
      }[result.status] || 'DESCONHECIDO';
      
      lines.push(`${index + 1}. ${result.title}`);
      lines.push(`   Status: ${statusText}`);
      lines.push(`   Arquivo: ${path.basename(result.file)}`);
      lines.push(`   Projeto: ${result.project}`);
      lines.push(`   Duração: ${result.duration}ms`);
      
      if (result.retry > 0) {
        lines.push(`   Tentativas: ${result.retry + 1}`);
      }
      
      if (result.error) {
        lines.push(`   Erro: ${result.error.message}`);
        if (result.error.stack) {
          lines.push(`   Stack Trace:`);
          const stackLines = result.error.stack.split('\n').slice(0, 10);
          stackLines.forEach(line => {
            lines.push(`     ${line.trim()}`);
          });
        }
      }
      
      if (result.attachments && result.attachments.length > 0) {
        lines.push(`   Anexos: ${result.attachments.length}`);
        result.attachments.forEach(att => {
          lines.push(`     - ${att.name}: ${att.path || att.body ? 'Disponível' : 'N/A'}`);
        });
      }
      
      lines.push('');
    });
    
    // Failed tests summary
    const failedTests = this.results.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      lines.push('TESTES QUE FALHARAM');
      lines.push('-'.repeat(30));
      lines.push('');
      
      failedTests.forEach((test, index) => {
        lines.push(`${index + 1}. ${test.title}`);
        lines.push(`   Arquivo: ${path.basename(test.file)}`);
        lines.push(`   Erro: ${test.error ? test.error.message : 'Erro desconhecido'}`);
        lines.push('');
      });
    }
    
    // Performance summary
    lines.push('ANÁLISE DE PERFORMANCE');
    lines.push('-'.repeat(30));
    const avgDuration = this.results.length > 0 ? 
      Math.round(this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length) : 0;
    const slowestTest = this.results.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest, { duration: 0 });
    const fastestTest = this.results.reduce((fastest, current) => 
      current.duration < fastest.duration ? current : fastest, { duration: Infinity });
    
    lines.push(`Duração Média por Teste: ${avgDuration}ms`);
    if (slowestTest.duration > 0) {
      lines.push(`Teste Mais Lento: ${slowestTest.title} (${slowestTest.duration}ms)`);
    }
    if (fastestTest.duration < Infinity) {
      lines.push(`Teste Mais Rápido: ${fastestTest.title} (${fastestTest.duration}ms)`);
    }
    lines.push('');
    
    lines.push('Relatório gerado automaticamente pelo Playwright Custom Reporter');
    lines.push(`Versão do Node.js: ${process.version}`);
    lines.push(`Sistema Operacional: ${process.platform}`);
    
    // Write to file
    fs.writeFileSync(this.outputFile, lines.join('\n'), 'utf8');
  }
}

module.exports = PlaintextReporter;

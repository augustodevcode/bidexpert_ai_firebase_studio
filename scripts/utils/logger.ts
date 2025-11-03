import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(__dirname, '../../logs/seed-logs.txt');

// Garante que o diretório de logs existe
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Limpa o arquivo de log existente
if (fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

const logger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
    
    // Escreve no arquivo de log
    logStream.write(logMessage);
    
    // Exibe no console
    console.log(`[${timestamp}] ${message}`, data ? data : '');
  },
  
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error 
      ? `${error.message}\n${error.stack}`
      : JSON.stringify(error, null, 2);
      
    const logMessage = `[${timestamp}] ERRO: ${message}\n${errorMessage}\n`;
    
    // Escreve no arquivo de log
    logStream.write(logMessage);
    
    // Exibe no console com cor vermelha
    console.error(`\x1b[31m[${timestamp}] ERRO: ${message}\n${errorMessage}\x1b[0m`);
  },
  
  // Fecha o stream de log quando não for mais necessário
  close: () => {
    logStream.end();
  }
};

export default logger;

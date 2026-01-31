
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function lowercaseFirstLetter(string: string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

// Special mapping for tricky casing if needed
const modelMapping: Record<string, string> = {
    'ITSMTicket': 'itsmTicket',
    'ITSMQueryLog': 'itsmQueryLog',
    'ITSMMessage': 'itsmMessage',
    'ITSMAttachment': 'itsmAttachment', 
    'FAQ': 'faq',
    'CNJSubject': 'cnjSubject',
    'CNJCourt': 'cnjCourt',
    // Add others if they fail
};

async function getModelCount(modelName: string) {
    let clientName = modelMapping[modelName] || lowercaseFirstLetter(modelName);
    
    // Try to find the delegate
    if (!(prisma as any)[clientName]) {
        // Try strict camelCase
        clientName = modelName.replace(/^[A-Z]+/, (m) => m.toLowerCase());
    }

    if (!(prisma as any)[clientName]) {
        return { count: -1, error: `Delegate '${clientName}' not found` };
    }

    try {
        const count = await (prisma as any)[clientName].count();
        return { count };
    } catch (error: any) {
        return { count: -1, error: error.message };
    }
}

(async () => {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
        console.error('Schema not found');
        return;
    }
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const modelRegex = /^model\s+(\w+)\s+\{/gm;
    const models: string[] = [];
    let m;
    while ((m = modelRegex.exec(schema)) !== null) {
        models.push(m[1]);
    }

    console.log('# Relatório de Cobertura de Dados (Seed Data Coverage)\n');
    console.log(`> Data: ${new Date().toLocaleString()}\n`);
    console.log('| Model (Tabela) | Registros | Status |');
    console.log('|---|---|---|');

    let populatedCount = 0;
    let emptyCount = 0;
    let errorCount = 0;

    for (const model of models.sort()) {
        const result = await getModelCount(model);
        let status = '';
        if (result.count > 0) {
            status = '✅ Populated';
            populatedCount++;
        } else if (result.count === 0) {
            status = '⚠️ **EMPTY**';
            emptyCount++;
        } else {
            status = `❌ Error: ${result.error}`;
            errorCount++;
        }
        console.log(`| ${model} | ${result.count >= 0 ? result.count : 'N/A'} | ${status} |`);
    }

    console.log(`\n\n**Resumo:**`);
    console.log(`- Total Tabelas: ${models.length}`);
    console.log(`- Preenchidas: ${populatedCount}`);
    console.log(`- Vazias: ${emptyCount}`);
    console.log(`- Erros de Acesso: ${errorCount}`);

    console.log(`\n\n> Se existirem muitas tabelas vazias, considere rodar \`npm run db:seed:all\` (ou \`scripts/ultimate-master-seed.ts\`).`);
})();

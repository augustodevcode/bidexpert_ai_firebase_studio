const { chromium } = require('playwright');

(async () => {
    console.log('>>> Iniciando Verificação de Deploy (BidExpert) <<<');
    
    // Configurações
    const hmlUrl = 'https://bidexpert.com.br'; // Ajustar conforme DNS real se diferente
    const screenshotsDir = 'logs/screenshots';
    
    // Garantir diretório de logs
    const fs = require('fs');
    if (!fs.existsSync(screenshotsDir)){
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        console.log(`Acessando: ${hmlUrl}`);
        const response = await page.goto(hmlUrl, { waitUntil: 'networkidle', timeout: 30000 });
        
        console.log(`Status HTTP: ${response.status()}`);
        console.log(`Título da Página: ${await page.title()}`);
        
        // Screenshot para evidência
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenPath = `${screenshotsDir}/hml-check-${timestamp}.png`;
        await page.screenshot({ path: screenPath });
        console.log(`Evidência salva em: ${screenPath}`);

        if (response.status() === 200) {
            console.log('[SUCESSO] O site de homologação está acessível!');
        } else {
            console.error('[ERRO] O site respondeu com erro.');
            process.exit(1);
        }

    } catch (error) {
        console.error(`[FALHA] Não foi possível conectar ao site: ${error.message}`);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();

'use server';

/**
 * @fileOverview A Genkit flow to generate PDF documents from HTML templates.
 * This flow takes data, compiles it into an HTML template using Handlebars,
 * and then uses Puppeteer to convert the HTML into a PDF file.
 *  - generateDocument - The main function to trigger the document generation.
 *  - GenerateDocumentInput - The input type for the generation function.
 *  - GenerateDocumentOutput - The return type, containing the PDF as a Base64 string.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { getDocumentTemplateAction } from '@/app/admin/document-templates/actions';

export const GenerateDocumentInputSchema = z.object({
  documentType: z.enum(['WINNING_BID_TERM', 'EVALUATION_REPORT', 'AUCTION_CERTIFICATE']),
  templateId: z.string().optional(), // Optional: If you want to use a specific template from DB
  data: z.any().describe("The data object to populate the template, e.g., auction, lot, winner details."),
});
export type GenerateDocumentInput = z.infer<typeof GenerateDocumentInputSchema>;

export const GenerateDocumentOutputSchema = z.object({
  pdfBase64: z.string().describe("The generated PDF file encoded as a Base64 string."),
  fileName: z.string().describe("A suggested filename for the document, e.g., 'termo-arrematacao-lote-123.pdf'"),
});
export type GenerateDocumentOutput = z.infer<typeof GenerateDocumentOutputSchema>;

export async function generateDocument(input: GenerateDocumentInput): Promise<GenerateDocumentOutput> {
  return generateDocumentFlow(input);
}

// Default templates if nothing is found in the database
const defaultTemplates: Record<GenerateDocumentInput['documentType'], string> = {
  WINNING_BID_TERM: `
    <!DOCTYPE html><html><body><h1>Termo de Arrematação (Padrão)</h1><p>Lote: {{lot.title}}</p><p>Arrematante: {{winner.fullName}}</p><p>Valor: R$ {{lot.price}}</p></body></html>`,
  EVALUATION_REPORT: `
    <!DOCTYPE html><html><head><style>body { font-family: sans-serif; padding: 2rem; } h1 { color: #F97316; } table { width: 100%; border-collapse: collapse; margin-top: 1rem; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head><body><h1>Laudo de Avaliação (Padrão)</h1><h2>Leilão: {{auction.title}}</h2><p>Este é um laudo de avaliação de exemplo gerado pelo sistema para o leilão acima. Data: {{currentDate}}</p></body></html>`,
  AUCTION_CERTIFICATE: `
    <!DOCTYPE html><html><body><h1>Certificado de Leilão (Padrão)</h1><h2>Leilão: {{auction.title}}</h2><p>Certificamos que este leilão foi realizado em {{auction.endDate}}. Total de lotes vendidos: {{auction.totalLotsSold}}</p></body></html>`,
};


const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async (input) => {
    
    let htmlTemplate = defaultTemplates[input.documentType];
    
    // Step 1: Fetch dynamic HTML template from the database if a templateId is provided or a default exists
    if (input.templateId) {
      const dbTemplate = await getDocumentTemplateAction(input.templateId);
      if (dbTemplate?.content) {
        htmlTemplate = dbTemplate.content;
      }
    }

    // Step 2: Use Handlebars to compile the template.
    const template = Handlebars.compile(htmlTemplate);
    const compiledHtml = template(input.data);
      
    // Step 3: Use Puppeteer to generate the PDF
    let browser;
    try {
        console.log('[Puppeteer] Launching browser...');
        browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'] // Important for containerized environments
        });
        const page = await browser.newPage();
        
        console.log('[Puppeteer] Setting content...');
        await page.setContent(compiledHtml, { waitUntil: 'networkidle0' });
        
        console.log('[Puppeteer] Generating PDF...');
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        
        console.log('[Puppeteer] PDF generated successfully.');
        
        const pdfBase64 = pdfBuffer.toString('base64');
        const fileName = `${slugify(input.documentType)}-${slugify(input.data?.auction?.title) || Date.now()}.pdf`;

        return {
            pdfBase64,
            fileName
        };

    } catch (error: any) {
        console.error('[Puppeteer] Error generating PDF:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
        if (browser) {
            console.log('[Puppeteer] Closing browser...');
            await browser.close();
        }
    }
  }
);

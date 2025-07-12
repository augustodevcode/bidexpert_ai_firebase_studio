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
// import Handlebars from 'handlebars'; // We will add this later
// import { getDocumentTemplate } from '@/app/admin/document-templates/actions'; // We will use this later

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

const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async (input) => {
    
    // Step 1: In a future step, we'll fetch a dynamic HTML template from the database
    // For now, we'll use a simple hardcoded template.
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: sans-serif; padding: 2rem; }
              h1 { color: #F97316; } /* Orange */
              table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
          </style>
      </head>
      <body>
          <h1>Relatório de Leilão (Exemplo)</h1>
          <p>Este é um documento de exemplo gerado pelo sistema.</p>
          <p>Tipo de Documento Solicitado: <strong>{{documentType}}</strong></p>
          <h2>Dados Recebidos:</h2>
          <pre>{{jsonData}}</pre>
      </body>
      </html>
    `;

    // Step 2: In a future step, we'll use Handlebars to compile the template.
    // For now, we'll just do a simple string replacement.
    const compiledHtml = htmlTemplate
      .replace('{{documentType}}', input.documentType)
      .replace('{{jsonData}}', JSON.stringify(input.data, null, 2));
      
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
        const fileName = `${input.documentType.toLowerCase()}-${Date.now()}.pdf`;

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

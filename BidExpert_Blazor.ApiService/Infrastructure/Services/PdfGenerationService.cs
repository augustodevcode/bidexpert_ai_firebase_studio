using System;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace BidExpert_Blazor.ApiService.Infrastructure.Services;

public class PdfGenerationService : IPdfGenerationService, IAsyncDisposable
{
    private IBrowser? _browser;

    public PdfGenerationService()
    {
        // A inicialização (download do browser) é adiada para a primeira chamada.
    }

    private async Task InitializeBrowserAsync()
    {
        if (_browser == null)
        {
            Console.WriteLine("Initializing browser for PDF generation...");
            using var browserFetcher = new BrowserFetcher();
            Console.WriteLine("Downloading Chromium. This might take a few minutes...");
            await browserFetcher.DownloadAsync();
            Console.WriteLine("Chromium downloaded. Launching browser...");
            _browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox" } // Necessário para rodar em alguns ambientes de contêiner
            });
            Console.WriteLine("Browser launched successfully.");
        }
    }

    public async Task<byte[]> GeneratePdfFromHtmlAsync(string htmlContent)
    {
        await InitializeBrowserAsync();

        if (_browser == null)
        {
            throw new InvalidOperationException("Puppeteer browser is not initialized.");
        }

        await using var page = await _browser.NewPageAsync();
        await page.SetContentAsync(htmlContent);

        var pdfOptions = new PdfOptions
        {
            Format = PaperFormat.A4,
            PrintBackground = true,
            MarginOptions = new MarginOptions
            {
                Top = "20px",
                Right = "20px",
                Bottom = "20px",
                Left = "20px"
            }
        };

        var pdfData = await page.PdfDataAsync(pdfOptions);
        return pdfData;
    }

    public async ValueTask DisposeAsync()
    {
        if (_browser != null)
        {
            await _browser.CloseAsync();
            _browser.Dispose();
        }
    }
}

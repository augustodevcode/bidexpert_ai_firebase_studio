using System;
using System.IO;
using System.Threading.Tasks;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Services;
using Microsoft.AspNetCore.Hosting;

namespace BidExpert_Blazor.ApiService.Infrastructure.Services;

public class LocalStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly string _storagePath;

    public LocalStorageService(IWebHostEnvironment env)
    {
        _env = env;
        _storagePath = Path.Combine(_env.ContentRootPath, "user_uploads");
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType, string subfolder)
    {
        var targetFolder = Path.Combine(_storagePath, subfolder);
        Directory.CreateDirectory(targetFolder);

        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(targetFolder, uniqueFileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(stream);

        // Retorna um caminho relativo ou URL que pode ser usado para acessar o arquivo
        return Path.Combine("user_uploads", subfolder, uniqueFileName).Replace("\\", "/");
    }
}

using BidExpert_Blazor.ApiService.Api;
using BidExpert_Blazor.ApiService.Application.Interfaces;
using BidExpert_Blazor.ApiService.Application.Services;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Repositories;
using BidExpert_Blazor.ApiService.Domain.Interfaces.Services;
using BidExpert_Blazor.ApiService.Infrastructure.Repositories;
using BidExpert_Blazor.ApiService.Infrastructure.Services;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;
using FirebaseAdmin.Auth;

var builder = WebApplication.CreateBuilder(args);

// ... (configuração do Firebase) ...

// Registrar serviços
builder.Services.AddScoped<IPdfGenerationService, PdfGenerationService>(); // Adicionado

builder.Services.AddSingleton<IFileStorageService, LocalStorageService>();
builder.Services.AddScoped<IDocumentApplicationService, DocumentApplicationService>();
// ... (outros registros) ...

var app = builder.Build();

// ... (pipeline) ...

app.Run();

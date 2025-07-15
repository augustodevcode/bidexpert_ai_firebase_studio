using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using BidExpert_Blazor.Web.Services.HttpClients.Implementations;
using MudBlazor.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services.AddMudServices();

builder.Services.AddHttpClient<IAuctionClientApiService, AuctionClientApiService>(client =>
{
    var baseAddress = builder.Configuration["ApiServiceBaseUrl"] ?? builder.Configuration.GetServiceUri("apiservice")?.ToString();
    if (!string.IsNullOrEmpty(baseAddress)) client.BaseAddress = new System.Uri(baseAddress);
    else client.BaseAddress = new System.Uri("https://localhost:5001");
});

builder.Services.AddHttpClient<IAuthClientApiService, AuthClientApiService>(client => { /* ... */ });
builder.Services.AddHttpClient<IUserClientApiService, UserClientApiService>(client => { /* ... */ });
builder.Services.AddHttpClient<ICatalogClientApiService, CatalogClientApiService>(client => { /* ... */ });
builder.Services.AddHttpClient<IAdminClientApiService, AdminClientApiService>(client => { // Adicionado
    var baseAddress = builder.Configuration["ApiServiceBaseUrl"] ?? builder.Configuration.GetServiceUri("apiservice")?.ToString();
    if (!string.IsNullOrEmpty(baseAddress)) client.BaseAddress = new System.Uri(baseAddress);
    else client.BaseAddress = new System.Uri("https://localhost:5001");
});


await builder.Build().RunAsync();

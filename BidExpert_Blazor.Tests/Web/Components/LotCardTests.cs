using Bunit;
using Xunit;
using BidExpert_Blazor.Web.Components;
using BidExpert_Blazor.ServiceDefaults.Dtos;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using BidExpert_Blazor.Web.Services.HttpClients.Interfaces;
using System.Globalization;

namespace BidExpert_Blazor.Tests.Web.Components;

public class LotCardTests : TestContext
{
    public LotCardTests()
    {
        // Mock dos serviços que o componente pode usar, como o de favoritar
        var mockUserApiService = new Mock<IUserClientApiService>();
        Services.AddSingleton(mockUserApiService.Object);
    }

    [Fact]
    public void LotCard_ShouldRenderCorrectly_WithGivenParameters()
    {
        // Arrange
        var lotDto = new LotDto
        {
            Id = "lot1",
            PublicId = "LOT-123",
            Title = "Lote de Teste Fantástico",
            Price = 1250.75m,
            ImageUrl = "/test-image.jpg",
            AuctionName = "Leilão de Teste"
        };

        var expectedPrice = lotDto.Price.ToString("C", new CultureInfo("pt-BR"));

        // Act
        var cut = RenderComponent<LotCard>(parameters => parameters
            .Add(p => p.Lot, lotDto)
        );

        // Assert
        // Verificar se o título está presente
        cut.Find("h3").MarkupMatches($"<h3 class=\"text-md font-semibold mb-2 truncate flex-grow\"><a href=\"/lots/LOT-123\">{lotDto.Title}</a></h3>");

        // Verificar se o preço está presente e formatado
        cut.Find("p.text-xl").MarkupMatches($"<p class=\"text-xl font-bold text-gray-900 mb-3\">{expectedPrice}</p>");

        // Verificar se a imagem está correta
        cut.Find("img").GetAttribute("src").Should().Be(lotDto.ImageUrl);

        // Verificar se o link de detalhes está correto
        cut.Find("a.w-full").GetAttribute("href").Should().Be($"/lots/{lotDto.PublicId}");
    }

    [Fact]
    public void LotCard_ShouldRenderPlaceholder_WhenLotIsNull()
    {
        // Arrange & Act
        var cut = RenderComponent<LotCard>(parameters => parameters
            .Add(p => p.Lot, null)
        );

        // Assert
        // O componente não deve quebrar e pode renderizar um estado vazio ou de esqueleto.
        // A implementação atual não lida bem com isso, mas um teste pode forçar essa melhoria.
        // Por enquanto, vamos verificar se ele não lança exceção (o que o RenderComponent já faz).
        // Podemos verificar se o HTML está vazio ou contém um placeholder.
        Assert.Contains("<!-- RENDER_MAIS_EXTENSO_DO_COMPONENTE", cut.Markup); // Exemplo de verificação de placeholder
    }
}

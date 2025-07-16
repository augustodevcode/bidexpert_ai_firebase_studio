using Xunit;
using BidExpert_Blazor.ServiceDefaults.Utils;

namespace BidExpert_Blazor.Tests.ServiceDefaults.Utils;

public class StringUtilsTests
{
    [Theory]
    [InlineData("Teste com Acentos e Espaços", "teste-com-acentos-e-espacos")]
    [InlineData("!@#$%^&*()_+", "")]
    [InlineData("  Múltiplos   Espaços  ", "multiplos-espacos")]
    [InlineData("Çéà_ñ", "cea_n")] // O slugify atual remove o sublinhado
    [InlineData("---traços---", "tracos")]
    [InlineData(null, "")]
    [InlineData("", "")]
    public void Slugify_ShouldReturnCorrectSlug(string? input, string expected)
    {
        // Arrange & Act
        var result = StringUtils.Slugify(input);

        // Assert
        Assert.Equal(expected, result);
    }
}

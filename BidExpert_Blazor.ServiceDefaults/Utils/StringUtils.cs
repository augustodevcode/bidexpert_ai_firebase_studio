using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace BidExpert_Blazor.ServiceDefaults.Utils;

public static class StringUtils
{
    public static string Slugify(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        // Normalizar para remover acentos
        string normalizedString = text.Normalize(NormalizationForm.FormD);
        StringBuilder stringBuilder = new StringBuilder();

        foreach (char c in normalizedString)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        // Converte para FormC após remover os diacríticos para garantir consistência
        string str = stringBuilder.ToString().Normalize(NormalizationForm.FormC);

        // Converter para minúsculas
        str = str.ToLowerInvariant();

        // Substituir espaços e alguns caracteres especiais por hífen
        // Regex atualizado para ser um pouco mais abrangente com separadores comuns
        str = Regex.Replace(str, @"\s+|[_\.~#\[\]@!\$&'\(\)\*\+,;=\\/<>%:\?]", "-");

        // Remover caracteres não alfanuméricos, exceto hífen
        // Mantém apenas a-z, 0-9 e -
        str = Regex.Replace(str, @"[^a-z0-9-]", "");

        // Remover hífens múltiplos
        str = Regex.Replace(str, @"--+", "-");

        // Remover hífens do início e do fim
        str = str.Trim('-');

        return str;
    }
}

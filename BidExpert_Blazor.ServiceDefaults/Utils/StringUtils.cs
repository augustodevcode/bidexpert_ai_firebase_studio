using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace BidExpert_Blazor.ServiceDefaults.Utils;

public static class StringUtils
{
    public static string Slugify(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return string.Empty;
        }

        // Converter para minúsculas
        string str = text.ToLowerInvariant();

        // Remover acentos (normalização Unicode para NFD e remoção de diacríticos)
        str = string.Concat(
            str.Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
        ).Normalize(NormalizationForm.FormC);

        // Substituir um ou mais espaços por um único hífen
        str = Regex.Replace(str, @"\s+", "-");

        // Remover quaisquer caracteres que não sejam letras (a-z), números (0-9) ou hífens
        // A expressão \w em Regex C# inclui letras, números e o underscore.
        // Para corresponder ao [^\w-]+ do JS (que remove não alfanuméricos exceto hífen),
        // precisamos de uma abordagem um pouco diferente, pois \w no .NET inclui underscore.
        // A lógica JS [^\w-]+ significa "qualquer caractere que NÃO seja (\w ou -)".
        // \w em JS é [A-Za-z0-9_]. Então [^\w-]+ é [^A-Za-z0-9_-].
        // Vamos construir um regex para remover caracteres que não são a-z, 0-9, ou -
        str = Regex.Replace(str, @"[^a-z0-9-]", "");

        // Substituir múltiplos hífens por um único hífen
        str = Regex.Replace(str, @"--+", "-");

        // Aparar (trim) hífens do início e do fim do resultado (embora a lógica JS original não faça isso explicitamente após as substituições, é uma boa prática)
        str = str.Trim('-');

        return str;
    }
}

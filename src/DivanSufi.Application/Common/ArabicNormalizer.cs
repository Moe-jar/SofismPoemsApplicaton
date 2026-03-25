using System.Text.RegularExpressions;

namespace DivanSufi.Application.Common;

public static class ArabicNormalizer
{
    public static string Normalize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        text = Regex.Replace(text, @"[\u0610-\u061A\u064B-\u065F\u0670]", string.Empty);
        text = text.Replace("\u0640", string.Empty);
        text = Regex.Replace(text, @"[أإآٱ]", "ا");
        text = text.Replace("ى", "ي");
        text = text.Replace("ة", "ه");
        text = text.Replace("ؤ", "و");
        text = text.Replace("ئ", "ي");
        text = Regex.Replace(text, @"\s+", " ").Trim();

        return text.ToLowerInvariant();
    }
}

using DivanSufi.Application.Common;
using Xunit;

namespace DivanSufi.Tests.Common;

public class ArabicNormalizerTests
{
    [Fact]
    public void Normalize_NullOrEmpty_ReturnsEmpty()
    {
        Assert.Equal(string.Empty, ArabicNormalizer.Normalize(null));
        Assert.Equal(string.Empty, ArabicNormalizer.Normalize(""));
        Assert.Equal(string.Empty, ArabicNormalizer.Normalize("   "));
    }

    [Fact]
    public void Normalize_RemovesTashkeel()
    {
        // Arabic text with tashkeel (diacritics)
        var withTashkeel = "كَتَبَ";
        var result = ArabicNormalizer.Normalize(withTashkeel);
        Assert.Equal("كتب", result);
    }

    [Fact]
    public void Normalize_RemovesTatweel()
    {
        var withTatweel = "كـتب";
        var result = ArabicNormalizer.Normalize(withTatweel);
        Assert.Equal("كتب", result);
    }

    [Theory]
    [InlineData("أحمد", "احمد")]
    [InlineData("إبراهيم", "ابراهيم")]
    [InlineData("آدم", "ادم")]
    public void Normalize_NormalizesAlefVariants(string input, string expected)
    {
        Assert.Equal(expected, ArabicNormalizer.Normalize(input));
    }

    [Fact]
    public void Normalize_NormalizesYa()
    {
        Assert.Equal("علي", ArabicNormalizer.Normalize("على"));
    }

    [Fact]
    public void Normalize_NormalizesTaMarbuta()
    {
        Assert.Equal("مدينه", ArabicNormalizer.Normalize("مدينة"));
    }

    [Fact]
    public void Normalize_TrimsExtraSpaces()
    {
        var result = ArabicNormalizer.Normalize("  بسم   الله  ");
        Assert.Equal("بسم الله", result);
    }

    [Fact]
    public void Normalize_SearchMatchesVariants()
    {
        // A search for "الله" should match "اللَّه" (with tashkeel)
        var normalized1 = ArabicNormalizer.Normalize("اللَّه");
        var normalized2 = ArabicNormalizer.Normalize("الله");
        Assert.Equal(normalized1, normalized2);
    }

    [Fact]
    public void Normalize_IsLowercase()
    {
        var result = ArabicNormalizer.Normalize("Hello World");
        Assert.Equal("hello world", result);
    }
}
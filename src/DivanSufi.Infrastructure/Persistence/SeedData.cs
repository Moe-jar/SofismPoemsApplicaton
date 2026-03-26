using DivanSufi.Application.Common;
using DivanSufi.Domain.Entities;
using DivanSufi.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DivanSufi.Infrastructure.Persistence;

public static class SeedData
{
    public static void Seed(AppDbContext context)
    {
        if (context.Database.IsRelational())
            context.Database.Migrate();
        else
            context.Database.EnsureCreated();

        if (!context.Users.Any())
        {
            var users = new List<User>
            {
                new() { FullName = "المنشد الرئيسي", Username = "lead", PasswordHash = BCrypt.Net.BCrypt.HashPassword("lead123"), Role = UserRole.LeadMunshid, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
                new() { FullName = "أحمد المنشد", Username = "ahmad", PasswordHash = BCrypt.Net.BCrypt.HashPassword("ahmad123"), Role = UserRole.Munshid, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
                new() { FullName = "محمد المنشد", Username = "mohammed", PasswordHash = BCrypt.Net.BCrypt.HashPassword("mohammed123"), Role = UserRole.Munshid, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            };
            context.Users.AddRange(users);
            context.SaveChanges();
        }

        if (!context.Maqamat.Any())
        {
            var maqamat = new List<Maqam>
            {
                new() { NameAr = "راست", NameEn = "Rast", SortOrder = 1, IsActive = true },
                new() { NameAr = "بياتي", NameEn = "Bayati", SortOrder = 2, IsActive = true },
                new() { NameAr = "حجاز", NameEn = "Hijaz", SortOrder = 3, IsActive = true },
                new() { NameAr = "صبا", NameEn = "Saba", SortOrder = 4, IsActive = true },
                new() { NameAr = "كرد", NameEn = "Kurd", SortOrder = 5, IsActive = true },
                new() { NameAr = "نهاوند", NameEn = "Nahawand", SortOrder = 6, IsActive = true },
                new() { NameAr = "عجم", NameEn = "Ajam", SortOrder = 7, IsActive = true },
                new() { NameAr = "عشيران", NameEn = "Ushayran", SortOrder = 8, IsActive = true },
                new() { NameAr = "سيكاه", NameEn = "Sikah", SortOrder = 9, IsActive = true },
                new() { NameAr = "جهاركاه", NameEn = "Jiharkah", SortOrder = 10, IsActive = true },
                new() { NameAr = "زنجران", NameEn = "Zanjaran", SortOrder = 11, IsActive = true },
                new() { NameAr = "نيروز", NameEn = "Nawruz", SortOrder = 12, IsActive = true },
            };
            context.Maqamat.AddRange(maqamat);
            context.SaveChanges();
        }

        if (!context.Poets.Any())
        {
            var poets = new List<Poet>
            {
                new() { NameAr = "جلال الدين الرومي", NameEn = "Rumi", Notes = "شاعر صوفي فارسي", CreatedAtUtc = DateTime.UtcNow },
                new() { NameAr = "ابن عربي", NameEn = "Ibn Arabi", Notes = "شيخ الأكبر", CreatedAtUtc = DateTime.UtcNow },
                new() { NameAr = "عمر بن الفارض", NameEn = "Ibn al-Farid", Notes = "سلطان العاشقين", CreatedAtUtc = DateTime.UtcNow },
                new() { NameAr = "الحلاج", NameEn = "Al-Hallaj", Notes = "الشيخ المستشهد", CreatedAtUtc = DateTime.UtcNow },
                new() { NameAr = "رابعة العدوية", NameEn = "Rabia al-Adawiyya", Notes = "أميرة العاشقين", CreatedAtUtc = DateTime.UtcNow },
                new() { NameAr = "شمس التبريزي", NameEn = "Shams Tabrizi", Notes = "شمس الحقيقة", CreatedAtUtc = DateTime.UtcNow },
            };
            context.Poets.AddRange(poets);
            context.SaveChanges();
        }

        if (!context.Poems.Any())
        {
            var leadUser = context.Users.First(u => u.Username == "lead");
            var rumiPoet = context.Poets.First(p => p.NameAr == "جلال الدين الرومي");
            var ibnFaridPoet = context.Poets.First(p => p.NameAr == "عمر بن الفارض");
            var hallajPoet = context.Poets.First(p => p.NameAr == "الحلاج");
            var bayati = context.Maqamat.First(m => m.NameAr == "بياتي");
            var hijaz = context.Maqamat.First(m => m.NameAr == "حجاز");
            var rast = context.Maqamat.First(m => m.NameAr == "راست");
            var saba = context.Maqamat.First(m => m.NameAr == "صبا");

            var poems = new List<Poem>
            {
                new()
                {  
                    Title = "بشنو این نی",
                    Body = "بشنو این نی چون شکایت می‌کند\nاز جدایی‌ها حکایت می‌کند\n\nبشنو اين ني چون شكايت مي‌كند\nاز جدايي‌ها حكايت مي‌كند\n\nهر كسي كو دور ماند از اصل خويش\nباز جويد روزگار وصل خويش",
                    PoetId = rumiPoet.Id,
                    MaqamId = bayati.Id,
                    Category = PoemCategory.Ilahiyyat,
                    Notes = "مطلع المثنوي - من أشهر قصائد الرومي",
                    SearchNormalizedTitle = ArabicNormalizer.Normalize("بشنو این نی"),
                    SearchNormalizedBody = ArabicNormalizer.Normalize("بشنو این نی چون شکایت می‌کند"),
                    SearchNormalizedPoet = ArabicNormalizer.Normalize("جلال الدين الرومي"),
                    CreatedByUserId = leadUser.Id,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                      
                    Title = "أنا من أهوى",
                    Body = "أنا من أهوى ومن أهوى أنا\nنحن روحان حللنا بدنا\n\nفإذا أبصرتني أبصرته\nوإذا أبصرته أبصرتنا\n\nيا نسيم الريح بلّغ من نهوى\nأن نار الشوق لا تُطفأ بنا",
                    PoetId = hallajPoet.Id,
                    MaqamId = hijaz.Id,
                    Category = PoemCategory.Ilahiyyat,
                    Notes = "من أشهر أشعار الحلاج في وحدة الوجود",
                    SearchNormalizedTitle = ArabicNormalizer.Normalize("أنا من أهوى"),
                    SearchNormalizedBody = ArabicNormalizer.Normalize("أنا من أهوى ومن أهوى أنا"),
                    SearchNormalizedPoet = ArabicNormalizer.Normalize("الحلاج"),
                    CreatedByUserId = leadUser.Id,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    
                    Title = "شُغلي بذكرك",
                    Body = "شغلت بذكرك ما بيني وبين الهوى\nوغيّبتني حتى ما أُحسّ سواكا\n\nوصرت في كل ما أرى وكل ما أسمع\nومَن سواك رآك وليس يراكا",
                    PoetId = rumiPoet.Id,
                    MaqamId = rast.Id,
                    Category = PoemCategory.Hadra,
                    HadraSection = HadraSection.Matali,
                    Notes = "تُغنى في بداية الحضرة",
                    SearchNormalizedTitle = ArabicNormalizer.Normalize("شغلي بذكرك"),
                    SearchNormalizedBody = ArabicNormalizer.Normalize("شغلت بذكرك ما بيني وبين الهوى"),
                    SearchNormalizedPoet = ArabicNormalizer.Normalize("جلال الدين الرومي"),
                    CreatedByUserId = leadUser.Id,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                   
                    Title = "خمرة الحب",
                    Body = "شربنا على ذكر الحبيب مدامةً\nسكرنا بها من قبل أن يُخلق الكرم\n\nلها البدر كأس والشمس دنّها\nوكم من ندامى في الوجود مُكرَّم\n\nفمن لم يذق منها بقي في حجابه\nومن شرب الكأسَ المصفّى تكلّم",
                    PoetId = ibnFaridPoet.Id,
                    MaqamId = saba.Id,
                    Category = PoemCategory.Nabawiyyat,
                    Notes = "من خمريات ابن الفارض - الخمر الصوفية",
                    SearchNormalizedTitle = ArabicNormalizer.Normalize("خمرة الحب"),
                    SearchNormalizedBody = ArabicNormalizer.Normalize("شربنا على ذكر الحبيب مدامة"),
                    SearchNormalizedPoet = ArabicNormalizer.Normalize("عمر بن الفارض"),
                    CreatedByUserId = leadUser.Id,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new()
                {  
                    Title = "يا ليل الصب",
                    Body = "يا ليل الصبّ متى غده\nأقيام الساعة موعده\n\nرحم الله أمرأً قال آمين\nثم قال الصلاة تسعده\n\nيا رسول الله يا خير الورى\nأنت بدر التم ما أجوده",
                    PoetId = ibnFaridPoet.Id,
                    MaqamId = bayati.Id,
                    Category = PoemCategory.Hadra,
                    HadraSection = HadraSection.Qiyam,
                    Notes = "من القيام في الحضرة",
                    SearchNormalizedTitle = ArabicNormalizer.Normalize("يا ليل الصب"),
                    SearchNormalizedBody = ArabicNormalizer.Normalize("يا ليل الصب متى غده"),
                    SearchNormalizedPoet = ArabicNormalizer.Normalize("عمر بن الفارض"),
                    CreatedByUserId = leadUser.Id,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                },
                new()
                {  
                    Title = "الهي",
                    Body = "إلهي لست للفردوس أهلاً\nولا أقوى على نار الجحيم\n\nفهب لي توبة واغفر ذنوبي\nفإنك غافر الذنب العظيم\n\nوعاملني بفضلك يا إلهي\nوخذ بيدي وأقلني من هميم",
                    PoetId = context.Poets.First(p => p.NameAr == "رابعة العدوية").Id,
                    MaqamId = hijaz.Id,
                    Category = PoemCategory.Ilahiyyat,
                    Notes = "دعاء رابعة المشهور",
                    SearchNormalizedTitle = ArabicNormalizer.Normalize("الهي"),
                    SearchNormalizedBody = ArabicNormalizer.Normalize("إلهي لست للفردوس أهلا"),
                    SearchNormalizedPoet = ArabicNormalizer.Normalize("رابعة العدوية"),
                    CreatedByUserId = leadUser.Id,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                },
            };
            context.Poems.AddRange(poems);
            context.SaveChanges();

            var wasla = new Wasla
            {
                
                Name = "وصلة الإلهيات",
                Description = "وصلة من أجمل القصائد الإلهية الصوفية",
                CreatedByUserId = leadUser.Id,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };
            context.Waslat.Add(wasla);
            context.SaveChanges();

            var waslaItems = new List<WaslaItem>
            {
                new() {WaslaId = wasla.Id, PoemId = poems[0].Id, SortOrder = 1 },
                new() {WaslaId = wasla.Id, PoemId = poems[1].Id, SortOrder = 2 },
                new() {WaslaId = wasla.Id, PoemId = poems[5].Id, SortOrder = 3 },
            };
            context.WaslaItems.AddRange(waslaItems);
            context.SaveChanges();
        }
    }
}

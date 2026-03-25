using DivanSufi.Domain.Entities;

namespace DivanSufi.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(User user);
}

namespace DivanSufi.Application.DTOs.Auth;

public record LoginResponse(string Token, string FullName, string Role, int UserId);

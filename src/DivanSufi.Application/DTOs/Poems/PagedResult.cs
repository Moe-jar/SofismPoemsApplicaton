namespace DivanSufi.Application.DTOs.Poems;

public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize);

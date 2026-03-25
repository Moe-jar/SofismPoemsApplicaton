namespace DivanSufi.Application.DTOs.Waslat;

public record ReorderWaslaItemsRequest(IEnumerable<WaslaItemOrder> Items);
public record WaslaItemOrder(int ItemId, int SortOrder);

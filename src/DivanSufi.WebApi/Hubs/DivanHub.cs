using Microsoft.AspNetCore.SignalR;

namespace DivanSufi.WebApi.Hubs;

public class DivanHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "all");
        await base.OnConnectedAsync();
    }
}

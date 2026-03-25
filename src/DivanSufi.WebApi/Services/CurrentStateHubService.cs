using DivanSufi.Application.Interfaces;
using DivanSufi.WebApi.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace DivanSufi.WebApi.Services;

public class CurrentStateHubService : ICurrentStateHub
{
    private readonly IHubContext<DivanHub> _hubContext;

    public CurrentStateHubService(IHubContext<DivanHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task BroadcastCurrentPoemAsync(object poemDto)
    {
        await _hubContext.Clients.Group("all").SendAsync("CurrentPoemUpdated", poemDto);
    }

    public async Task BroadcastCurrentWaslaAsync(object waslaDto)
    {
        await _hubContext.Clients.Group("all").SendAsync("CurrentWaslaUpdated", waslaDto);
    }
}

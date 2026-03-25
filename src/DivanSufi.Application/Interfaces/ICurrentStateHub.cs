namespace DivanSufi.Application.Interfaces;

public interface ICurrentStateHub
{
    Task BroadcastCurrentPoemAsync(object poemDto);
    Task BroadcastCurrentWaslaAsync(object waslaDto);
}

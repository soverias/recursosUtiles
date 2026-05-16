using System.Security.Claims;
using BangGame.Application.UseCases;
using BangGame.Domain.Entities;
using BangGame.Domain.ValueObjects;
using BangGame.Infrastructure.Matchmaking;
using BangGame.Infrastructure.RoomManager;
using Microsoft.AspNetCore.SignalR;

namespace RecursosUtiles.Api.Hubs;

/// <summary>
/// Real-time hub for Bang Game.
/// Authentication is optional: registered users send a JWT Bearer token,
/// guests connect without a token and pass ?username=Invitado_XXXX in the query string.
///
/// The game loop (CountdownStart → Bang) is a background Task that uses
/// IHubContext so it can send messages after the originating Hub method has returned.
/// </summary>
public sealed class GameHub(
    MatchmakingService matchmaking,
    RoomService roomService,
    RecordGameResultUseCase recordResult,
    IHubContext<GameHub> hubContext,
    ILogger<GameHub> logger) : Hub
{
    // ── Connection lifecycle ──────────────────────────────────────────────────

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await HandleLeaveAsync(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    // ── Client-invoked methods ────────────────────────────────────────────────

    public async Task JoinRandom()
    {
        var (username, userId) = GetPlayerInfo();
        var connId = Context.ConnectionId;

        if (roomService.GetRoomForConnection(connId) is not null)
        {
            await Clients.Caller.SendAsync("Error", "Ya estás en una sala.");
            return;
        }

        if (matchmaking.IsInQueue(connId)) return;

        matchmaking.Enqueue(connId, username, userId);

        var match = matchmaking.TryMatch();
        if (match is null) return; // waiting for a second player

        var (e1, e2) = match.Value;
        var room = roomService.CreateRoom(isPrivate: false);
        var p1 = new Player(e1.ConnectionId, e1.Username, e1.UserId);
        var p2 = new Player(e2.ConnectionId, e2.Username, e2.UserId);

        room.TryAddPlayer(p1);
        room.TryAddPlayer(p2);
        roomService.MapConnection(p1.ConnectionId, room.Id);
        roomService.MapConnection(p2.ConnectionId, room.Id);

        await Groups.AddToGroupAsync(p1.ConnectionId, room.Id);
        await Groups.AddToGroupAsync(p2.ConnectionId, room.Id);

        await Clients.Client(p1.ConnectionId).SendAsync("OpponentJoined", new
        {
            roomId           = room.Id,
            opponentUsername = p2.Username
        });
        await Clients.Client(p2.ConnectionId).SendAsync("OpponentJoined", new
        {
            roomId           = room.Id,
            opponentUsername = p1.Username
        });

        logger.LogInformation("Matched {P1} vs {P2} in room {RoomId}", p1.Username, p2.Username, room.Id);
    }

    public async Task CreatePrivateRoom()
    {
        var (username, userId) = GetPlayerInfo();
        var connId = Context.ConnectionId;

        if (roomService.GetRoomForConnection(connId) is not null)
        {
            await Clients.Caller.SendAsync("Error", "Ya estás en una sala.");
            return;
        }

        var room   = roomService.CreateRoom(isPrivate: true);
        var player = new Player(connId, username, userId);
        room.TryAddPlayer(player);
        roomService.MapConnection(connId, room.Id);
        await Groups.AddToGroupAsync(connId, room.Id);

        await Clients.Caller.SendAsync("RoomCreated", new
        {
            roomId = room.Id,
            code   = room.Code.Value
        });
    }

    public async Task JoinPrivateRoom(string code)
    {
        var (username, userId) = GetPlayerInfo();
        var connId = Context.ConnectionId;

        var room = roomService.FindByCode(code);
        if (room is null || room.IsFull)
        {
            await Clients.Caller.SendAsync("Error", "Sala no encontrada");
            return;
        }

        var joiner = new Player(connId, username, userId);
        if (!room.TryAddPlayer(joiner))
        {
            await Clients.Caller.SendAsync("Error", "Sala no encontrada");
            return;
        }

        roomService.MapConnection(connId, room.Id);
        await Groups.AddToGroupAsync(connId, room.Id);

        var creator = room.GetOpponent(connId)!;

        await Clients.Client(creator.ConnectionId).SendAsync("OpponentJoined", new
        {
            roomId           = room.Id,
            opponentUsername = joiner.Username
        });
        await Clients.Caller.SendAsync("OpponentJoined", new
        {
            roomId           = room.Id,
            opponentUsername = creator.Username
        });
    }

    public async Task SendReady()
    {
        var room = roomService.GetRoomForConnection(Context.ConnectionId);
        if (room is null) return;

        bool bothReady = room.MarkReady(Context.ConnectionId);
        if (!bothReady)
        {
            var opponent = room.GetOpponent(Context.ConnectionId);
            if (opponent is not null)
                await Clients.Client(opponent.ConnectionId).SendAsync("OpponentReady");
            return;
        }

        await Clients.Group(room.Id).SendAsync("BothReady");
        StartGameLoop(room);
    }

    public async Task SendTap()
    {
        var tapTime = DateTime.UtcNow;
        var room    = roomService.GetRoomForConnection(Context.ConnectionId);
        if (room is null) return;

        var result = room.ProcessTap(Context.ConnectionId, tapTime);
        if (result is null) return;

        // Cancel any in-flight game loop (covers false-start during Countdown/WaitingBang)
        roomService.CancelGameLoop(room.Id);

        await Clients.Group(room.Id).SendAsync("RoundResult", new
        {
            winnerId         = result.Winner.Username,
            loserId          = result.Loser.Username,
            winnerReactionMs = result.WinnerReactionMs,
            loserReactionMs  = result.LoserReactionMs,
            isFalseStart     = result.IsFalseStart
        });

        // Persist only when both players are registered
        if (result.ShouldPersist)
        {
            await recordResult.ExecuteAsync(new RecordGameResultCommand(
                result.Winner.UserId!.Value,
                result.Loser.UserId!.Value,
                result.WinnerReactionMs,
                result.LoserReactionMs,
                result.IsFalseStart));
        }
    }

    public async Task Repeat()
    {
        var room = roomService.GetRoomForConnection(Context.ConnectionId);
        if (room is null) return;

        bool bothConfirmed = room.MarkRepeat(Context.ConnectionId);
        if (!bothConfirmed)
        {
            var opponent = room.GetOpponent(Context.ConnectionId);
            if (opponent is not null)
                await Clients.Client(opponent.ConnectionId).SendAsync("OpponentWantsRematch");
            return;
        }

        room.ResetForNextRound();
        await Clients.Group(room.Id).SendAsync("BothReady");
        StartGameLoop(room);
    }

    public async Task LeaveRoom()
    {
        await HandleLeaveAsync(Context.ConnectionId);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void StartGameLoop(Room room)
    {
        var ct = roomService.CreateGameLoopToken(room.Id);
        // Fire-and-forget; exceptions are caught inside RunGameLoopAsync
        _ = Task.Run(() => RunGameLoopAsync(room.Id, ct), CancellationToken.None);
    }

    private async Task RunGameLoopAsync(string roomId, CancellationToken ct)
    {
        try
        {
            var room = roomService.GetRoom(roomId);
            if (room is null) return;

            room.TransitionTo(GamePhase.Countdown);
            await hubContext.Clients.Group(roomId).SendAsync("CountdownStart", cancellationToken: ct);

            await Task.Delay(3_000, ct);

            room.TransitionTo(GamePhase.WaitingBang);
            await Task.Delay(Random.Shared.Next(100, 2_001), ct);

            // If the round was already resolved by a false-start tap, bail out
            if (room.Phase == GamePhase.Result) return;

            var bangTime = DateTime.UtcNow;
            room.SetBangActive(bangTime);
            await hubContext.Clients.Group(roomId).SendAsync("Bang", cancellationToken: ct);
        }
        catch (OperationCanceledException)
        {
            logger.LogDebug("Game loop cancelled for room {RoomId}", roomId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled error in game loop for room {RoomId}", roomId);
        }
    }

    private async Task HandleLeaveAsync(string connectionId)
    {
        matchmaking.Remove(connectionId);

        var room = roomService.GetRoomForConnection(connectionId);
        if (room is null) return;

        roomService.UnmapConnection(connectionId);
        roomService.CancelGameLoop(room.Id);
        room.RemovePlayer(connectionId);

        var opponent = room.Players.FirstOrDefault();
        if (opponent is not null)
        {
            await hubContext.Clients.Client(opponent.ConnectionId).SendAsync("OpponentLeft");
        }
        else
        {
            roomService.RemoveRoom(room.Id);
        }

        await Groups.RemoveFromGroupAsync(connectionId, room.Id);
    }

    private (string Username, Guid? UserId) GetPlayerInfo()
    {
        var user = Context.User;

        if (user?.Identity?.IsAuthenticated == true)
        {
            var username = user.FindFirst(ClaimTypes.Name)?.Value
                        ?? user.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value
                        ?? "Unknown";
            var sub    = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            var userId = sub is not null && Guid.TryParse(sub, out var id) ? id : (Guid?)null;
            return (username, userId);
        }

        var queryName = Context.GetHttpContext()?.Request.Query["username"].ToString();
        return (string.IsNullOrWhiteSpace(queryName)
            ? $"Invitado_{Random.Shared.Next(1000, 9999)}"
            : queryName, null);
    }

    // Needed for claim name constant without extra using
    private static class JwtRegisteredClaimNames
    {
        public const string Sub        = "sub";
        public const string UniqueName = "unique_name";
    }
}

using System.Collections.Concurrent;
using BangGame.Domain.Entities;
using BangGame.Domain.ValueObjects;

namespace BangGame.Infrastructure.RoomManager;

/// <summary>
/// Thread-safe in-memory registry of active rooms.
/// All rooms exist only for the server's lifetime; state is lost on restart.
/// </summary>
public sealed class RoomService
{
    private readonly ConcurrentDictionary<string, Room>   _rooms         = new();
    private readonly ConcurrentDictionary<string, string> _connToRoom    = new();
    private readonly ConcurrentDictionary<string, string> _codeToRoom    = new();
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _loopCts = new();

    // ── Room lifecycle ────────────────────────────────────────────────────────

    public Room CreateRoom(bool isPrivate = false)
    {
        var id = Guid.NewGuid().ToString("N");
        var code = GenerateUniqueCode();
        var room = new Room(id, code, isPrivate);
        _rooms[id] = room;
        _codeToRoom[code.Value] = id;
        return room;
    }

    public Room? GetRoom(string roomId) =>
        _rooms.TryGetValue(roomId, out var r) ? r : null;

    public Room? FindByCode(string code) =>
        _codeToRoom.TryGetValue(code.ToUpperInvariant(), out var id) ? GetRoom(id) : null;

    public void RemoveRoom(string roomId)
    {
        if (!_rooms.TryRemove(roomId, out var room)) return;
        _codeToRoom.TryRemove(room.Code.Value, out _);
        CancelGameLoop(roomId);
    }

    // ── Connection mapping ────────────────────────────────────────────────────

    public Room? GetRoomForConnection(string connectionId) =>
        _connToRoom.TryGetValue(connectionId, out var roomId) ? GetRoom(roomId) : null;

    public void MapConnection(string connectionId, string roomId) =>
        _connToRoom[connectionId] = roomId;

    public void UnmapConnection(string connectionId) =>
        _connToRoom.TryRemove(connectionId, out _);

    // ── Game-loop cancellation ────────────────────────────────────────────────

    /// <summary>Creates a fresh CancellationToken for the room's game loop.</summary>
    public CancellationToken CreateGameLoopToken(string roomId)
    {
        // Cancel and dispose any previous CTS for this room
        CancelGameLoop(roomId);
        var cts = new CancellationTokenSource();
        _loopCts[roomId] = cts;
        return cts.Token;
    }

    public void CancelGameLoop(string roomId)
    {
        if (_loopCts.TryRemove(roomId, out var cts))
        {
            cts.Cancel();
            cts.Dispose();
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private RoomCode GenerateUniqueCode()
    {
        RoomCode code;
        do { code = RoomCode.Generate(); }
        while (_codeToRoom.ContainsKey(code.Value));
        return code;
    }
}

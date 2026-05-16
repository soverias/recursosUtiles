using BangGame.Infrastructure.RoomManager;
using Xunit;

namespace BangGame.Tests.Infrastructure;

public sealed class RoomServiceTests
{
    [Fact]
    public void CreateRoom_produces_unique_codes_across_many_rooms()
    {
        // Exercises the retry loop in RoomService.GenerateUniqueCode:
        // even with collisions in raw RoomCode.Generate, the service must
        // keep retrying until a non-colliding code is produced.
        var service = new RoomService();
        const int roomCount = 2_000;
        var codes = new HashSet<string>(roomCount);

        for (var i = 0; i < roomCount; i++)
        {
            var room = service.CreateRoom();
            codes.Add(room.Code.Value);
        }

        Assert.Equal(roomCount, codes.Count);
    }

    [Fact]
    public void CreateRoom_registers_room_lookup_by_id_and_by_code()
    {
        var service = new RoomService();

        var room = service.CreateRoom();

        Assert.Same(room, service.GetRoom(room.Id));
        Assert.Same(room, service.FindByCode(room.Code.Value));
    }

    [Fact]
    public void FindByCode_is_case_insensitive()
    {
        var service = new RoomService();

        var room = service.CreateRoom();

        Assert.Same(room, service.FindByCode(room.Code.Value.ToLowerInvariant()));
    }

    [Fact]
    public void RemoveRoom_releases_the_code_for_future_reuse()
    {
        var service = new RoomService();
        var room = service.CreateRoom();
        var code = room.Code.Value;

        service.RemoveRoom(room.Id);

        Assert.Null(service.GetRoom(room.Id));
        Assert.Null(service.FindByCode(code));
    }
}

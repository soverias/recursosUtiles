import { TestBed } from '@angular/core/testing';
import { GameHubService } from './game-hub.service';
import { SignalRService } from './signalr.service';

const makeSignalRStub = () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  invoke: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  off: vi.fn(),
  isConnected: vi.fn().mockReturnValue(false),
});

describe('GameHubService', () => {
  let service: GameHubService;
  let signalr: ReturnType<typeof makeSignalRStub>;

  beforeEach(() => {
    signalr = makeSignalRStub();
    TestBed.configureTestingModule({
      providers: [
        GameHubService,
        { provide: SignalRService, useValue: signalr },
      ],
    });
    service = TestBed.inject(GameHubService);
  });

  // --- join methods ---

  it('joinRandom invokes hub method JoinRandom', async () => {
    await service.joinRandom();
    expect(signalr.invoke).toHaveBeenCalledWith('JoinRandom');
  });

  it('joinPrivate invokes hub method JoinPrivate with room code', async () => {
    await service.joinPrivate('ABC123');
    expect(signalr.invoke).toHaveBeenCalledWith('JoinPrivate', 'ABC123');
  });

  it('createPrivateRoom invokes hub method CreatePrivateRoom', async () => {
    await service.createPrivateRoom();
    expect(signalr.invoke).toHaveBeenCalledWith('CreatePrivateRoom');
  });

  // --- game lifecycle methods ---

  it('sendReady invokes hub method SendReady', async () => {
    await service.sendReady();
    expect(signalr.invoke).toHaveBeenCalledWith('SendReady');
  });

  it('sendTap invokes hub method SendTap', async () => {
    await service.sendTap();
    expect(signalr.invoke).toHaveBeenCalledWith('SendTap');
  });

  it('repeat invokes hub method Repeat', async () => {
    await service.repeat();
    expect(signalr.invoke).toHaveBeenCalledWith('Repeat');
  });

  it('leaveRoom invokes hub method LeaveRoom', async () => {
    await service.leaveRoom();
    expect(signalr.invoke).toHaveBeenCalledWith('LeaveRoom');
  });

  // TRIANGULATE: connect/disconnect delegation

  it('connect delegates to signalr.connect with hub URL', async () => {
    await service.connect();
    expect(signalr.connect).toHaveBeenCalledWith('http://localhost:5000/hubs/game');
  });

  it('disconnect delegates to signalr.disconnect', async () => {
    await service.disconnect();
    expect(signalr.disconnect).toHaveBeenCalledOnce();
  });
});
